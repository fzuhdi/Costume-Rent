package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type fakePaymentGateway struct {
	createError error
	status      GatewayStatus
	refundCalls int
	expireCalls int
}

func (f *fakePaymentGateway) CreateTransaction(_ context.Context, request GatewayCreateRequest) (*GatewayCreateResponse, error) {
	if f.createError != nil {
		return nil, f.createError
	}
	return &GatewayCreateResponse{RedirectURL: "https://app.sandbox.midtrans.com/snap/v2/vtweb/test"}, nil
}

func (f *fakePaymentGateway) GetStatus(_ context.Context, _ string) (*GatewayStatus, error) {
	status := f.status
	return &status, nil
}

func (f *fakePaymentGateway) Expire(_ context.Context, _ string) error {
	f.expireCalls++
	return nil
}

func (f *fakePaymentGateway) Refund(_ context.Context, _ string, _ GatewayRefundRequest) error {
	f.refundCalls++
	return nil
}

func (f *fakePaymentGateway) VerifyNotificationSignature(_ GatewayNotification) bool {
	return true
}

func setupMarketplaceTest(t *testing.T) (*models.CustomerAccount, *models.Costume) {
	t.Helper()
	dsn := fmt.Sprintf("file:marketplace-%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("get test database: %v", err)
	}
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { _ = sqlDB.Close() })
	config.DB = db

	err = db.AutoMigrate(
		&models.User{}, &models.Region{}, &models.Category{}, &models.Costume{}, &models.CostumeImage{},
		&models.Client{}, &models.CustomerAccount{}, &models.CustomerAuthToken{}, &models.RentOrder{}, &models.RentOrderItem{},
		&models.PaymentAttempt{}, &models.PaymentEvent{}, &models.RefundOperation{},
		&models.RentTransaction{}, &models.AppSetting{}, &models.MarketplaceAuditLog{}, &models.EmailDelivery{},
	)
	if err != nil {
		t.Fatalf("migrate test database: %v", err)
	}
	client := models.Client{Name: "Ayu", Phone: "08123456789"}
	if err := db.Create(&client).Error; err != nil {
		t.Fatalf("create client: %v", err)
	}
	verifiedAt := time.Now()
	account := models.CustomerAccount{
		ClientID: client.ID, Email: "ayu@example.com", EmailVerifiedAt: &verifiedAt, Status: "active",
	}
	if err := db.Create(&account).Error; err != nil {
		t.Fatalf("create customer account: %v", err)
	}
	costume := models.Costume{Name: "Kebaya Bali", Size: "M", RentalFee: 100001, BuyPrice: 900000, TotalQuantity: 2}
	if err := db.Create(&costume).Error; err != nil {
		t.Fatalf("create costume: %v", err)
	}
	return &account, &costume
}

func checkoutRequest(costume models.Costume, eventDate string) dto.CreateMarketplaceCheckoutRequest {
	return dto.CreateMarketplaceCheckoutRequest{
		EventDate: eventDate, Name: "Ayu", Phone: "08123456789",
		FulfillmentType: "pickup", TermsVersion: "2026-07", TermsAccepted: true,
		Items: []dto.MarketplaceCheckoutItemRequest{{
			CostumeID: costume.ID, Quantity: 1, RentalFee: costume.RentalFee,
		}},
	}
}

func TestMarketplaceCheckoutRollsBackWhenProviderCreationFails(t *testing.T) {
	account, costume := setupMarketplaceTest(t)
	fixedNow := time.Date(2026, 7, 26, 10, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	gateway := &fakePaymentGateway{createError: errors.New("provider unavailable")}
	service := NewMarketplaceServiceWithGateway(gateway)
	service.now = func() time.Time { return fixedNow }

	_, _, err := service.CreateCheckout(context.Background(), account.ID, "checkout-failure", checkoutRequest(*costume, "2026-08-10"))
	if err == nil {
		t.Fatal("expected provider error")
	}
	var orders, attempts, items int64
	config.DB.Model(&models.RentOrder{}).Count(&orders)
	config.DB.Model(&models.PaymentAttempt{}).Count(&attempts)
	config.DB.Model(&models.RentOrderItem{}).Count(&items)
	if orders != 0 || attempts != 0 || items != 0 {
		t.Fatalf("checkout was not atomic: orders=%d attempts=%d items=%d", orders, attempts, items)
	}
}

func TestMarketplaceCheckoutIsIdempotentAndUsesCeilingDownpayment(t *testing.T) {
	account, costume := setupMarketplaceTest(t)
	fixedNow := time.Date(2026, 7, 26, 10, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	service := NewMarketplaceServiceWithGateway(&fakePaymentGateway{})
	service.now = func() time.Time { return fixedNow }
	request := checkoutRequest(*costume, "2026-08-10")

	first, replayed, err := service.CreateCheckout(context.Background(), account.ID, "checkout-idempotent", request)
	if err != nil {
		t.Fatalf("create checkout: %v", err)
	}
	if replayed {
		t.Fatal("first checkout unexpectedly marked as replay")
	}
	second, replayed, err := service.CreateCheckout(context.Background(), account.ID, "checkout-idempotent", request)
	if err != nil {
		t.Fatalf("replay checkout: %v", err)
	}
	if !replayed || second.ID != first.ID {
		t.Fatalf("idempotency mismatch: first=%d second=%d replayed=%v", first.ID, second.ID, replayed)
	}
	if first.DownpaymentAmount != 50001 {
		t.Fatalf("expected ceil(100001/2)=50001, got %d", first.DownpaymentAmount)
	}
	var count int64
	config.DB.Model(&models.RentOrder{}).Count(&count)
	if count != 1 {
		t.Fatalf("expected one order, got %d", count)
	}
}

func TestMarketplaceWebhookBooksOnceOnReplay(t *testing.T) {
	account, costume := setupMarketplaceTest(t)
	location := time.FixedZone("WIB", 7*60*60)
	fixedNow := time.Date(2026, 7, 26, 10, 0, 0, 0, location)
	gateway := &fakePaymentGateway{}
	service := NewMarketplaceServiceWithGateway(gateway)
	service.now = func() time.Time { return fixedNow }
	order, _, err := service.CreateCheckout(context.Background(), account.ID, "checkout-paid", checkoutRequest(*costume, "2026-08-10"))
	if err != nil {
		t.Fatalf("create checkout: %v", err)
	}
	var attempt models.PaymentAttempt
	if err := config.DB.Where("rent_order_id = ?", order.ID).First(&attempt).Error; err != nil {
		t.Fatalf("load attempt: %v", err)
	}
	gateway.status = GatewayStatus{
		OrderID: attempt.ProviderOrderID, TransactionID: "trx-paid",
		TransactionStatus: "settlement", TransactionTime: "2026-07-26 10:30:00",
		GrossAmount: "50001.00", FraudStatus: "accept", PaymentType: "qris",
	}
	notification := GatewayNotification{OrderID: attempt.ProviderOrderID}
	raw := []byte(`{"order_id":"` + attempt.ProviderOrderID + `","transaction_status":"settlement"}`)
	if err := service.ProcessNotification(context.Background(), notification, raw); err != nil {
		t.Fatalf("process webhook: %v", err)
	}
	if err := service.ProcessNotification(context.Background(), notification, raw); err != nil {
		t.Fatalf("replay webhook: %v", err)
	}
	var storedOrder models.RentOrder
	config.DB.First(&storedOrder, order.ID)
	if storedOrder.Status != "booked" {
		t.Fatalf("expected booked order, got %s", storedOrder.Status)
	}
	var payments, events int64
	config.DB.Model(&models.RentTransaction{}).Where("payment_attempt_id = ? AND category = ?", attempt.ID, "PAYMENT").Count(&payments)
	config.DB.Model(&models.PaymentEvent{}).Where("payment_attempt_id = ?", attempt.ID).Count(&events)
	if payments != 1 || events != 1 {
		t.Fatalf("webhook replay duplicated state: payments=%d events=%d", payments, events)
	}
}

func TestMarketplaceLatePaymentNeverBooksAndStartsRefund(t *testing.T) {
	account, costume := setupMarketplaceTest(t)
	location := time.FixedZone("WIB", 7*60*60)
	fixedNow := time.Date(2026, 7, 26, 10, 0, 0, 0, location)
	gateway := &fakePaymentGateway{}
	service := NewMarketplaceServiceWithGateway(gateway)
	service.now = func() time.Time { return fixedNow }
	order, _, err := service.CreateCheckout(context.Background(), account.ID, "checkout-late", checkoutRequest(*costume, "2026-08-10"))
	if err != nil {
		t.Fatalf("create checkout: %v", err)
	}
	var attempt models.PaymentAttempt
	config.DB.Where("rent_order_id = ?", order.ID).First(&attempt)
	gateway.status = GatewayStatus{
		OrderID: attempt.ProviderOrderID, TransactionID: "trx-late",
		TransactionStatus: "settlement", TransactionTime: "2026-07-26 10:59:59", SettlementTime: "2026-07-26 11:00:01",
		GrossAmount: "50001.00", FraudStatus: "accept", PaymentType: "bank_transfer",
	}
	if err := service.ProcessNotification(context.Background(), GatewayNotification{OrderID: attempt.ProviderOrderID}, []byte("late")); err != nil {
		t.Fatalf("process late payment: %v", err)
	}
	var storedOrder models.RentOrder
	var storedAttempt models.PaymentAttempt
	config.DB.First(&storedOrder, order.ID)
	config.DB.First(&storedAttempt, attempt.ID)
	if storedOrder.Status != "cancelled" || storedAttempt.Status != "refund_pending" {
		t.Fatalf("late payment state mismatch: order=%s payment=%s", storedOrder.Status, storedAttempt.Status)
	}
	if gateway.refundCalls != 1 {
		t.Fatalf("expected one refund call, got %d", gateway.refundCalls)
	}
	var paymentCredits int64
	config.DB.Model(&models.RentTransaction{}).Where("payment_attempt_id = ?", attempt.ID).Count(&paymentCredits)
	if paymentCredits != 0 {
		t.Fatalf("late payment created a booking ledger credit")
	}
}

func TestDelayedWebhookWithOnTimeProviderTimestampStillBooks(t *testing.T) {
	account, costume := setupMarketplaceTest(t)
	location := time.FixedZone("WIB", 7*60*60)
	currentTime := time.Date(2026, 7, 26, 10, 0, 0, 0, location)
	gateway := &fakePaymentGateway{}
	service := NewMarketplaceServiceWithGateway(gateway)
	service.now = func() time.Time { return currentTime }
	order, _, err := service.CreateCheckout(context.Background(), account.ID, "checkout-delayed", checkoutRequest(*costume, "2026-08-10"))
	if err != nil {
		t.Fatalf("create checkout: %v", err)
	}
	var attempt models.PaymentAttempt
	config.DB.Where("rent_order_id = ?", order.ID).First(&attempt)

	currentTime = time.Date(2026, 7, 26, 11, 5, 0, 0, location)
	if err := service.expirePending(config.DB, account.ID, currentTime); err != nil {
		t.Fatalf("expire hold: %v", err)
	}
	gateway.status = GatewayStatus{
		OrderID: attempt.ProviderOrderID, TransactionID: "trx-delayed",
		TransactionStatus: "settlement", TransactionTime: "2026-07-26 10:59:59",
		GrossAmount: "50001.00", FraudStatus: "accept", PaymentType: "qris",
	}
	if err := service.ProcessNotification(context.Background(), GatewayNotification{OrderID: attempt.ProviderOrderID}, []byte("delayed")); err != nil {
		t.Fatalf("process delayed webhook: %v", err)
	}
	var storedOrder models.RentOrder
	config.DB.First(&storedOrder, order.ID)
	if storedOrder.Status != "booked" {
		t.Fatalf("on-time provider payment was not booked: %s", storedOrder.Status)
	}
	var paymentCredits int64
	config.DB.Model(&models.RentTransaction{}).Where("payment_attempt_id = ? AND category = ?", attempt.ID, "PAYMENT").Count(&paymentCredits)
	if paymentCredits != 1 {
		t.Fatalf("expected one payment credit, got %d", paymentCredits)
	}
}

func TestMarketplaceCatalogueDoesNotExposeInternalInventoryFields(t *testing.T) {
	_, costume := setupMarketplaceTest(t)
	service := NewMarketplaceServiceWithGateway(&fakePaymentGateway{})
	response, err := service.GetCostume(costume.ID, "")
	if err != nil {
		t.Fatalf("get costume: %v", err)
	}
	serialized := fmt.Sprintf("%+v", response)
	for _, forbidden := range []string{"900000", "BuyPrice", "TotalQuantity", "AcquiredAt"} {
		if strings.Contains(serialized, forbidden) {
			t.Fatalf("public response exposed internal field %q: %s", forbidden, serialized)
		}
	}
	if response.MaxQuantity != 2 {
		t.Fatalf("expected capped public quantity 2, got %d", response.MaxQuantity)
	}
}

func TestConcurrentMarketplaceCheckoutsCannotOversell(t *testing.T) {
	firstAccount, costume := setupMarketplaceTest(t)
	config.DB.Model(costume).Update("total_quantity", 1)
	secondClient := models.Client{Name: "Sari", Phone: "089999999"}
	config.DB.Create(&secondClient)
	verifiedAt := time.Now()
	secondAccount := models.CustomerAccount{
		ClientID: secondClient.ID, Email: "sari@example.com", EmailVerifiedAt: &verifiedAt, Status: "active",
	}
	config.DB.Create(&secondAccount)

	fixedNow := time.Date(2026, 7, 26, 10, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	service := NewMarketplaceServiceWithGateway(&fakePaymentGateway{})
	service.now = func() time.Time { return fixedNow }
	request := checkoutRequest(*costume, "2026-08-10")
	type result struct {
		err error
	}
	start := make(chan struct{})
	results := make(chan result, 2)
	for index, accountID := range []uint{firstAccount.ID, secondAccount.ID} {
		go func(index int, accountID uint) {
			<-start
			_, _, err := service.CreateCheckout(context.Background(), accountID, fmt.Sprintf("concurrent-%d", index), request)
			results <- result{err: err}
		}(index, accountID)
	}
	close(start)
	first := <-results
	second := <-results
	successes := 0
	if first.err == nil {
		successes++
	}
	if second.err == nil {
		successes++
	}
	if successes != 1 {
		t.Fatalf("expected exactly one checkout success, got %d (errors: %v, %v)", successes, first.err, second.err)
	}
	var reserved int64
	config.DB.Model(&models.RentOrderItem{}).
		Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
		Where("rent_orders.status = ?", "pending").
		Select("COALESCE(SUM(rent_order_items.quantity), 0)").Scan(&reserved)
	if reserved != 1 {
		t.Fatalf("expected one reserved unit, got %d", reserved)
	}
}

func TestCustomerAuthTokensAreOneTimeAndStoredAsHashes(t *testing.T) {
	account, _ := setupMarketplaceTest(t)
	service := NewCustomerAuthService()
	fixedNow := time.Date(2026, 7, 26, 10, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return fixedNow }
	rawToken := "verification-token-known-only-to-test"
	token := models.CustomerAuthToken{
		CustomerAccountID: account.ID, Purpose: "verify_email",
		TokenHash: hashCustomerToken(rawToken), ExpiresAt: fixedNow.Add(time.Hour),
	}
	if err := config.DB.Create(&token).Error; err != nil {
		t.Fatalf("create auth token: %v", err)
	}
	if token.TokenHash == rawToken || len(token.TokenHash) != 64 {
		t.Fatalf("token was not stored as a SHA-256 hash")
	}
	if err := service.VerifyEmail(rawToken); err != nil {
		t.Fatalf("consume verification token: %v", err)
	}
	if err := service.VerifyEmail(rawToken); err == nil {
		t.Fatal("verification token was reusable")
	}
	var stored models.CustomerAccount
	config.DB.First(&stored, account.ID)
	if stored.EmailVerifiedAt == nil {
		t.Fatal("email was not marked verified")
	}
}
