package services

import (
	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
	"time"
)

type StatsService struct{}

func NewStatsService() *StatsService {
	return &StatsService{}
}

type DashboardStats struct {
	TotalActiveRents int64 `json:"total_active_rents"`
	TotalClients     int64 `json:"total_clients"`
	StockUtilization float64 `json:"stock_utilization"`
	RevenueChart     []RevenuePoint `json:"revenue_chart"`
	OverdueReturns   []models.RentOrder `json:"overdue_returns"`
	UpcomingPickups  []models.RentOrder `json:"upcoming_pickups"`
	UpcomingReturns  []models.RentOrder `json:"upcoming_returns"`
	TopCostumes      []TopCostume `json:"top_costumes"`
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
	
	// 1. Total Active Rents (Draft, Booked, Rented)
	db.Model(&models.RentOrder{}).Where("status IN ?", []string{"Draft", "Booked", "Rented"}).Count(&stats.TotalActiveRents)
	
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
	db.Preload("Items").Where("status = ? AND expected_return_date < ?", "Rented", nowStr).Find(&stats.OverdueReturns)
	if stats.OverdueReturns == nil {
		stats.OverdueReturns = make([]models.RentOrder, 0)
	}

	// 5. Upcoming Pickups (Next 7 days, Booked status)
	next7Days := time.Now().AddDate(0, 0, 7).Format("2006-01-02")
	db.Preload("Items").Where("status = ? AND pickup_date >= ? AND pickup_date <= ?", "Booked", nowStr, next7Days).Order("pickup_date asc").Find(&stats.UpcomingPickups)
	if stats.UpcomingPickups == nil {
		stats.UpcomingPickups = make([]models.RentOrder, 0)
	}

	// 6. Upcoming Returns (Next 7 days, Rented status)
	db.Preload("Items").Where("status = ? AND expected_return_date >= ? AND expected_return_date <= ?", "Rented", nowStr, next7Days).Order("expected_return_date asc").Find(&stats.UpcomingReturns)
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

	// 8. Revenue Chart (Last 7 Days for simplicity)
	stats.RevenueChart = make([]RevenuePoint, 0)
	for i := 6; i >= 0; i-- {
		dateStr := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		
		var dailyRevenue float64
		// Simple proxy: total_harga_sewa of all non-canceled orders created on that date
		db.Model(&models.RentOrder{}).
			Where("status != 'Canceled' AND DATE(created_at) = ?", dateStr).
			Select("COALESCE(SUM(total_harga_sewa), 0)").Scan(&dailyRevenue)
		
		stats.RevenueChart = append(stats.RevenueChart, RevenuePoint{
			Date:   dateStr,
			Amount: dailyRevenue,
		})
	}

	return stats, nil
}
