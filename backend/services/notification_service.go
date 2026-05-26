package services

import (
	"os"
	"strconv"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
)

type NotificationService struct{}

func NewNotificationService() *NotificationService {
	return &NotificationService{}
}

func (s *NotificationService) GetNotifications() (*dto.NotificationResponse, error) {
	dueDays := 3
	if days := os.Getenv("NOTIFICATION_DUE_DAYS"); days != "" {
		if d, err := strconv.Atoi(days); err == nil {
			dueDays = d
		}
	}

	today := time.Now().Format("2006-01-02")
	futureDate := time.Now().AddDate(0, 0, dueDays).Format("2006-01-02")

	items := []dto.NotificationItem{}
	var total int64

	config.DB.Table("rent_orders").
		Select("rent_orders.id as rent_order_id, clients.name as client_name, rent_orders.rent_end, CASE WHEN rent_orders.rent_end < ? THEN 'overdue' ELSE 'due_soon' END as type", today).
		Joins("JOIN clients ON clients.id = rent_orders.client_id").
		Where("rent_orders.status = ? AND rent_orders.rent_end <= ? AND rent_orders.deleted_at IS NULL", "active", futureDate).
		Order("rent_orders.rent_end ASC").
		Scan(&items)

	total = int64(len(items))

	return &dto.NotificationResponse{
		Count: total,
		Items: items,
	}, nil
}

func (s *NotificationService) UpdateOverdueStatus() error {
	today := time.Now().Format("2006-01-02")
	return config.DB.Model(&models.RentOrder{}).
		Where("status = ? AND rent_end < ? AND deleted_at IS NULL", "active", today).
		Update("status", "overdue").Error
}
