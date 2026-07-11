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

	// Overdue and due-soon notifications for rented/overdue orders
	config.DB.Table("rent_orders").
		Select("rent_orders.id as rent_order_id, clients.name as client_name, rent_orders.expected_return_date as expected_return_date, rent_orders.pickup_date as pickup_date, CASE WHEN date(rent_orders.expected_return_date) < ? THEN 'overdue' ELSE 'due_soon' END as type", today).
		Joins("JOIN clients ON clients.id = rent_orders.client_id").
		Where("rent_orders.status IN ? AND date(rent_orders.expected_return_date) <= ? AND rent_orders.deleted_at IS NULL", []string{"rented", "overdue"}, futureDate).
		Order("date(rent_orders.expected_return_date) ASC").
		Scan(&items)

	// No-show notifications for booked orders past pickup date
	var noShowItems []dto.NotificationItem
	config.DB.Table("rent_orders").
		Select("rent_orders.id as rent_order_id, clients.name as client_name, rent_orders.expected_return_date as expected_return_date, rent_orders.pickup_date as pickup_date, 'no_show' as type").
		Joins("JOIN clients ON clients.id = rent_orders.client_id").
		Where("rent_orders.status = ? AND date(rent_orders.pickup_date) <= ? AND rent_orders.deleted_at IS NULL", "booked", today).
		Order("date(rent_orders.pickup_date) ASC").
		Scan(&noShowItems)

	items = append(items, noShowItems...)
	total := int64(len(items))

	return &dto.NotificationResponse{
		Count: total,
		Items: items,
	}, nil
}

func (s *NotificationService) UpdateOverdueStatus() error {
	today := time.Now().Format("2006-01-02")
	return config.DB.Model(&models.RentOrder{}).
		Where("status = ? AND date(expected_return_date) < ? AND deleted_at IS NULL", "rented", today).
		Update("status", "overdue").Error
}
