package main

import (
	"log"

	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
)

func main() {
	config.InitDB()

	// 1. Delete all corrections
	if err := config.DB.Where("category = ?", "CORRECTION").Delete(&models.RentTransaction{}).Error; err != nil {
		log.Fatalf("Failed to delete corrections: %v", err)
	}
	
	// 2. Unvoid all transactions
	if err := config.DB.Model(&models.RentTransaction{}).Where("is_voided = ?", true).Update("is_voided", false).Error; err != nil {
		log.Fatalf("Failed to unvoid transactions: %v", err)
	}

	// 3. Recalculate order 2 total (or all orders)
	var orders []models.RentOrder
	if err := config.DB.Preload("Items").Preload("Transactions").Find(&orders).Error; err != nil {
		log.Fatalf("Failed to fetch orders: %v", err)
	}

	for _, order := range orders {
		totalPaid := 0
		totalDebits := 0

		for _, t := range order.Transactions {
			if t.Type == "DEBIT" {
				totalDebits += t.Amount
			} else if t.Type == "CREDIT" || t.Type == "" {
				totalPaid += t.Amount
			}
		}

		order.TotalPaid = totalPaid
		if err := config.DB.Save(&order).Error; err != nil {
			log.Printf("Failed to save order %d: %v", order.ID, err)
		}
	}

	log.Println("Successfully cleaned up correction transactions and recalculated totals!")
}
