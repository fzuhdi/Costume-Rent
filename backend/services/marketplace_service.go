package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
	"github.com/busana/backend/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	marketplaceHoldDuration = time.Hour
	marketplaceQuantityCap  = 2
)

type MarketplaceService struct {
	gateway PaymentGateway
	now     func() time.Time
}

func NewMarketplaceService() *MarketplaceService {
	return &MarketplaceService{gateway: NewMidtransGateway(), now: time.Now}
}

func NewMarketplaceServiceWithGateway(gateway PaymentGateway) *MarketplaceService {
	return &MarketplaceService{gateway: gateway, now: time.Now}
}

func (s *MarketplaceService) ExpireStaleHolds() error {
	var attempts []models.PaymentAttempt
	if err := config.DB.Where("status IN ? AND expires_at <= ?", []string{"created", "pending"}, s.now()).
		Find(&attempts).Error; err != nil {
		return err
	}
	for _, attempt := range attempts {
		status, err := s.gateway.GetStatus(context.Background(), attempt.ProviderOrderID)
		if err != nil {
			continue
		}
		notification := GatewayNotification{
			OrderID: status.OrderID, TransactionID: status.TransactionID,
			TransactionStatus: status.TransactionStatus, TransactionTime: status.TransactionTime,
			SettlementTime: status.SettlementTime, GrossAmount: status.GrossAmount,
			FraudStatus: status.FraudStatus, PaymentType: status.PaymentType,
		}
		raw, _ := json.Marshal(status)
		_ = s.processVerifiedStatus(context.Background(), notification, status, raw)
	}
	return s.expirePending(config.DB, 0, s.now())
}

func (s *MarketplaceService) ListCostumes(filter dto.MarketplaceCostumeFilter) (*dto.PaginatedResponse, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 20
	}
	query := config.DB.Model(&models.Costume{}).Preload("Region").Preload("Category")
	if filter.Search != "" {
		query = query.Where("name LIKE ?", "%"+strings.TrimSpace(filter.Search)+"%")
	}
	if id, err := strconv.ParseUint(filter.RegionID, 10, 32); err == nil && id > 0 {
		query = query.Where("region_id = ?", id)
	}
	if id, err := strconv.ParseUint(filter.CategoryID, 10, 32); err == nil && id > 0 {
		query = query.Where("category_id = ?", id)
	}
	if filter.Size != "" {
		query = query.Where("size = ?", filter.Size)
	}

	var eventDate *time.Time
	if filter.EventDate != "" {
		parsed, err := parseBusinessDate(filter.EventDate)
		if err != nil {
			return nil, utils.NewAppError("ERR_INVALID_EVENT_DATE")
		}
		eventDate = &parsed
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}
	var costumes []models.Costume
	offset := (filter.Page - 1) * filter.Limit
	if err := query.Offset(offset).Limit(filter.Limit).Order("costumes.created_at DESC").Find(&costumes).Error; err != nil {
		return nil, err
	}
	items := make([]dto.MarketplaceCostumeResponse, 0, len(costumes))
	for _, costume := range costumes {
		available := min(costume.TotalQuantity, marketplaceQuantityCap)
		if eventDate != nil {
			var err error
			available, err = s.availableQuantity(config.DB, costume.ID, *eventDate)
			if err != nil {
				return nil, err
			}
		}
		available = min(max(available, 0), marketplaceQuantityCap)
		items = append(items, marketplaceCostume(costume, available, false))
	}
	return &dto.PaginatedResponse{
		Data:       items,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(filter.Limit))),
	}, nil
}

func (s *MarketplaceService) GetCostume(id uint, eventDateInput string) (*dto.MarketplaceCostumeResponse, error) {
	var costume models.Costume
	if err := config.DB.Preload("Region").Preload("Category").Preload("Images").First(&costume, id).Error; err != nil {
		return nil, err
	}
	available := min(costume.TotalQuantity, marketplaceQuantityCap)
	if eventDateInput != "" {
		eventDate, err := parseBusinessDate(eventDateInput)
		if err != nil {
			return nil, utils.NewAppError("ERR_INVALID_EVENT_DATE")
		}
		available, err = s.availableQuantity(config.DB, id, eventDate)
		if err != nil {
			return nil, err
		}
	}
	available = min(max(available, 0), marketplaceQuantityCap)
	response := marketplaceCostume(costume, available, true)
	return &response, nil
}

func marketplaceCostume(costume models.Costume, available int, includeImages bool) dto.MarketplaceCostumeResponse {
	response := dto.MarketplaceCostumeResponse{
		ID:          costume.ID,
		Name:        costume.Name,
		Description: costume.Description,
		RegionID:    costume.RegionID,
		CategoryID:  costume.CategoryID,
		Size:        costume.Size,
		RentalFee:   costume.RentalFee,
		CoverImage:  costume.CoverImage,
		Available:   available > 0,
		MaxQuantity: available,
	}
	if costume.RegionID != nil {
		response.Region = costume.Region.Name
	}
	if costume.CategoryID != nil {
		response.Category = costume.Category.Name
	}
	if includeImages {
		response.Images = make([]dto.CostumeImageResponse, 0, len(costume.Images))
		for _, image := range costume.Images {
			response.Images = append(response.Images, dto.CostumeImageResponse{
				ID: image.ID, CostumeID: image.CostumeID, Path: image.Path,
				CreatedAt: image.CreatedAt.Format(time.RFC3339),
			})
		}
	}
	return response
}

func (s *MarketplaceService) CreateCheckout(ctx context.Context, customerID uint, idempotencyKey string, request dto.CreateMarketplaceCheckoutRequest) (*dto.MarketplaceOrderResponse, bool, error) {
	idempotencyKey = strings.TrimSpace(idempotencyKey)
	if idempotencyKey == "" || len(idempotencyKey) > 120 {
		return nil, false, utils.NewAppError("ERR_IDEMPOTENCY_KEY_REQUIRED")
	}
	if existing, findErr := s.findIdempotentCheckout(customerID, idempotencyKey); findErr == nil {
		response := s.toOrderResponse(*existing)
		return &response, true, nil
	} else if !errors.Is(findErr, gorm.ErrRecordNotFound) {
		return nil, false, findErr
	}
	if !request.TermsAccepted || len(request.Items) == 0 {
		return nil, false, utils.NewAppError("ERR_INVALID_CHECKOUT")
	}
	if strings.TrimSpace(request.TermsVersion) != marketplaceTermsVersion(config.DB) {
		return nil, false, utils.NewAppError("ERR_TERMS_VERSION_INVALID")
	}
	eventDate, err := parseBusinessDate(request.EventDate)
	if err != nil || eventDate.Before(businessToday(s.now())) {
		return nil, false, utils.NewAppError("ERR_INVALID_EVENT_DATE")
	}
	if request.FulfillmentType == "delivery_request" && strings.TrimSpace(request.ShippingAddress) == "" {
		return nil, false, utils.NewAppError("ERR_DELIVERY_ADDRESS_REQUIRED")
	}

	var account models.CustomerAccount
	if err := config.DB.Preload("Client").First(&account, customerID).Error; err != nil {
		return nil, false, utils.NewAppError("ERR_CUSTOMER_NOT_FOUND")
	}

	now := s.now()
	expiresAt := now.Add(marketplaceHoldDuration)
	providerOrderID := "KBR-" + uuid.NewString()
	var created models.RentOrder
	err = config.DB.Transaction(func(tx *gorm.DB) error {
		if err := s.expirePending(tx, customerID, now); err != nil {
			return err
		}
		var activeCount int64
		if err := tx.Model(&models.RentOrder{}).
			Where("customer_account_id = ? AND order_source = ? AND status = ? AND expires_at > ?", customerID, "online", "pending", now).
			Count(&activeCount).Error; err != nil {
			return err
		}
		if activeCount > 0 {
			return utils.NewAppError("ERR_ACTIVE_CHECKOUT_EXISTS")
		}

		pickupDays := settingInt(tx, "pickup_days_before", 2)
		returnDays := settingInt(tx, "return_days_after", 1)
		total := 0
		items := make([]models.RentOrderItem, 0, len(request.Items))
		seen := make(map[uint]bool)
		for _, input := range request.Items {
			if input.Quantity < 1 || input.Quantity > marketplaceQuantityCap || seen[input.CostumeID] {
				return utils.NewAppError("ERR_INVALID_CHECKOUT_ITEM", map[string]interface{}{"costume_id": input.CostumeID})
			}
			seen[input.CostumeID] = true
			var costume models.Costume
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&costume, input.CostumeID).Error; err != nil {
				return utils.NewAppError("ERR_COSTUME_NOT_FOUND", map[string]interface{}{"costume_id": input.CostumeID})
			}
			if input.RentalFee != costume.RentalFee {
				return utils.NewAppError("ERR_PRICE_CHANGED", map[string]interface{}{"costume_id": input.CostumeID, "rental_fee": costume.RentalFee})
			}
			available, err := s.availableQuantity(tx, costume.ID, eventDate)
			if err != nil {
				return err
			}
			if input.Quantity > min(available, marketplaceQuantityCap) {
				return utils.NewAppError("ERR_STOCK_CONFLICT", map[string]interface{}{"costume_id": input.CostumeID, "max_quantity": max(min(available, marketplaceQuantityCap), 0)})
			}
			total += costume.RentalFee * input.Quantity
			items = append(items, models.RentOrderItem{
				CostumeID: costume.ID, Quantity: input.Quantity,
				RentalFee: costume.RentalFee, OriginalPrice: costume.RentalFee,
			})
		}

		deliveryStatus := "not_requested"
		if request.FulfillmentType == "delivery_request" {
			deliveryStatus = "requested"
		}
		acceptedAt := now
		created = models.RentOrder{
			ClientID: account.ClientID, CustomerAccountID: &customerID,
			GuaranteeType: "pending_at_pickup", EventDate: eventDate,
			PickupDate:         eventDate.AddDate(0, 0, -pickupDays),
			ExpectedReturnDate: eventDate.AddDate(0, 0, returnDays),
			Status:             "pending", OrderSource: "online", ExpiresAt: &expiresAt,
			FulfillmentType: request.FulfillmentType, DeliveryRequestStatus: deliveryStatus,
			ShippingAddress: strings.TrimSpace(request.ShippingAddress),
			TermsVersion:    strings.TrimSpace(request.TermsVersion), TermsAcceptedAt: &acceptedAt,
			Items: items,
		}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}
		baseFee := models.RentTransaction{
			RentOrderID: created.ID, Type: "DEBIT", Category: "BASE_FEE",
			Amount: total, OriginalAmount: total, Notes: "Biaya Sewa Marketplace",
		}
		if err := tx.Create(&baseFee).Error; err != nil {
			return err
		}
		attempt := models.PaymentAttempt{
			RentOrderID: created.ID, Provider: "midtrans", ProviderOrderID: providerOrderID,
			IdempotencyKey: idempotencyKey, RequestedAmount: (total + 1) / 2,
			Status: "created", ExpiresAt: expiresAt,
		}
		if err := tx.Create(&attempt).Error; err != nil {
			return err
		}

		gatewayResponse, err := s.gateway.CreateTransaction(ctx, GatewayCreateRequest{
			OrderID: providerOrderID, Amount: attempt.RequestedAmount,
			CustomerName: request.Name, Email: account.Email, Phone: request.Phone,
			ExpiryMinutes: int(marketplaceHoldDuration.Minutes()),
		})
		if err != nil {
			return fmt.Errorf("create Midtrans transaction: %w", err)
		}
		attempt.Status = "pending"
		attempt.RedirectURL = gatewayResponse.RedirectURL
		if err := tx.Save(&attempt).Error; err != nil {
			return err
		}
		clientUpdates := map[string]interface{}{"name": strings.TrimSpace(request.Name), "phone": strings.TrimSpace(request.Phone)}
		if request.FulfillmentType == "delivery_request" {
			clientUpdates["address"] = strings.TrimSpace(request.ShippingAddress)
		}
		return tx.Model(&models.Client{}).Where("id = ?", account.ClientID).Updates(clientUpdates).Error
	})
	if err != nil {
		return nil, false, err
	}
	order, err := s.loadOwnedOrder(created.ID, customerID)
	if err != nil {
		return nil, false, err
	}
	response := s.toOrderResponse(*order)
	return &response, false, nil
}

func (s *MarketplaceService) GetOwnedOrder(orderID, customerID uint) (*dto.MarketplaceOrderResponse, error) {
	if err := s.expirePending(config.DB, customerID, s.now()); err != nil {
		return nil, err
	}
	order, err := s.loadOwnedOrder(orderID, customerID)
	if err != nil {
		return nil, err
	}
	response := s.toOrderResponse(*order)
	return &response, nil
}

func (s *MarketplaceService) ListOrders(customerID uint, page, limit int) (*dto.MarketplaceOrderListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	if err := s.expirePending(config.DB, customerID, s.now()); err != nil {
		return nil, err
	}
	query := config.DB.Model(&models.RentOrder{}).Where("customer_account_id = ? AND order_source = ?", customerID, "online")
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}
	var orders []models.RentOrder
	if err := query.Preload("Items.Costume").Preload("Transactions").Preload("PaymentAttempts").
		Order("created_at DESC").Offset((page - 1) * limit).Limit(limit).Find(&orders).Error; err != nil {
		return nil, err
	}
	items := make([]dto.MarketplaceOrderResponse, 0, len(orders))
	for _, order := range orders {
		items = append(items, s.toOrderResponse(order))
	}
	return &dto.MarketplaceOrderListResponse{
		Data: items, Total: total, Page: page, Limit: limit,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

func (s *MarketplaceService) AbandonCheckout(ctx context.Context, orderID, customerID uint) error {
	var providerOrderID string
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var order models.RentOrder
		if err := tx.Where("id = ? AND customer_account_id = ? AND order_source = ?", orderID, customerID, "online").First(&order).Error; err != nil {
			return err
		}
		if order.Status != "pending" {
			return utils.NewAppError("ERR_INVALID_ORDER_STATE")
		}
		if err := tx.Model(&order).Updates(map[string]interface{}{"status": "cancelled", "expires_at": s.now()}).Error; err != nil {
			return err
		}
		var attempt models.PaymentAttempt
		if err := tx.Where("rent_order_id = ?", order.ID).Order("id DESC").First(&attempt).Error; err != nil {
			return err
		}
		providerOrderID = attempt.ProviderOrderID
		return tx.Model(&attempt).Updates(map[string]interface{}{"status": "expired", "failure_reason": "checkout abandoned by customer"}).Error
	})
	if err != nil {
		return err
	}
	if providerOrderID != "" {
		_ = s.gateway.Expire(ctx, providerOrderID)
	}
	return nil
}

func (s *MarketplaceService) CancelOrder(orderID, customerID uint) (*dto.MarketplaceOrderResponse, error) {
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var order models.RentOrder
		if err := tx.Where("id = ? AND customer_account_id = ? AND order_source = ?", orderID, customerID, "online").
			Preload("Transactions").First(&order).Error; err != nil {
			return err
		}
		if order.Status != "booked" {
			return utils.NewAppError("ERR_INVALID_ORDER_STATE")
		}
		ledger := NewPaymentLedger(order.Transactions)
		adjustment := ledger.TotalCredits() - ledger.TotalDebits()
		if adjustment != 0 {
			entry := models.RentTransaction{
				RentOrderID: order.ID, Type: "DEBIT", Category: "CANCELLATION_ADJUSTMENT",
				Amount: adjustment, OriginalAmount: adjustment,
				Notes: "Penyesuaian pembatalan; downpayment hangus",
			}
			if err := tx.Create(&entry).Error; err != nil {
				return err
			}
		}
		if err := tx.Model(&order).Update("status", "cancelled").Error; err != nil {
			return err
		}
		details, _ := json.Marshal(map[string]interface{}{"policy": "downpayment_forfeited"})
		if err := tx.Create(&models.MarketplaceAuditLog{
			RentOrderID: &order.ID, CustomerAccountID: &customerID,
			Action: "CUSTOMER_CANCELLED", Details: string(details),
		}).Error; err != nil {
			return err
		}
		_ = NewEmailService().QueueOrderEmail(tx, order.ID, "booking_cancelled", "customer")
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetOwnedOrder(orderID, customerID)
}

func (s *MarketplaceService) UpdateDelivery(orderID, userID uint, status string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		var order models.RentOrder
		if err := tx.First(&order, orderID).Error; err != nil {
			return err
		}
		if order.OrderSource != "online" || order.DeliveryRequestStatus != "requested" {
			return utils.NewAppError("ERR_INVALID_DELIVERY_STATE")
		}
		updates := map[string]interface{}{"delivery_request_status": status}
		if status == "declined" {
			updates["fulfillment_type"] = "pickup"
		}
		if err := tx.Model(&order).Updates(updates).Error; err != nil {
			return err
		}
		details, _ := json.Marshal(map[string]interface{}{"status": status})
		return tx.Create(&models.MarketplaceAuditLog{
			RentOrderID: &order.ID, UserID: &userID, Action: "DELIVERY_REQUEST_UPDATED", Details: string(details),
		}).Error
	})
}

func (s *MarketplaceService) CreateExceptionalRefund(ctx context.Context, orderID, userID uint, request dto.CreateRefundRequest) error {
	var attempt models.PaymentAttempt
	var operation models.RefundOperation
	replayed := false
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Joins("JOIN payment_attempts ON payment_attempts.id = refund_operations.payment_attempt_id").
			Where("refund_operations.operation_id = ? AND payment_attempts.rent_order_id = ?", request.IdempotencyKey, orderID).
			First(&operation).Error; err == nil {
			replayed = true
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err := tx.Joins("JOIN rent_orders ON rent_orders.id = payment_attempts.rent_order_id").
			Where("payment_attempts.rent_order_id = ? AND rent_orders.order_source = ? AND payment_attempts.status = ?", orderID, "online", "paid").
			Order("payment_attempts.id DESC").First(&attempt).Error; err != nil {
			return utils.NewAppError("ERR_REFUND_NOT_ELIGIBLE")
		}
		if request.Amount > attempt.RequestedAmount {
			return utils.NewAppError("ERR_REFUND_AMOUNT_EXCEEDS_PAYMENT")
		}
		operation = models.RefundOperation{
			PaymentAttemptID: attempt.ID, OperationID: request.IdempotencyKey,
			Amount: request.Amount, Reason: request.Reason, Status: "pending", RequestedBy: userID,
		}
		if err := tx.Create(&operation).Error; err != nil {
			return err
		}
		return tx.Model(&attempt).Update("status", "refund_pending").Error
	})
	if err != nil || operation.ID == 0 {
		return err
	}
	if replayed {
		return nil
	}
	if err := s.gateway.Refund(ctx, attempt.ProviderOrderID, GatewayRefundRequest{
		OperationID: operation.OperationID, Amount: operation.Amount, Reason: operation.Reason,
	}); err != nil {
		config.DB.Model(&operation).Updates(map[string]interface{}{"status": "failed", "provider_response": err.Error()})
		config.DB.Model(&attempt).Updates(map[string]interface{}{"status": "refund_failed", "failure_reason": err.Error()})
		return err
	}
	return config.DB.Model(&operation).Update("status", "submitted").Error
}

func (s *MarketplaceService) ProcessNotification(ctx context.Context, notification GatewayNotification, rawPayload []byte) error {
	if !s.gateway.VerifyNotificationSignature(notification) {
		return utils.NewAppError("ERR_INVALID_PAYMENT_SIGNATURE")
	}
	status, err := s.gateway.GetStatus(ctx, notification.OrderID)
	if err != nil {
		return fmt.Errorf("verify Midtrans status: %w", err)
	}
	return s.processVerifiedStatus(ctx, notification, status, rawPayload)
}

func (s *MarketplaceService) ReconcilePayment(ctx context.Context, attemptID uint) error {
	var attempt models.PaymentAttempt
	if err := config.DB.First(&attempt, attemptID).Error; err != nil {
		return err
	}
	if attempt.Status == "refund_failed" {
		return s.retryFailedRefund(ctx, &attempt)
	}
	status, err := s.gateway.GetStatus(ctx, attempt.ProviderOrderID)
	if err != nil {
		return err
	}
	notification := GatewayNotification{
		OrderID: status.OrderID, TransactionID: status.TransactionID,
		TransactionStatus: status.TransactionStatus, TransactionTime: status.TransactionTime,
		SettlementTime: status.SettlementTime, GrossAmount: status.GrossAmount,
		FraudStatus: status.FraudStatus, PaymentType: status.PaymentType,
	}
	raw, _ := json.Marshal(status)
	return s.processVerifiedStatus(ctx, notification, status, raw)
}

func (s *MarketplaceService) retryFailedRefund(ctx context.Context, attempt *models.PaymentAttempt) error {
	var operation models.RefundOperation
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("payment_attempt_id = ? AND status = ?", attempt.ID, "failed").
			Order("id DESC").First(&operation).Error; err != nil {
			return utils.NewAppError("ERR_REFUND_RETRY_NOT_ELIGIBLE")
		}
		if operation.RetryCount >= 1 {
			return utils.NewAppError("ERR_REFUND_RETRY_EXHAUSTED")
		}
		operation.RetryCount++
		operation.Status = "retrying"
		if err := tx.Save(&operation).Error; err != nil {
			return err
		}
		return tx.Model(attempt).Updates(map[string]interface{}{"status": "refund_pending", "failure_reason": ""}).Error
	})
	if err != nil {
		return err
	}
	if err := s.gateway.Refund(ctx, attempt.ProviderOrderID, GatewayRefundRequest{
		OperationID: operation.OperationID, Amount: operation.Amount, Reason: operation.Reason,
	}); err != nil {
		config.DB.Model(&operation).Updates(map[string]interface{}{"status": "failed", "provider_response": err.Error()})
		config.DB.Model(attempt).Updates(map[string]interface{}{"status": "refund_failed", "failure_reason": err.Error()})
		return err
	}
	return config.DB.Model(&operation).Update("status", "submitted").Error
}

func (s *MarketplaceService) processVerifiedStatus(ctx context.Context, notification GatewayNotification, status *GatewayStatus, rawPayload []byte) error {
	if status.OrderID != notification.OrderID {
		return utils.NewAppError("ERR_PAYMENT_ORDER_MISMATCH")
	}
	hash := sha256.Sum256(rawPayload)
	dedupeKey := strings.Join([]string{status.OrderID, status.TransactionID, status.TransactionStatus, status.FraudStatus, status.TransactionTime}, ":")
	now := s.now()
	var lateRefund *models.RefundOperation
	var lateAttempt *models.PaymentAttempt
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var attempt models.PaymentAttempt
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("provider_order_id = ?", status.OrderID).First(&attempt).Error; err != nil {
			return err
		}
		var existing models.PaymentEvent
		if err := tx.Where("dedupe_key = ?", dedupeKey).First(&existing).Error; err == nil {
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		event := models.PaymentEvent{
			PaymentAttemptID: attempt.ID, DedupeKey: dedupeKey,
			PayloadHash: hex.EncodeToString(hash[:]), ProcessingResult: "ignored",
			ReceivedAt: now,
		}
		if err := tx.Create(&event).Error; err != nil {
			return err
		}
		amount, err := parseIDRAmount(status.GrossAmount)
		if err != nil || amount != attempt.RequestedAmount {
			event.ProcessingResult = "amount_mismatch"
			processed := now
			event.ProcessedAt = &processed
			_ = tx.Save(&event).Error
			return utils.NewAppError("ERR_PAYMENT_AMOUNT_MISMATCH")
		}
		attempt.ProviderTransactionID = status.TransactionID
		attempt.PaymentType = status.PaymentType

		switch {
		case isSuccessfulPayment(status):
			paidAt, err := paymentCompletedAt(status)
			if err != nil {
				return utils.NewAppError("ERR_PAYMENT_TIMESTAMP_INVALID")
			}
			attempt.PaidAt = &paidAt
			var order models.RentOrder
			if err := tx.First(&order, attempt.RentOrderID).Error; err != nil {
				return err
			}
			shouldRefund := paidAt.After(attempt.ExpiresAt) || strings.Contains(attempt.FailureReason, "abandoned")
			if !shouldRefund && order.Status == "cancelled" && attempt.Status != "paid" {
				if attempt.FailureReason != "inventory hold expired" {
					shouldRefund = true
				} else {
					canRestore, err := s.canRestoreBooking(tx, &order, now)
					if err != nil {
						return err
					}
					shouldRefund = !canRestore
				}
			}
			if shouldRefund {
				attempt.Status = "refund_pending"
				order.Status = "cancelled"
				if err := tx.Save(&order).Error; err != nil {
					return err
				}
				operation := models.RefundOperation{
					PaymentAttemptID: attempt.ID, OperationID: "late-" + attempt.ProviderOrderID,
					Amount: attempt.RequestedAmount, Reason: "Payment received after inventory hold expiry",
					Status: "pending",
				}
				if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&operation).Error; err != nil {
					return err
				}
				lateRefund = &operation
				lateAttempt = &attempt
				event.ProcessingResult = "late_payment_refund_pending"
				_ = NewEmailService().QueueOrderEmail(tx, order.ID, "late_refund_started", attempt.ProviderTransactionID)
			} else if attempt.Status != "paid" {
				attempt.Status = "paid"
				order.Status = "booked"
				if err := tx.Save(&order).Error; err != nil {
					return err
				}
				paymentAttemptID := attempt.ID
				payment := models.RentTransaction{
					RentOrderID: order.ID, PaymentAttemptID: &paymentAttemptID,
					Type: "CREDIT", Category: "PAYMENT", Amount: attempt.RequestedAmount,
					PaymentMethod: "MIDTRANS", Notes: "Downpayment marketplace",
				}
				if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&payment).Error; err != nil {
					return err
				}
				event.ProcessingResult = "booked"
				_ = NewEmailService().QueueOrderEmail(tx, order.ID, "booking_confirmed", attempt.ProviderTransactionID)
			}
		case status.TransactionStatus == "refund" || status.TransactionStatus == "partial_refund":
			refundedAt := now
			attempt.Status = "refunded"
			attempt.RefundedAt = &refundedAt
			event.ProcessingResult = "refunded"
			var operations []models.RefundOperation
			if err := tx.Where("payment_attempt_id = ? AND status != ?", attempt.ID, "refunded").Find(&operations).Error; err != nil {
				return err
			}
			var paymentCount int64
			if err := tx.Model(&models.RentTransaction{}).
				Where("payment_attempt_id = ? AND category = ?", attempt.ID, "PAYMENT").Count(&paymentCount).Error; err != nil {
				return err
			}
			for i := range operations {
				if paymentCount > 0 {
					refundOperationID := operations[i].ID
					refundEntry := models.RentTransaction{
						RentOrderID: attempt.RentOrderID, RefundOperationID: &refundOperationID,
						Type: "CREDIT", Category: "REFUND", Amount: -operations[i].Amount,
						PaymentMethod: "MIDTRANS", Notes: operations[i].Reason,
					}
					if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&refundEntry).Error; err != nil {
						return err
					}
				}
				if err := tx.Model(&operations[i]).Update("status", "refunded").Error; err != nil {
					return err
				}
			}
			_ = NewEmailService().QueueOrderEmail(tx, attempt.RentOrderID, "refund_completed", status.TransactionID)
		case status.TransactionStatus == "deny" || status.TransactionStatus == "cancel" || status.TransactionStatus == "expire" || status.TransactionStatus == "failure":
			if attempt.Status != "paid" && attempt.Status != "refunded" {
				attempt.Status = mapProviderFailure(status.TransactionStatus)
				attempt.FailureReason = status.TransactionStatus
				if err := tx.Model(&models.RentOrder{}).Where("id = ? AND status = ?", attempt.RentOrderID, "pending").Update("status", "cancelled").Error; err != nil {
					return err
				}
				event.ProcessingResult = attempt.Status
				_ = NewEmailService().QueueOrderEmail(tx, attempt.RentOrderID, "payment_failed", status.TransactionID+":"+status.TransactionStatus)
			}
		default:
			event.ProcessingResult = "pending"
		}
		if err := tx.Save(&attempt).Error; err != nil {
			return err
		}
		processed := now
		event.ProcessedAt = &processed
		return tx.Save(&event).Error
	})
	if err != nil {
		return err
	}
	if lateRefund != nil && lateRefund.ID != 0 && lateAttempt != nil {
		if err := s.gateway.Refund(ctx, lateAttempt.ProviderOrderID, GatewayRefundRequest{
			OperationID: lateRefund.OperationID, Amount: lateRefund.Amount, Reason: lateRefund.Reason,
		}); err != nil {
			config.DB.Model(lateRefund).Updates(map[string]interface{}{"status": "failed", "provider_response": err.Error()})
			config.DB.Model(lateAttempt).Updates(map[string]interface{}{"status": "refund_failed", "failure_reason": err.Error()})
			return err
		}
		return config.DB.Model(lateRefund).Update("status", "submitted").Error
	}
	return nil
}

func (s *MarketplaceService) findIdempotentCheckout(customerID uint, key string) (*models.RentOrder, error) {
	var order models.RentOrder
	err := config.DB.Joins("JOIN payment_attempts ON payment_attempts.rent_order_id = rent_orders.id").
		Where("rent_orders.customer_account_id = ? AND payment_attempts.idempotency_key = ?", customerID, key).
		Preload("Items.Costume").Preload("Transactions").Preload("PaymentAttempts").
		First(&order).Error
	return &order, err
}

func (s *MarketplaceService) loadOwnedOrder(orderID, customerID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	err := config.DB.Where("id = ? AND customer_account_id = ? AND order_source = ?", orderID, customerID, "online").
		Preload("Items.Costume").Preload("Transactions").Preload("PaymentAttempts").
		First(&order).Error
	return &order, err
}

func (s *MarketplaceService) expirePending(db *gorm.DB, customerID uint, now time.Time) error {
	query := db.Model(&models.RentOrder{}).
		Where("order_source = ? AND status = ? AND expires_at <= ?", "online", "pending", now)
	if customerID > 0 {
		query = query.Where("customer_account_id = ?", customerID)
	}
	var expired []models.RentOrder
	if err := query.Find(&expired).Error; err != nil {
		return err
	}
	if len(expired) > 0 {
		ids := make([]uint, 0, len(expired))
		for _, order := range expired {
			ids = append(ids, order.ID)
		}
		if err := db.Model(&models.RentOrder{}).Where("id IN ?", ids).Update("status", "cancelled").Error; err != nil {
			return err
		}
	}
	if err := db.Model(&models.PaymentAttempt{}).
		Where("status IN ? AND expires_at <= ?", []string{"created", "pending"}, now).
		Updates(map[string]interface{}{"status": "expired", "failure_reason": "inventory hold expired"}).Error; err != nil {
		return err
	}
	for _, order := range expired {
		_ = NewEmailService().QueueOrderEmail(db, order.ID, "payment_failed", "hold-expired")
	}
	return nil
}

func (s *MarketplaceService) availableQuantity(db *gorm.DB, costumeID uint, eventDate time.Time) (int, error) {
	var costume models.Costume
	if err := db.First(&costume, costumeID).Error; err != nil {
		return 0, err
	}
	pickup := eventDate.AddDate(0, 0, -settingInt(db, "pickup_days_before", 2))
	expectedReturn := eventDate.AddDate(0, 0, settingInt(db, "return_days_after", 1))
	now := s.now()
	var reserved int64
	err := db.Model(&models.RentOrderItem{}).
		Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
		Where("rent_order_items.costume_id = ? AND rent_orders.deleted_at IS NULL", costumeID).
		Where("rent_orders.pickup_date <= ? AND rent_orders.expected_return_date >= ?", expectedReturn, pickup).
		Where("(rent_orders.status IN ?) OR (rent_orders.status = ? AND rent_orders.order_source = ? AND rent_orders.expires_at > ?)",
			[]string{"booked", "rented", "overdue"}, "pending", "online", now).
		Select("COALESCE(SUM(rent_order_items.quantity), 0)").Scan(&reserved).Error
	return costume.TotalQuantity - int(reserved), err
}

func (s *MarketplaceService) canRestoreBooking(db *gorm.DB, order *models.RentOrder, now time.Time) (bool, error) {
	if err := db.Preload("Items").First(order, order.ID).Error; err != nil {
		return false, err
	}
	for _, item := range order.Items {
		var costume models.Costume
		if err := db.First(&costume, item.CostumeID).Error; err != nil {
			return false, err
		}
		var reserved int64
		err := db.Model(&models.RentOrderItem{}).
			Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
			Where("rent_order_items.costume_id = ? AND rent_order_items.rent_order_id != ? AND rent_orders.deleted_at IS NULL", item.CostumeID, order.ID).
			Where("rent_orders.pickup_date <= ? AND rent_orders.expected_return_date >= ?", order.ExpectedReturnDate, order.PickupDate).
			Where("(rent_orders.status IN ?) OR (rent_orders.status = ? AND rent_orders.order_source = ? AND rent_orders.expires_at > ?)",
				[]string{"booked", "rented", "overdue"}, "pending", "online", now).
			Select("COALESCE(SUM(rent_order_items.quantity), 0)").Scan(&reserved).Error
		if err != nil {
			return false, err
		}
		if int(reserved)+item.Quantity > costume.TotalQuantity {
			return false, nil
		}
	}
	return true, nil
}

func (s *MarketplaceService) toOrderResponse(order models.RentOrder) dto.MarketplaceOrderResponse {
	items := make([]dto.MarketplaceOrderItemResponse, 0, len(order.Items))
	total := 0
	for _, item := range order.Items {
		lineTotal := item.RentalFee * item.Quantity
		total += lineTotal
		items = append(items, dto.MarketplaceOrderItemResponse{
			CostumeID: item.CostumeID, Name: item.Costume.Name, Size: item.Costume.Size,
			CoverImage: item.Costume.CoverImage, Quantity: item.Quantity,
			RentalFee: item.RentalFee, LineTotal: lineTotal,
		})
	}
	ledger := NewPaymentLedger(order.Transactions)
	response := dto.MarketplaceOrderResponse{
		ID: order.ID, Status: order.Status, OrderSource: order.OrderSource,
		EventDate: order.EventDate.Format("2006-01-02"), PickupDate: order.PickupDate.Format("2006-01-02"),
		ExpectedReturnDate: order.ExpectedReturnDate.Format("2006-01-02"),
		FulfillmentType:    order.FulfillmentType, DeliveryRequestStatus: order.DeliveryRequestStatus,
		ShippingAddress: order.ShippingAddress, TermsVersion: order.TermsVersion,
		TotalRentalFee: total, DownpaymentAmount: (total + 1) / 2,
		PaymentSummary: dto.PaymentSummary{
			TotalDebits: ledger.TotalDebits(), TotalCredits: ledger.TotalCredits(),
			Balance: ledger.Balance(), Status: ledger.PaymentStatus(),
		},
		Items: items, CreatedAt: order.CreatedAt.Format(time.RFC3339),
	}
	if order.ExpiresAt != nil {
		value := order.ExpiresAt.Format(time.RFC3339)
		response.ExpiresAt = &value
	}
	if len(order.PaymentAttempts) > 0 {
		attempt := order.PaymentAttempts[len(order.PaymentAttempts)-1]
		payment := &dto.PaymentAttemptResponse{
			ID: attempt.ID, Status: attempt.Status, RequestedAmount: attempt.RequestedAmount,
			PaymentType: attempt.PaymentType, RedirectURL: attempt.RedirectURL,
			ExpiresAt: attempt.ExpiresAt.Format(time.RFC3339), FailureReason: attempt.FailureReason,
		}
		if attempt.PaidAt != nil {
			value := attempt.PaidAt.Format(time.RFC3339)
			payment.PaidAt = &value
		}
		if attempt.RefundedAt != nil {
			value := attempt.RefundedAt.Format(time.RFC3339)
			payment.RefundedAt = &value
		}
		response.PaymentAttempt = payment
	}
	return response
}

func parseBusinessDate(value string) (time.Time, error) {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Time{}, err
	}
	return time.ParseInLocation("2006-01-02", value, location)
}

func businessToday(now time.Time) time.Time {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		location = time.FixedZone("Asia/Jakarta", 7*60*60)
	}
	local := now.In(location)
	return time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, location)
}

func settingInt(db *gorm.DB, key string, fallback int) int {
	var setting models.AppSetting
	if err := db.Where("key = ?", key).First(&setting).Error; err == nil {
		if value, err := strconv.Atoi(setting.Value); err == nil {
			return value
		}
	}
	return fallback
}

func parseIDRAmount(value string) (int, error) {
	if strings.Contains(value, ".") {
		parts := strings.SplitN(value, ".", 2)
		if strings.Trim(parts[1], "0") != "" {
			return 0, fmt.Errorf("amount has fractional rupiah")
		}
		value = parts[0]
	}
	return strconv.Atoi(value)
}

func parseMidtransTime(value string) (time.Time, error) {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Time{}, err
	}
	return time.ParseInLocation("2006-01-02 15:04:05", value, location)
}

func paymentCompletedAt(status *GatewayStatus) (time.Time, error) {
	if status.TransactionStatus == "settlement" && status.SettlementTime != "" {
		return parseMidtransTime(status.SettlementTime)
	}
	return parseMidtransTime(status.TransactionTime)
}

func marketplaceTermsVersion(db *gorm.DB) string {
	var setting models.AppSetting
	if err := db.Where("key = ?", "marketplace_terms_version").First(&setting).Error; err == nil && strings.TrimSpace(setting.Value) != "" {
		return strings.TrimSpace(setting.Value)
	}
	return "2026-07"
}

func isSuccessfulPayment(status *GatewayStatus) bool {
	if status.TransactionStatus != "settlement" && status.TransactionStatus != "capture" {
		return false
	}
	return status.FraudStatus == "" || status.FraudStatus == "accept"
}

func mapProviderFailure(status string) string {
	if status == "expire" {
		return "expired"
	}
	return "failed"
}

func IsConflictError(err error) bool {
	var appErr *utils.AppError
	if !errors.As(err, &appErr) {
		return false
	}
	return appErr.Code == "ERR_ACTIVE_CHECKOUT_EXISTS" || appErr.Code == "ERR_STOCK_CONFLICT" ||
		appErr.Code == "ERR_INVALID_ORDER_STATE" || appErr.Code == "ERR_INVALID_DELIVERY_STATE"
}

func IsValidationError(err error) bool {
	var appErr *utils.AppError
	if !errors.As(err, &appErr) {
		return false
	}
	return strings.HasPrefix(appErr.Code, "ERR_INVALID_") || appErr.Code == "ERR_PRICE_CHANGED" ||
		appErr.Code == "ERR_DELIVERY_ADDRESS_REQUIRED" || appErr.Code == "ERR_IDEMPOTENCY_KEY_REQUIRED"
}
