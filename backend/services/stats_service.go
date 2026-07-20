package services

import (
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
)

type StatsService struct{}

func NewStatsService() *StatsService {
	return &StatsService{}
}

type DashboardStats struct {
	TotalActiveRents int64              `json:"total_active_rents"`
	TotalClients     int64              `json:"total_clients"`
	StockUtilization float64            `json:"stock_utilization"`
	OverdueReturns   []models.RentOrder `json:"overdue_returns"`
	UpcomingPickups  []models.RentOrder `json:"upcoming_pickups"`
	UpcomingReturns  []models.RentOrder `json:"upcoming_returns"`
	TopCostumes      []TopCostume       `json:"top_costumes"`
}

type RevenuePoint struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

type TopCostume struct {
	CostumeID   uint   `json:"costume_id"`
	CostumeName string `json:"costume_name"`
	RentCount   int    `json:"rent_count"`
}

func (s *StatsService) GetDashboardStats() (*DashboardStats, error) {
	db := config.DB
	stats := &DashboardStats{}

	// 1. Total Active Rents (Draft, Booked, Rented, Overdue)
	db.Model(&models.RentOrder{}).Where("status IN ?", []string{"pending", "booked", "rented", "overdue"}).Count(&stats.TotalActiveRents)

	// 2. Total Clients
	db.Model(&models.Client{}).Count(&stats.TotalClients)

	// 3. Stock Utilization

	// We need to calculate from costumes table
	type QtySum struct {
		TotalSum     int64
		AvailableSum int64
	}
	var qs QtySum
	db.Model(&models.Costume{}).Select("COALESCE(SUM(total_quantity), 0) as total_sum, COALESCE(SUM(available_quantity), SUM(total_quantity)) as available_sum").Scan(&qs)

	if qs.TotalSum > 0 {
		// Available sum means what's NOT rented. So rented = Total - Available
		rentedQty := qs.TotalSum - qs.AvailableSum
		stats.StockUtilization = float64(rentedQty) / float64(qs.TotalSum) * 100.0
	} else {
		stats.StockUtilization = 0
	}

	// 4. Overdue Returns
	nowStr := time.Now().Format("2006-01-02")
	db.Preload("Items").Preload("Client").Where("status = ? AND expected_return_date < ?", "rented", nowStr).Find(&stats.OverdueReturns)
	if stats.OverdueReturns == nil {
		stats.OverdueReturns = make([]models.RentOrder, 0)
	}

	// 5. Upcoming Pickups (Next 7 days, Booked status)
	next7Days := time.Now().AddDate(0, 0, 7).Format("2006-01-02")
	db.Preload("Items").Preload("Client").Where("status = ? AND pickup_date >= ? AND pickup_date <= ?", "booked", nowStr, next7Days).Order("pickup_date asc").Find(&stats.UpcomingPickups)
	if stats.UpcomingPickups == nil {
		stats.UpcomingPickups = make([]models.RentOrder, 0)
	}

	// 6. Upcoming Returns (Next 7 days, Rented status)
	db.Preload("Items").Preload("Client").Where("status IN ? AND expected_return_date >= ? AND expected_return_date <= ?", []string{"rented", "overdue"}, nowStr, next7Days).Order("expected_return_date asc").Find(&stats.UpcomingReturns)
	if stats.UpcomingReturns == nil {
		stats.UpcomingReturns = make([]models.RentOrder, 0)
	}

	// 7. Top Costumes (All time)
	db.Table("rent_order_items").
		Select("costume_id, costume_name, SUM(quantity) as rent_count").
		Group("costume_id, costume_name").
		Order("rent_count DESC").
		Limit(5).
		Scan(&stats.TopCostumes)
	if stats.TopCostumes == nil {
		stats.TopCostumes = make([]TopCostume, 0)
	}

	return stats, nil
}

func (s *StatsService) GetRevenueChart(filter string) ([]RevenuePoint, error) {
	db := config.DB
	chart := make([]RevenuePoint, 0)
	now := time.Now()

	switch filter {
	case "weekly":
		// Last 12 weeks
		for i := 11; i >= 0; i-- {
			weekStart := now.AddDate(0, 0, -int(now.Weekday())-(i*7))
			weekEnd := weekStart.AddDate(0, 0, 6)
			startStr := weekStart.Format("2006-01-02")
			endStr := weekEnd.Format("2006-01-02")

			var revenue float64
			db.Table("rent_order_items").
				Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
				Where("rent_orders.status != 'canceled' AND DATE(rent_orders.created_at) >= ? AND DATE(rent_orders.created_at) <= ?", startStr, endStr).
				Select("COALESCE(SUM(rent_order_items.rental_fee * rent_order_items.quantity), 0)").Scan(&revenue)

			chart = append(chart, RevenuePoint{
				Date:   startStr, // Week starting on
				Amount: revenue,
			})
		}
	case "monthly":
		// Last 12 months
		for i := 11; i >= 0; i-- {
			month := now.AddDate(0, -i, 0)
			prefix := month.Format("2006-01")

			var revenue float64
			db.Table("rent_order_items").
				Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
				Where("rent_orders.status != 'canceled' AND rent_orders.created_at LIKE ?", prefix+"%").
				Select("COALESCE(SUM(rent_order_items.rental_fee * rent_order_items.quantity), 0)").Scan(&revenue)

			chart = append(chart, RevenuePoint{
				Date:   month.Format("Jan 2006"),
				Amount: revenue,
			})
		}
	case "yearly":
		// Last 5 years
		for i := 4; i >= 0; i-- {
			year := now.AddDate(-i, 0, 0)
			prefix := year.Format("2006")

			var revenue float64
			db.Table("rent_order_items").
				Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
				Where("rent_orders.status != 'canceled' AND rent_orders.created_at LIKE ?", prefix+"%").
				Select("COALESCE(SUM(rent_order_items.rental_fee * rent_order_items.quantity), 0)").Scan(&revenue)

			chart = append(chart, RevenuePoint{
				Date:   prefix,
				Amount: revenue,
			})
		}
	default:
		// "daily" (default): Last 30 days
		for i := 29; i >= 0; i-- {
			dateStr := now.AddDate(0, 0, -i).Format("2006-01-02")
			var dailyRevenue float64
			db.Table("rent_order_items").
				Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
				Where("rent_orders.status != 'canceled' AND DATE(rent_orders.created_at) = ?", dateStr).
				Select("COALESCE(SUM(rent_order_items.rental_fee * rent_order_items.quantity), 0)").Scan(&dailyRevenue)

			chart = append(chart, RevenuePoint{
				Date:   dateStr,
				Amount: dailyRevenue,
			})
		}
	}

	return chart, nil
}
