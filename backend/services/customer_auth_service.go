package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/mail"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
	"github.com/busana/backend/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CustomerAuthService struct {
	now func() time.Time
}

func NewCustomerAuthService() *CustomerAuthService {
	return &CustomerAuthService{now: time.Now}
}

func (s *CustomerAuthService) Register(request dto.RegisterCustomerRequest) (*dto.CustomerIdentityResponse, error) {
	email, err := normalizeCustomerEmail(request.Email)
	if err != nil || len(request.Password) < 8 || len(request.Password) > 72 {
		return nil, utils.NewAppError("ERR_INVALID_CUSTOMER_REGISTRATION")
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	rawToken, tokenHash, err := newCustomerToken()
	if err != nil {
		return nil, err
	}
	var account models.CustomerAccount
	var client models.Client
	err = config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("email = ?", email).First(&models.CustomerAccount{}).Error; err == nil {
			return utils.NewAppError("ERR_CUSTOMER_EMAIL_EXISTS")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		client = models.Client{Name: strings.TrimSpace(request.Name), Phone: strings.TrimSpace(request.Phone)}
		if err := tx.Create(&client).Error; err != nil {
			return err
		}
		account = models.CustomerAccount{
			ClientID: client.ID, Email: email, PasswordHash: string(passwordHash), Status: "active",
		}
		if err := tx.Create(&account).Error; err != nil {
			return err
		}
		token := models.CustomerAuthToken{
			CustomerAccountID: account.ID, Purpose: "verify_email", TokenHash: tokenHash,
			ExpiresAt: s.now().Add(24 * time.Hour),
		}
		return tx.Create(&token).Error
	})
	if err != nil {
		return nil, err
	}
	s.sendAuthEmail(account, "verify_email", rawToken)
	return customerIdentity(account, client), nil
}

func (s *CustomerAuthService) Login(request dto.CustomerLoginRequest) (*dto.CustomerIdentityResponse, error) {
	email, err := normalizeCustomerEmail(request.Email)
	if err != nil {
		return nil, utils.NewAppError("ERR_INVALID_CUSTOMER_CREDENTIALS")
	}
	var account models.CustomerAccount
	if err := config.DB.Preload("Client").Where("email = ?", email).First(&account).Error; err != nil {
		return nil, utils.NewAppError("ERR_INVALID_CUSTOMER_CREDENTIALS")
	}
	if account.PasswordHash == "" || bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(request.Password)) != nil {
		return nil, utils.NewAppError("ERR_INVALID_CUSTOMER_CREDENTIALS")
	}
	if account.EmailVerifiedAt == nil {
		return nil, utils.NewAppError("ERR_EMAIL_NOT_VERIFIED")
	}
	if account.Status != "active" {
		return nil, utils.NewAppError("ERR_CUSTOMER_ACCOUNT_INACTIVE")
	}
	now := s.now()
	_ = config.DB.Model(&account).Update("last_login_at", now).Error
	return customerIdentity(account, account.Client), nil
}

func (s *CustomerAuthService) VerifyEmail(rawToken string) error {
	return s.consumeToken(rawToken, "verify_email", func(tx *gorm.DB, accountID uint) error {
		now := s.now()
		return tx.Model(&models.CustomerAccount{}).Where("id = ?", accountID).Update("email_verified_at", now).Error
	})
}

func (s *CustomerAuthService) RequestPasswordReset(emailInput string) {
	email, err := normalizeCustomerEmail(emailInput)
	if err != nil {
		return
	}
	var account models.CustomerAccount
	if err := config.DB.Where("email = ? AND status = ?", email, "active").First(&account).Error; err != nil {
		return
	}
	rawToken, tokenHash, err := newCustomerToken()
	if err != nil {
		return
	}
	token := models.CustomerAuthToken{
		CustomerAccountID: account.ID, Purpose: "reset_password", TokenHash: tokenHash,
		ExpiresAt: s.now().Add(time.Hour),
	}
	if err := config.DB.Create(&token).Error; err != nil {
		return
	}
	s.sendAuthEmail(account, "reset_password", rawToken)
}

func (s *CustomerAuthService) ResetPassword(rawToken, newPassword string) error {
	if len(newPassword) < 8 || len(newPassword) > 72 {
		return utils.NewAppError("ERR_INVALID_PASSWORD")
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.consumeToken(rawToken, "reset_password", func(tx *gorm.DB, accountID uint) error {
		if err := tx.Model(&models.CustomerAccount{}).Where("id = ?", accountID).Update("password_hash", string(passwordHash)).Error; err != nil {
			return err
		}
		now := s.now()
		return tx.Model(&models.CustomerAuthToken{}).
			Where("customer_account_id = ? AND purpose = ? AND consumed_at IS NULL", accountID, "reset_password").
			Update("consumed_at", now).Error
	})
}

func (s *CustomerAuthService) ResendVerification(emailInput string) {
	email, err := normalizeCustomerEmail(emailInput)
	if err != nil {
		return
	}
	var account models.CustomerAccount
	if err := config.DB.Where("email = ? AND email_verified_at IS NULL AND status = ?", email, "active").First(&account).Error; err != nil {
		return
	}
	rawToken, tokenHash, err := newCustomerToken()
	if err != nil {
		return
	}
	token := models.CustomerAuthToken{
		CustomerAccountID: account.ID, Purpose: "verify_email", TokenHash: tokenHash,
		ExpiresAt: s.now().Add(24 * time.Hour),
	}
	if err := config.DB.Create(&token).Error; err == nil {
		s.sendAuthEmail(account, "verify_email", rawToken)
	}
}

func (s *CustomerAuthService) consumeToken(rawToken, purpose string, action func(*gorm.DB, uint) error) error {
	hash := hashCustomerToken(rawToken)
	return config.DB.Transaction(func(tx *gorm.DB) error {
		var token models.CustomerAuthToken
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?", hash, purpose, s.now()).
			First(&token).Error; err != nil {
			return utils.NewAppError("ERR_CUSTOMER_TOKEN_INVALID")
		}
		if err := action(tx, token.CustomerAccountID); err != nil {
			return err
		}
		now := s.now()
		return tx.Model(&token).Update("consumed_at", now).Error
	})
}

func (s *CustomerAuthService) sendAuthEmail(account models.CustomerAccount, purpose, rawToken string) {
	baseURL, err := url.Parse(os.Getenv("MARKETPLACE_PUBLIC_URL"))
	if err != nil || (baseURL.Scheme != "https" && os.Getenv("APP_ENV") != "development") || baseURL.Host == "" {
		s.recordAuthEmail(account, purpose, "failed", "MARKETPLACE_PUBLIC_URL is invalid")
		return
	}
	path := "/verify-email"
	subject := "Verifikasi alamat email"
	bodyPrefix := "Verifikasi alamat email Anda melalui tautan berikut: "
	if purpose == "reset_password" {
		path = "/reset-password"
		subject = "Atur ulang kata sandi"
		bodyPrefix = "Atur ulang kata sandi Anda melalui tautan berikut: "
	}
	baseURL.Path = path
	query := baseURL.Query()
	query.Set("token", rawToken)
	baseURL.RawQuery = query.Encode()
	if err := sendSMTPMessage(account.Email, subject, bodyPrefix+baseURL.String()); err != nil {
		s.recordAuthEmail(account, purpose, "failed", err.Error())
		return
	}
	s.recordAuthEmail(account, purpose, "sent", "")
}

func (s *CustomerAuthService) recordAuthEmail(account models.CustomerAccount, purpose, status, lastError string) {
	now := s.now()
	delivery := models.EmailDelivery{
		CustomerAccountID: &account.ID, DedupeKey: fmt.Sprintf("auth:%d:%s:%d", account.ID, purpose, now.UnixNano()),
		Recipient: account.Email, Template: purpose, Subject: purpose, Status: status,
		NextAttemptAt: now, LastError: lastError,
	}
	if status == "sent" {
		delivery.SentAt = &now
	}
	_ = config.DB.Create(&delivery).Error
}

func normalizeCustomerEmail(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	parsed, err := mail.ParseAddress(value)
	if err != nil || strings.ToLower(parsed.Address) != value {
		return "", fmt.Errorf("invalid email")
	}
	return value, nil
}

func newCustomerToken() (string, string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", "", err
	}
	raw := base64.RawURLEncoding.EncodeToString(value)
	return raw, hashCustomerToken(raw), nil
}

func hashCustomerToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func customerIdentity(account models.CustomerAccount, client models.Client) *dto.CustomerIdentityResponse {
	return &dto.CustomerIdentityResponse{
		ID: account.ID, Email: account.Email, Name: client.Name, Phone: client.Phone,
		EmailVerified: account.EmailVerifiedAt != nil,
	}
}
