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
			query = query.Where("rent_start >= ?", from)
		}
	}
	if filter.To != "" {
		if to, err := time.Parse("2006-01-02", filter.To); err == nil {
			query = query.Where("rent_end <= ?", to)
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
	if err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&orders).Error; err != nil {
		return nil, err
	}

	var response []dto.RentOrderResponse
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

	rentStart, err := time.Parse("2006-01-02", req.RentStart)
	if err != nil {
		return nil, errors.New("invalid rent_start date format")
	}

	rentEnd, err := time.Parse("2006-01-02", req.RentEnd)
	if err != nil {
		return nil, errors.New("invalid rent_end date format")
	}

	if rentEnd.Before(rentStart) {
		return nil, errors.New("rent_end must be after rent_start")
	}

	for _, item := range req.Items {
		available, err := NewCostumeService().GetAvailableQuantity(item.CostumeID)
		if err != nil {
			return nil, errors.New("costume not found: " + strconv.Itoa(int(item.CostumeID)))
		}
		if item.Quantity > available {
			return nil, errors.New("insufficient quantity for costume " + strconv.Itoa(int(item.CostumeID)) + ": requested " + strconv.Itoa(item.Quantity) + ", available " + strconv.Itoa(available))
		}
	}

  order := models.RentOrder{
		ClientID:      clientID,
		GuaranteeType: req.GuaranteeType,
		RentStart:     rentStart,
		RentEnd:       rentEnd,
		Status:        "active",
		Notes:         req.Notes,
		CreatedBy:     userID,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		return nil, err
	}

	for _, item := range req.Items {
		orderItem := models.RentOrderItem{
			RentOrderID: order.ID,
			CostumeID:   item.CostumeID,
			Quantity:    item.Quantity,
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
		order.GuaranteeType = req.GuaranteeType;
	}
	if req.RentStart != "" {
		if t, err := time.Parse("2006-01-02", req.RentStart); err == nil {
			order.RentStart = t
		}
	}
	if req.RentEnd != "" {
		if t, err := time.Parse("2006-01-02", req.RentEnd); err == nil {
			order.RentEnd = t
		}
	}
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

		for _, item := range req.Items {
			orderItem := models.RentOrderItem{
				RentOrderID: order.ID,
				CostumeID:   item.CostumeID,
				Quantity:    item.Quantity,
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

	order.Status = "returned"
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
			ID:         item.ID,
			CostumeID:  item.CostumeID,
			Quantity:   item.Quantity,
		}
		if item.Costume.Name != "" {
			items[i].CostumeName = item.Costume.Name
			items[i].CoverImage = item.Costume.CoverImage
		}
	}

	return dto.RentOrderResponse{
		ID:            order.ID,
		ClientID:      order.ClientID,
		ClientName:    order.Client.Name,
		ClientPhone:   order.Client.Phone,
		ClientAddress: order.Client.Address,
		GuaranteeType: order.GuaranteeType,
		RentStart:     order.RentStart.Format("2006-01-02"),
		RentEnd:       order.RentEnd.Format("2006-01-02"),
		Status:        order.Status,
		Notes:         order.Notes,
		Items:         items,
		CreatedAt:     order.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:     order.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}