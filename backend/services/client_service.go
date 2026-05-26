package services

import (
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
)

type ClientService struct{}

func NewClientService() *ClientService {
	return &ClientService{}
}

func (s *ClientService) List(filter dto.ClientFilter) (*dto.PaginatedResponse, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	query := config.DB.Model(&models.Client{})

	if filter.Search != "" {
		query = query.Where("name LIKE ?", "%"+filter.Search+"%")
	}

	var total int64
	query.Count(&total)

	var clients []models.Client
	offset := (filter.Page - 1) * filter.Limit
	if err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&clients).Error; err != nil {
		return nil, err
	}

	response := []dto.ClientResponse{}
	for _, c := range clients {
		var totalRents, activeRents int64
		config.DB.Model(&models.RentOrder{}).Where("client_id = ? AND deleted_at IS NULL", c.ID).Count(&totalRents)
		config.DB.Model(&models.RentOrder{}).Where("client_id = ? AND status = ? AND deleted_at IS NULL", c.ID, "active").Count(&activeRents)

		var lastRentDate *time.Time
		var lastRent models.RentOrder
		if err := config.DB.Where("client_id = ? AND deleted_at IS NULL", c.ID).Order("created_at DESC").First(&lastRent).Error; err == nil {
			lastRentDate = &lastRent.CreatedAt
		}

		var hasOverdue bool
		var overdueCount int64
		config.DB.Model(&models.RentOrder{}).Where("client_id = ? AND status = ? AND deleted_at IS NULL", c.ID, "overdue").Count(&overdueCount)
		hasOverdue = overdueCount > 0

		item := dto.ClientResponse{
			ID:          c.ID,
			Name:        c.Name,
			Phone:       c.Phone,
			Address:     c.Address,
			TotalRents:  totalRents,
			ActiveRents: activeRents,
			HasOverdue:  hasOverdue,
			CreatedAt:   c.CreatedAt.Format("2006-01-02"),
		}
		if lastRentDate != nil {
			item.LastRentDate = lastRentDate.Format("2006-01-02")
		}
		response = append(response, item)
	}

	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))

	return &dto.PaginatedResponse{
		Data:       response,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *ClientService) GetByID(id uint) (*models.Client, error) {
	var client models.Client
	if err := config.DB.Preload("RentOrders", "deleted_at IS NULL").Order("created_at DESC").First(&client, id).Error; err != nil {
		return nil, err
	}
	return &client, nil
}

func (s *ClientService) Search(query string, limit int) ([]models.Client, error) {
	if limit < 1 {
		limit = 10
	}

	var clients []models.Client
	searchQuery := "%" + query + "%"
	if err := config.DB.Where("name LIKE ?", searchQuery).
		Limit(limit).
		Find(&clients).Error; err != nil {
		return nil, err
	}
	return clients, nil
}

func (s *ClientService) Create(req dto.CreateClientRequest) (*models.Client, error) {
	client := models.Client{
		Name:    req.Name,
		Phone:   req.Phone,
		Address: req.Address,
	}

	if err := config.DB.Create(&client).Error; err != nil {
		return nil, err
	}

	return s.GetByID(client.ID)
}

func (s *ClientService) Update(id uint, req dto.UpdateClientRequest) (*models.Client, error) {
	var client models.Client
	if err := config.DB.First(&client, id).Error; err != nil {
		return nil, err
	}

	if req.Name != "" {
		client.Name = req.Name
	}
	if req.Phone != "" {
		client.Phone = req.Phone
	}
	if req.Address != "" {
		client.Address = req.Address
	}

	if err := config.DB.Save(&client).Error; err != nil {
		return nil, err
	}

	return s.GetByID(client.ID)
}

func (s *ClientService) Delete(id uint) error {
	return config.DB.Delete(&models.Client{}, id).Error
}

func (s *ClientService) GetRentHistory(clientID uint) ([]models.RentOrder, error) {
	var orders []models.RentOrder
	if err := config.DB.Preload("Client").Preload("Items").Preload("Items.Costume").
		Where("client_id = ? AND deleted_at IS NULL", clientID).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}
