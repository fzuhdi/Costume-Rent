package services

import (
	"errors"
	"math"
	"strconv"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
)

type RentService struct{}

func NewRentService() *RentService {
	return &RentService{}
}

func (s *RentService) List(filter dto.RentOrderFilter) (*dto.PaginatedResponse, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	query := config.DB.Model(&models.RentOrder{}).Preload("Client").Preload("Items").Preload("Items.Costume")

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
	var order models.RentOrder
	if err := config.DB.Preload("Client").Preload("Items").Preload("Items.Costume").First(&order, id).Error; err != nil {
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

	pickupDate := eventDate.AddDate(0, 0, -2)
	expectedReturnDate := eventDate.AddDate(0, 0, 1)

	costumeSvc := NewCostumeService()
	for _, item := range req.Items {
		available, err := costumeSvc.GetAvailableQuantity(item.CostumeID)
		if err != nil {
			return nil, errors.New("costume not found: " + strconv.Itoa(int(item.CostumeID)))
		}
		if item.Quantity > available {
			return nil, errors.New("insufficient quantity for costume " + strconv.Itoa(int(item.CostumeID)) + ": requested " + strconv.Itoa(item.Quantity) + ", available " + strconv.Itoa(available))
		}
	}

	order := models.RentOrder{
		ClientID:           clientID,
		GuaranteeType:      req.GuaranteeType,
		EventDate:          eventDate,
		PickupDate:         pickupDate,
		ExpectedReturnDate: expectedReturnDate,
		Downpayment:        req.Downpayment,
		HasSecurityItem:    req.HasSecurityItem,
		Status:             "active",
		Notes:              req.Notes,
		CreatedBy:          userID,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		return nil, err
	}

	for _, item := range req.Items {
		costumeResp, _ := costumeSvc.GetByID(item.CostumeID)
		
		orderItem := models.RentOrderItem{
			RentOrderID: order.ID,
			CostumeID:   item.CostumeID,
			Quantity:    item.Quantity,
			RentalFee:   costumeResp.RentalFee,
		}
		if err := config.DB.Create(&orderItem).Error; err != nil {
			config.DB.Delete(&order)
			return nil, err
		}
	}

	return s.GetByID(order.ID)
}

func (s *RentService) Update(id uint, req dto.UpdateRentOrderRequest) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.First(&order, id).Error; err != nil {
		return nil, err
	}

	if req.GuaranteeType != "" {
		order.GuaranteeType = req.GuaranteeType
	}
	if req.EventDate != "" {
		if t, err := time.Parse("2006-01-02", req.EventDate); err == nil {
			order.EventDate = t
			order.PickupDate = t.AddDate(0, 0, -2)
			order.ExpectedReturnDate = t.AddDate(0, 0, 1)
		}
	}
	if req.ActualReturnDate != nil {
		if t, err := time.Parse("2006-01-02", *req.ActualReturnDate); err == nil {
			order.ActualReturnDate = &t
		}
	}
	
	// Update these regardless of zero values for now (simple logic)
	order.Downpayment = req.Downpayment
	order.DamageFee = req.DamageFee
	order.HasSecurityItem = req.HasSecurityItem
	
	if req.Status != "" {
		order.Status = req.Status
	}
	if req.Notes != "" {
		order.Notes = req.Notes
	}

	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	if len(req.Items) > 0 {
		config.DB.Where("rent_order_id = ?", id).Delete(&models.RentOrderItem{})
		costumeSvc := NewCostumeService()

		for _, item := range req.Items {
			costumeResp, _ := costumeSvc.GetByID(item.CostumeID)
			orderItem := models.RentOrderItem{
				RentOrderID: order.ID,
				CostumeID:   item.CostumeID,
				Quantity:    item.Quantity,
				RentalFee:   costumeResp.RentalFee,
			}
			config.DB.Create(&orderItem)
		}
	}

	return s.GetByID(order.ID)
}

func (s *RentService) MarkReturned(id uint) (*models.RentOrder, error) {
	var order models.RentOrder
	if err := config.DB.First(&order, id).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	order.Status = "returned"
	order.ActualReturnDate = &now
	// Return security item conceptually
	order.HasSecurityItem = false 

	if err := config.DB.Save(&order).Error; err != nil {
		return nil, err
	}

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
		Downpayment:        order.Downpayment,
		DamageFee:          order.DamageFee,
		HasSecurityItem:    order.HasSecurityItem,
		Status:             order.Status,
		Notes:              order.Notes,
		Items:              items,
		CreatedAt:          order.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:          order.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
