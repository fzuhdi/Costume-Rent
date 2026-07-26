package services

import (
	"bytes"
	"context"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type PaymentGateway interface {
	CreateTransaction(context.Context, GatewayCreateRequest) (*GatewayCreateResponse, error)
	GetStatus(context.Context, string) (*GatewayStatus, error)
	Expire(context.Context, string) error
	Refund(context.Context, string, GatewayRefundRequest) error
	VerifyNotificationSignature(GatewayNotification) bool
}

type GatewayCreateRequest struct {
	OrderID       string
	Amount        int
	CustomerName  string
	Email         string
	Phone         string
	ExpiryMinutes int
}

type GatewayCreateResponse struct {
	RedirectURL string
}

type GatewayRefundRequest struct {
	OperationID string
	Amount      int
	Reason      string
}

type GatewayNotification struct {
	OrderID           string `json:"order_id"`
	TransactionID     string `json:"transaction_id"`
	TransactionStatus string `json:"transaction_status"`
	TransactionTime   string `json:"transaction_time"`
	SettlementTime    string `json:"settlement_time"`
	StatusCode        string `json:"status_code"`
	GrossAmount       string `json:"gross_amount"`
	FraudStatus       string `json:"fraud_status"`
	PaymentType       string `json:"payment_type"`
	SignatureKey      string `json:"signature_key"`
}

type GatewayStatus struct {
	OrderID           string `json:"order_id"`
	TransactionID     string `json:"transaction_id"`
	TransactionStatus string `json:"transaction_status"`
	TransactionTime   string `json:"transaction_time"`
	SettlementTime    string `json:"settlement_time"`
	GrossAmount       string `json:"gross_amount"`
	FraudStatus       string `json:"fraud_status"`
	PaymentType       string `json:"payment_type"`
}

type MidtransGateway struct {
	serverKey string
	snapURL   string
	apiURL    string
	client    *http.Client
}

func NewMidtransGateway() *MidtransGateway {
	production := strings.EqualFold(os.Getenv("MIDTRANS_ENVIRONMENT"), "production")
	snapURL := "https://app.sandbox.midtrans.com"
	apiURL := "https://api.sandbox.midtrans.com"
	if production {
		snapURL = "https://app.midtrans.com"
		apiURL = "https://api.midtrans.com"
	}
	return &MidtransGateway{
		serverKey: os.Getenv("MIDTRANS_SERVER_KEY"),
		snapURL:   snapURL,
		apiURL:    apiURL,
		client:    &http.Client{Timeout: 15 * time.Second},
	}
}

func (g *MidtransGateway) CreateTransaction(ctx context.Context, input GatewayCreateRequest) (*GatewayCreateResponse, error) {
	if g.serverKey == "" {
		return nil, fmt.Errorf("MIDTRANS_SERVER_KEY is required")
	}
	payload := map[string]interface{}{
		"transaction_details": map[string]interface{}{
			"order_id":     input.OrderID,
			"gross_amount": input.Amount,
		},
		"customer_details": map[string]interface{}{
			"first_name": input.CustomerName,
			"email":      input.Email,
			"phone":      input.Phone,
		},
		"credit_card": map[string]interface{}{"secure": true},
		"page_expiry": map[string]interface{}{
			"duration": input.ExpiryMinutes,
			"unit":     "minutes",
		},
	}
	var response struct {
		RedirectURL string `json:"redirect_url"`
	}
	if err := g.doJSON(ctx, http.MethodPost, g.snapURL+"/snap/v1/transactions", payload, &response); err != nil {
		return nil, err
	}
	if err := validateProviderURL(response.RedirectURL); err != nil {
		return nil, err
	}
	return &GatewayCreateResponse{RedirectURL: response.RedirectURL}, nil
}

func (g *MidtransGateway) GetStatus(ctx context.Context, orderID string) (*GatewayStatus, error) {
	var response GatewayStatus
	endpoint := g.apiURL + "/v2/" + url.PathEscape(orderID) + "/status"
	if err := g.doJSON(ctx, http.MethodGet, endpoint, nil, &response); err != nil {
		return nil, err
	}
	return &response, nil
}

func (g *MidtransGateway) Expire(ctx context.Context, orderID string) error {
	endpoint := g.apiURL + "/v2/" + url.PathEscape(orderID) + "/expire"
	return g.doJSON(ctx, http.MethodPost, endpoint, map[string]interface{}{}, nil)
}

func (g *MidtransGateway) Refund(ctx context.Context, orderID string, input GatewayRefundRequest) error {
	endpoint := g.apiURL + "/v2/" + url.PathEscape(orderID) + "/refund/online/direct"
	payload := map[string]interface{}{
		"refund_key": input.OperationID,
		"amount":     input.Amount,
		"reason":     input.Reason,
	}
	return g.doJSON(ctx, http.MethodPost, endpoint, payload, nil)
}

func (g *MidtransGateway) VerifyNotificationSignature(notification GatewayNotification) bool {
	value := notification.OrderID + notification.StatusCode + notification.GrossAmount + g.serverKey
	sum := sha512.Sum512([]byte(value))
	return strings.EqualFold(notification.SignatureKey, hex.EncodeToString(sum[:]))
}

func (g *MidtransGateway) doJSON(ctx context.Context, method, endpoint string, payload interface{}, target interface{}) error {
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = bytes.NewReader(encoded)
	}
	request, err := http.NewRequestWithContext(ctx, method, endpoint, body)
	if err != nil {
		return err
	}
	request.SetBasicAuth(g.serverKey, "")
	request.Header.Set("Accept", "application/json")
	if payload != nil {
		request.Header.Set("Content-Type", "application/json")
	}

	response, err := g.client.Do(request)
	if err != nil {
		return err
	}
	defer func() {
		_ = response.Body.Close()
	}()
	limited := io.LimitReader(response.Body, 1<<20)
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		message, _ := io.ReadAll(limited)
		return fmt.Errorf("midtrans returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(message)))
	}
	if target == nil {
		_, err = io.Copy(io.Discard, limited)
		return err
	}
	return json.NewDecoder(limited).Decode(target)
}

func validateProviderURL(rawURL string) error {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" || parsed.Host == "" {
		return fmt.Errorf("invalid provider redirect URL")
	}
	if parsed.Host != "app.midtrans.com" && parsed.Host != "app.sandbox.midtrans.com" {
		return fmt.Errorf("untrusted provider redirect URL")
	}
	return nil
}
