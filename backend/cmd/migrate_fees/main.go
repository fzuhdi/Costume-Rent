package main

import (
	"fmt"
	"log"

	"github.com/busana/backend/config"
	"github.com/busana/backend/models"

	"gorm.io/gorm"
)

func main() {
	// Initialize config
	config.LoadEnv()
	config.InitDB()

	db := config.DB

	// We need to read raw rows because the fields are no longer on the RentOrder model
	type OldRentOrder struct {
		ID               uint
		DamageFee        int
		EarlyTakeawayFee int
		LateFee          int
		ExtensionFee     int
		RefundAmount     int
	}

	var oldOrders []OldRentOrder
	if err := db.Table("rent_orders").Find(&oldOrders).Error; err != nil {
		log.Fatalf("Failed to fetch rent_orders: %v", err)
	}

	// Make sure the schema for RentTransaction is up to date before trying to update it
	if err := db.AutoMigrate(&models.RentTransaction{}); err != nil {
		log.Printf("AutoMigrate failed: %v", err)
	}

	// Update existing transactions to be CREDIT PAYMENT
	if err := db.Model(&models.RentTransaction{}).Where("type = ? OR type IS NULL OR type = ''", "").Updates(map[string]interface{}{
		"type":     "CREDIT",
		"category": "PAYMENT",
	}).Error; err != nil {
		log.Fatalf("Failed to update existing transactions: %v", err)
	}

	count := 0
	for _, o := range oldOrders {
		if o.DamageFee > 0 {
			insertFee(db, o.ID, "DEBIT", "DAMAGE_FEE", o.DamageFee, "Biaya Kerusakan (Migrasi)")
			count++
		}
		if o.EarlyTakeawayFee > 0 {
			insertFee(db, o.ID, "DEBIT", "EARLY_TAKEAWAY_FEE", o.EarlyTakeawayFee, "Biaya Ambil Awal (Migrasi)")
			count++
		}
		if o.LateFee > 0 {
			insertFee(db, o.ID, "DEBIT", "LATE_FEE", o.LateFee, "Denda Keterlambatan (Migrasi)")
			count++
		}
		if o.ExtensionFee > 0 {
			insertFee(db, o.ID, "DEBIT", "EXTENSION_FEE", o.ExtensionFee, "Biaya Perpanjangan (Migrasi)")
			count++
		}
	}

	// Drop old columns safely
	db.Exec("ALTER TABLE rent_orders DROP COLUMN IF EXISTS damage_fee")
	db.Exec("ALTER TABLE rent_orders DROP COLUMN IF EXISTS early_takeaway_fee")
	db.Exec("ALTER TABLE rent_orders DROP COLUMN IF EXISTS late_fee")
	db.Exec("ALTER TABLE rent_orders DROP COLUMN IF EXISTS extension_fee")
	db.Exec("ALTER TABLE rent_orders DROP COLUMN IF EXISTS refund_amount")

	fmt.Printf("Migration complete. Inserted %d fee transactions.\n", count)
}

func insertFee(db *gorm.DB, orderID uint, t string, cat string, amount int, notes string) {
	tx := models.RentTransaction{
		RentOrderID: orderID,
		Type:        t,
		Category:    cat,
		Amount:      amount,
		Notes:       notes,
	}
	if err := db.Create(&tx).Error; err != nil {
		log.Printf("Failed to insert %s for order %d: %v", cat, orderID, err)
	}
}
