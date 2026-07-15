package services

import (
	"errors"
	"math"
	"strconv"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
	"gorm.io/gorm"
)

type RentService struct{}

func NewRentService() *RentService {
	return &RentService{}
}

func (s *RentService) logActivity(orderID uint, userID uint, actionType string, oldValue string, newValue string) {
	log := models.ActivityLog{
		RentOrderID: orderID,
		UserID:      userID,
		ActionType:  actionType,
		OldValue:    oldValue,
		NewValue:    newValue,
		Timestamp:   time.Now(),
	}
	config.DB.Create(&log)
}

func (s *RentService) lazyExpireDrafts() {
	expiryTime := time.Now().Add(-1 * time.Hour)
	config.DB.Model(&models.RentOrder{}).
		Where("status = ? AND created_at < ?", "draft", expiryTime).
		Update("status", "cancelled")
}

func (s *RentService) List(filter dto.RentOrderFilter) (*dto.PaginatedResponse, error) {
	s.lazyExpireDrafts()

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	query := config.DB.Model(&models.RentOrder{}).Preload("Client").Preload("Items").Preload("Items.Costume").Preload("Transactions")

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.ClientID != "" {
		if id, err := strconv.ParseUint(filter.ClientID, 10, 32); err == nil {
			query = query.Where("client_id = ?", id)
		}
	}
	if filter.From != "" {
		if from, err := time.Parse("2006-01-02", filter.From); err == nil {
			query = query.Where("event_date >= ?", from)
		}
	}
	if filter.To != "" {
		if to, err := time.Parse("2006-01-02", filter.To); err == nil {
			query = query.Where("event_date <= ?", to)
		}
	}
	if filter.Search != "" {
		query = query.Joins("JOIN clients ON clients.id = rent_orders.client_id").
			Where("clients.name LIKE ?", "%"+filter.Search+"%")
	}

	var total int64
	query.Count(&total)

	var orders []models.RentOrder
	offset := (filter.Page - 1) * filter.Limit
	if err := query.Offset(offset).Limit(filter.Limit).Order("rent_orders.created_at DESC").Find(&orders).Error; err != nil {
		return nil, err
	}

	response := []dto.RentOrderResponse{}
	for _, o := range orders {
		item := s.toRentOrderResponse(o)
		response = append(response, item)
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))

	return &dto.PaginatedResponse{
		Data:       response,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *RentService) GetByID(id uint) (*models.RentOrder, error) {
	s.lazyExpireDrafts()
	
	var order models.RentOrder
	if err := config.DB.Preload("Client").
		Preload("Items").
		Preload("Items.Costume").
		Preload("Transactions").
		Preload("ActivityLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("activity_logs.timestamp DESC")
		}).
		First(&order, id).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (s *RentService) Create(req dto.CreateRentOrderRequest, userID uint) (*models.RentOrder, error) {
	var clientID uint

	if req.ClientID != nil && *req.ClientID > 0 {
		clientID = *req.ClientID
	} else {
		client := models.Client{
			Name:    req.ClientName,
			Phone:   req.ClientPhone,
			Address: req.ClientAddress,
		}
		if err := config.DB.Create(&client).Error; err != nil {
			return nil, err
		}
		clientID = client.ID
	}

	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		return nil, errors.New("invalid event_date format")
	}

	costumeSvc := NewCostumeService()
	pickupDaysBefore := costumeSvc.getSettingInt("pickup_days_before", 2)
	returnDaysAfter := costumeSvc.getSettingInt("return_days_after", 1)

	pickupDate := eventDate.AddDate(0, 0, -pickupDaysBefore)
	expectedReturnDate := eventDate.AddDate(0, 0, returnDaysAfter)

	status := req.Status
	if status == "" {
		status = "booked"
	}

	totalBasePrice := 0

	for _, item := range req.Items {
		costumeResp, err := costumeSvc.GetByID(item.CostumeID)
		if err != nil {
			return nil, errors.New("costume not found: " + strconv.Itoa(int(item.CostumeID)))
		}
		itemFee := costumeResp.RentalFee
		if item.CustomRentalFee != nil {
			itemFee = *item.CustomRentalFee
		}
		totalBasePrice += itemFee * item.Quantity
	}

	if status == "booked" {
		if req.Payment == nil {
			return nil, errors.New("payment required for booked status")
		}
		if req.Payment.PaymentMethod != "CASH" && req.Payment.PaymentProof == "" {
			return nil, errors.New("bukti pembayaran (payment proof) wajib diunggah untuk pemesanan (booked)")
		}

		if req.Payment.Amount < totalBasePrice/2 {
			return nil, errors.New("downpayment must be at least 50% of total base price")
		}

		for _, item := range req.Items {
			available, err := costumeSvc.GetAvailableQuantityOnDate(item.CostumeID, eventDate)
			if err != nil {
				return nil, errors.New("costume not found: " + strconv.Itoa(int(item.CostumeID)))
			}
			if item.Quantity > available {
				return nil, errors.New("insufficient quantity for costume " + strconv.Itoa(int(item.CostumeID)) + ": requested " + strconv.Itoa(item.Quantity) + ", available " + strconv.Itoa(available))
			}
		}
	}

	order := models.RentOrder{
		ClientID:           clientID,
		GuaranteeType:      req.GuaranteeType,
		EventDate:          eventDate,
		PickupDate:         pickupDate,
		ExpectedReturnDate: expectedReturnDate,
		TotalPaid:        0, // Will be updated by AddPayment
		PaymentStatus:    "",
		HasSecurityItem:    false, // Security item held at pickup only
		Status:             status,
		Notes:              req.Notes,
		CreatedBy:          userID,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		return nil, err
	}

	totalBaseFee := 0
	for _, item := range req.Items {
		costumeResp, _ := costumeSvc.GetByID(item.CostumeID)
		
		itemFee := costumeResp.RentalFee
		if item.CustomRentalFee != nil {
			itemFee = *item.CustomRentalFee
		}
		totalBaseFee += (itemFee * item.Quantity)

		orderItem := models.RentOrderItem{
			RentOrderID: order.ID,
			CostumeID:   item.CostumeID,
			Quantity:    item.Quantity,
			RentalFee:   itemFee,
		}
		if err := config.DB.Create(&orderItem).Error; err != nil {
			config.DB.Delete(&order)
			return nil, err
		}
	}

	// Insert the Base Fee into the Ledger
	baseFeeTx := models.RentTransaction{
		RentOrderID: order.ID,
		Type:        "DEBIT",
		Category:    "BASE_FEE",
		Amount:      totalBaseFee,
		Notes:       "Biaya Sewa",
		CreatedBy:   userID,
	}
	config.DB.Create(&baseFeeTx)

	s.logActivity(order.ID, userID, "CREATED", "", status)

	if status == "booked" && req.Payment != nil {
		_, err := s.AddPayment(order.ID, *req.Payment, userID)
		if err != nil {
			config.DB.Delete(&order)
			return nil, err
		}
	}

	return s.GetByID(order.ID)
}

func (s *RentService) Update(id uint, req dto.UpdateRentOrderRequest, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.First(&order, id).Error; err != nil {
		return nil, err
	}

	if req.ClientID != nil {
		order.ClientID = *req.ClientID
	}
	if req.GuaranteeType != "" {
		order.GuaranteeType = req.GuaranteeType
	}
	if req.EventDate != "" {
		if t, err := time.Parse("2006-01-02", req.EventDate); err == nil {
			costumeSvc := NewCostumeService()
			
			// Verify availability if not draft
			if order.Status == "booked" || order.Status == "rented" {
				config.DB.Preload("Items").First(&order, id)
				for _, item := range order.Items {
					available, err := costumeSvc.GetAvailableQuantityOnDate(item.CostumeID, t)
					if err != nil || int(item.Quantity) > available {
						return nil, errors.New("cannot change date: costume " + strconv.Itoa(int(item.CostumeID)) + " not available on new date")
					}
				}
			}

			pickupDaysBefore := costumeSvc.getSettingInt("pickup_days_before", 2)
			returnDaysAfter := costumeSvc.getSettingInt("return_days_after", 1)

			order.EventDate = t
			order.PickupDate = t.AddDate(0, 0, -pickupDaysBefore)
			order.ExpectedReturnDate = t.AddDate(0, 0, returnDaysAfter)
		}
	}
	if req.ActualReturnDate != nil {
		if t, err := time.Parse("2006-01-02", *req.ActualReturnDate); err == nil {
			order.ActualReturnDate = &t
		}
	}
	
	if req.TotalPaid != nil {
		order.TotalPaid = *req.TotalPaid
	}
	
	if req.HasSecurityItem != nil {
		order.HasSecurityItem = *req.HasSecurityItem
	}
	

	if req.PaymentStatus != "" {
		if order.PaymentStatus != req.PaymentStatus {
			s.logActivity(order.ID, userID, "UPDATED", "Status Pembayaran: "+order.PaymentStatus, req.PaymentStatus)
		}
		order.PaymentStatus = req.PaymentStatus
	}
	
	if req.Status != "" {
		if order.Status != req.Status {
			s.logActivity(order.ID, userID, "UPDATED", "Status: "+order.Status, req.Status)
		}
		order.Status = req.Status
	}
	if req.Notes != "" {
		if order.Notes != req.Notes {
			s.logActivity(order.ID, userID, "UPDATED", "Catatan: "+order.Notes, req.Notes)
		}
		order.Notes = req.Notes
	}

	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	if len(req.Items) > 0 {
		costumeSvc := NewCostumeService()
		var existingItems []models.RentOrderItem
		config.DB.Where("rent_order_id = ?", id).Find(&existingItems)

		existingItemMap := make(map[uint]models.RentOrderItem)
		for _, item := range existingItems {
			existingItemMap[item.CostumeID] = item
		}

		reqCostumeMap := make(map[uint]bool)

		for _, item := range req.Items {
			reqCostumeMap[item.CostumeID] = true
			costumeResp, _ := costumeSvc.GetByID(item.CostumeID)
			
			fee := costumeResp.RentalFee
			if item.CustomRentalFee != nil {
				fee = *item.CustomRentalFee
			}

			if existing, ok := existingItemMap[item.CostumeID]; ok {
				if existing.RentalFee != fee {
					s.logActivity(order.ID, userID, "PRICE_OVERRIDE", costumeResp.Name+": "+strconv.Itoa(existing.RentalFee), strconv.Itoa(fee))
				}
				existing.Quantity = item.Quantity
				existing.RentalFee = fee
				config.DB.Save(&existing)
			} else {
				s.logActivity(order.ID, userID, "ITEM_ADDED", "", costumeResp.Name)
				orderItem := models.RentOrderItem{
					RentOrderID: order.ID,
					CostumeID:   item.CostumeID,
					Quantity:    item.Quantity,
					RentalFee:   fee,
				}
				config.DB.Create(&orderItem)
			}
		}

		for _, item := range existingItems {
			if !reqCostumeMap[item.CostumeID] {
				costumeResp, _ := costumeSvc.GetByID(item.CostumeID)
				s.logActivity(order.ID, userID, "ITEM_REMOVED", costumeResp.Name, "")
				config.DB.Delete(&item)
			}
		}
		// Recalculate total base fee and update BASE_FEE transaction
		var updatedItems []models.RentOrderItem
		config.DB.Where("rent_order_id = ?", id).Find(&updatedItems)
		totalBaseFee := 0
		for _, item := range updatedItems {
			totalBaseFee += (item.RentalFee * item.Quantity)
		}

		var baseFeeTx models.RentTransaction
		if err := config.DB.Where("rent_order_id = ? AND category = ?", id, "BASE_FEE").First(&baseFeeTx).Error; err == nil {
			baseFeeTx.Amount = totalBaseFee
			config.DB.Save(&baseFeeTx)
		} else {
			// Create it if it didn't exist for some reason
			baseFeeTx = models.RentTransaction{
				RentOrderID: id,
				Type:        "DEBIT",
				Category:    "BASE_FEE",
				Amount:      totalBaseFee,
				Notes:       "Biaya Sewa",
				CreatedBy:   userID,
			}
			config.DB.Create(&baseFeeTx)
		}
	}

	// Removed the generic "UPDATED" log, as specific changes are now logged

	return s.GetByID(order.ID)
}

func (s *RentService) MarkReturned(id uint, req dto.MarkReturnedRequest, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.First(&order, id).Error; err != nil {
		return nil, err
	}

	if order.Status != "rented" && order.Status != "overdue" {
		return nil, errors.New("only rented or overdue orders can be returned")
	}

	now := time.Now()
	if req.ReturnedAt != "" {
		if t, err := time.Parse("2006-01-02", req.ReturnedAt); err == nil {
			now = t
		}
	}
	order.Status = "returned"
	order.ActualReturnDate = &now
	order.HasSecurityItem = false

	if req.DamageFee > 0 {
		tx := models.RentTransaction{
			RentOrderID: order.ID,
			Type:        "DEBIT",
			Category:    "DAMAGE_FEE",
			Amount:      req.DamageFee,
			Notes:       "Denda Kerusakan",
			CreatedBy:   userID,
		}
		config.DB.Create(&tx)
	}
	if req.LateFee > 0 {
		tx := models.RentTransaction{
			RentOrderID: order.ID,
			Type:        "DEBIT",
			Category:    "LATE_FEE",
			Amount:      req.LateFee,
			Notes:       "Denda Keterlambatan",
			CreatedBy:   userID,
		}
		config.DB.Create(&tx)
	}

	if req.Payment != nil {
		_, err := s.AddPayment(order.ID, *req.Payment, userID)
		if err != nil {
			return nil, err
		}
		// Re-read order so TotalPaid/PaymentStatus updated by AddPayment aren't clobbered
		if err := config.DB.First(&order, id).Error; err != nil {
			return nil, err
		}
	}

	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	s.logActivity(order.ID, userID, "STATUS_CHANGE", "rented/overdue", "returned")

	return s.GetByID(order.ID)
}

func (s *RentService) MarkRented(id uint, req dto.MarkRentedRequest, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.Preload("Items").First(&order, id).Error; err != nil {
		return nil, err
	}

	if order.Status != "booked" {
		return nil, errors.New("hanya pesanan berstatus 'booked' yang dapat disewakan")
	}

	totalFee := 0
	for _, item := range order.Items {
		totalFee += item.RentalFee * item.Quantity
	}

	// Early takeaway fee is provided by frontend if applicable, so we don't override it unconditionally.

	// Compute debit sums
	var debits []models.RentTransaction
	config.DB.Where("rent_order_id = ? AND type = 'DEBIT'", id).Find(&debits)
	totalDebits := 0
	for _, d := range debits {
		totalDebits += d.Amount
	}

	if req.Payment != nil {
		if order.TotalPaid+req.Payment.Amount < totalFee+totalDebits && req.Payment.PaymentProof == "" && req.Payment.PaymentMethod != "CASH" {
			return nil, errors.New("bukti pelunasan pembayaran wajib diunggah untuk mengambil kostum (disewakan)")
		}
		_, err := s.AddPayment(order.ID, *req.Payment, userID)
		if err != nil {
			return nil, err
		}
		// Re-read order so TotalPaid/PaymentStatus updated by AddPayment aren't clobbered
		if err := config.DB.First(&order, id).Error; err != nil {
			return nil, err
		}
	} else {
		if order.TotalPaid < totalFee+totalDebits {
			return nil, errors.New("pelunasan pembayaran diperlukan untuk mengambil kostum (disewakan)")
		}
	}

	order.Status = "rented"
	order.HasSecurityItem = true

	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	s.logActivity(order.ID, userID, "STATUS_CHANGE", "booked", "rented")

	return s.GetByID(order.ID)
}

func (s *RentService) RollbackStatus(id uint, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.First(&order, id).Error; err != nil {
		return nil, err
	}

	oldStatus := order.Status

	if order.Status == "rented" {
		order.Status = "booked"
		order.HasSecurityItem = false
		if err := config.DB.Save(&order).Error; err != nil {
			return nil, err
		}
		s.logActivity(order.ID, userID, "ROLLBACK", oldStatus, "booked")
	} else if order.Status == "returned" {
		order.Status = "rented"
		order.ActualReturnDate = nil
		order.HasSecurityItem = true
		if err := config.DB.Save(&order).Error; err != nil {
			return nil, err
		}
		s.logActivity(order.ID, userID, "ROLLBACK", oldStatus, "rented")
	} else {
		return nil, errors.New("hanya pesanan berstatus 'rented' atau 'returned' yang dapat dibatalkan statusnya")
	}

	return s.GetByID(order.ID)
}

func (s *RentService) MarkBooked(id uint, req dto.UpgradeToBookedRequest, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.Preload("Items").First(&order, id).Error; err != nil {
		return nil, err
	}

	if order.Status != "draft" {
		return nil, errors.New("hanya pesanan berstatus 'draft' yang dapat diubah ke 'booked'")
	}

	if req.Payment == nil {
		return nil, errors.New("payment required to upgrade to booked")
	}

	if req.Payment.PaymentMethod != "CASH" && req.Payment.PaymentProof == "" {
		return nil, errors.New("bukti pembayaran downpayment wajib diunggah")
	}

	totalBasePrice := 0

	costumeSvc := NewCostumeService()
	for _, item := range order.Items {
		totalBasePrice += item.RentalFee * item.Quantity

		available, err := costumeSvc.GetAvailableQuantityOnDate(item.CostumeID, order.EventDate)
		if err != nil {
			return nil, errors.New("costume not found: " + strconv.Itoa(int(item.CostumeID)))
		}
		if item.Quantity > available {
			return nil, errors.New("insufficient quantity for costume " + strconv.Itoa(int(item.CostumeID)) + ": requested " + strconv.Itoa(item.Quantity) + ", available " + strconv.Itoa(available))
		}
	}

	if req.Payment.Amount < totalBasePrice/2 {
		return nil, errors.New("downpayment must be at least 50% of total base price")
	}

	order.Status = "booked"
	


	_, err := s.AddPayment(order.ID, *req.Payment, userID)
	if err != nil {
		return nil, err
	}

	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	s.logActivity(order.ID, userID, "STATUS_CHANGE", "draft", "booked")

	return s.GetByID(order.ID)
}

func (s *RentService) CancelOrder(id uint, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.First(&order, id).Error; err != nil {
		return nil, err
	}

	if order.Status != "booked" {
		return nil, errors.New("only booked orders can be cancelled")
	}

	now := time.Now()
	within24h := now.Sub(order.CreatedAt).Hours() <= 24
	
	eventDate := time.Date(order.EventDate.Year(), order.EventDate.Month(), order.EventDate.Day(), 0, 0, 0, 0, time.Local)
	outsideD2 := eventDate.Sub(now).Hours() > 48

	if within24h && outsideD2 && order.TotalPaid > 0 {
		// 100% refund - issue a credit to offset the payment
		tx := models.RentTransaction{
			RentOrderID: order.ID,
			Type:        "CREDIT",
			Category:    "REFUND",
			Amount:      -order.TotalPaid, // Negative amount to reduce total paid
			Notes:       "Pengembalian Dana (100%)",
			CreatedBy:   userID,
		}
		config.DB.Create(&tx)
	} else if order.TotalPaid > 0 {
		// Forfeit - they don't get a refund, we keep the money.
		// No transaction needed, or we could log it as forfeited.
		s.logActivity(order.ID, userID, "FORFEIT", "DP/Pembayaran hangus", "")
	}

	order.Status = "cancelled"
	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	s.logActivity(order.ID, userID, "STATUS_CHANGE", "booked", "cancelled")

	return s.GetByID(order.ID)
}

func (s *RentService) ExtendRent(id uint, req dto.ExtendRentRequest, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.Preload("Items").First(&order, id).Error; err != nil {
		return nil, err
	}

	if order.Status != "rented" {
		return nil, errors.New("hanya pesanan berstatus 'rented' yang dapat diperpanjang")
	}

	costumeSvc := NewCostumeService()
	for i := 1; i <= req.ExtraDays; i++ {
		checkDate := order.ExpectedReturnDate.AddDate(0, 0, i)
		for _, item := range order.Items {
			available, err := costumeSvc.GetAvailableQuantityOnDate(item.CostumeID, checkDate)
			if err != nil || item.Quantity > available {
				return nil, errors.New("costume not available for extension: " + strconv.Itoa(int(item.CostumeID)))
			}
		}
	}

	for _, item := range order.Items {
		// Create DEBIT transaction for extension
		extensionFee := item.RentalFee * item.Quantity * req.ExtraDays
		if extensionFee > 0 {
			tx := models.RentTransaction{
				RentOrderID: order.ID,
				Type:        "DEBIT",
				Category:    "EXTENSION_FEE",
				Amount:      extensionFee,
				Notes:       "Biaya Perpanjangan (" + strconv.Itoa(req.ExtraDays) + " hari)",
				CreatedBy:   userID,
			}
			config.DB.Create(&tx)
		}
	}

	order.ExpectedReturnDate = order.ExpectedReturnDate.AddDate(0, 0, req.ExtraDays)
	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}
	s.logActivity(order.ID, userID, "EXTENDED", "rented", "rented")
	return s.GetByID(order.ID)
}


func (s *RentService) Delete(id uint) error {
	return config.DB.Delete(&models.RentOrder{}, id).Error
}

func (s *RentService) toRentOrderResponse(order models.RentOrder) dto.RentOrderResponse {
	items := make([]dto.RentOrderItemResponse, len(order.Items))
	for i, item := range order.Items {
		items[i] = dto.RentOrderItemResponse{
			ID:          item.ID,
			CostumeID:   item.CostumeID,
			Quantity:    item.Quantity,
			RentalFee:   item.RentalFee,
		}
		if item.Costume.Name != "" {
			items[i].CostumeName = item.Costume.Name
			items[i].CoverImage = item.Costume.CoverImage
		}
	}
	
	var actualReturn *string
	if order.ActualReturnDate != nil {
		str := order.ActualReturnDate.Format("2006-01-02")
		actualReturn = &str
	}

	var transactions []dto.RentTransactionResponse
	for _, t := range order.Transactions {
		transactions = append(transactions, dto.RentTransactionResponse{
			ID:            t.ID,
			RentOrderID:   t.RentOrderID,
			Amount:        t.Amount,
			PaymentMethod: t.PaymentMethod,
			PaymentProof:  t.PaymentProof,
			Notes:         t.Notes,
			CreatedAt:     t.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return dto.RentOrderResponse{
		ID:                 order.ID,
		ClientID:           order.ClientID,
		ClientName:         order.Client.Name,
		ClientPhone:        order.Client.Phone,
		ClientAddress:      order.Client.Address,
		GuaranteeType:      order.GuaranteeType,
		EventDate:          order.EventDate.Format("2006-01-02"),
		PickupDate:         order.PickupDate.Format("2006-01-02"),
		ExpectedReturnDate: order.ExpectedReturnDate.Format("2006-01-02"),
		ActualReturnDate:   actualReturn,
		TotalPaid:          order.TotalPaid,
		PaymentStatus:      order.PaymentStatus,
		HasSecurityItem:    order.HasSecurityItem,
		Status:             order.Status,
		Notes:              order.Notes,
		Items:              items,
		Transactions:       transactions,
		CreatedAt:          order.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:          order.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func (s *RentService) AddPayment(orderID uint, req dto.AddPaymentRequest, userID uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.First(&order, orderID).Error; err != nil {
		return nil, errors.New("rent order not found")
	}

	tx := models.RentTransaction{
		RentOrderID:   orderID,
		Type:          "CREDIT",
		Category:      "PAYMENT",
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		PaymentProof:  req.PaymentProof,
		Notes:         req.Notes,
		CreatedBy:     userID,
	}

	if err := config.DB.Create(&tx).Error; err != nil {
		return nil, err
	}

	order.TotalPaid += req.Amount

	// Check if fully paid
	totalFee := 0
	var orderWithItems models.RentOrder
	config.DB.Preload("Items").Preload("Transactions").First(&orderWithItems, orderID)
	for _, item := range orderWithItems.Items {
		totalFee += item.RentalFee * item.Quantity
	}
	
	totalDebits := 0
	for _, t := range orderWithItems.Transactions {
		if t.Type == "DEBIT" {
			totalDebits += t.Amount
		}
	}

	totalTagihan := totalFee + totalDebits
	if order.TotalPaid >= totalTagihan {
		order.PaymentStatus = "LUNAS"
	} else if order.TotalPaid > 0 {
		order.PaymentStatus = "DP"
	}

	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	s.logActivity(orderID, userID, "PAYMENT_ADDED", "Added payment of "+strconv.Itoa(req.Amount), order.Status)

	return s.GetByID(orderID)
}
