//go:build ignore

package main

import (
	"fmt"
	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
)

func main() {
	config.InitDB()
	db := config.GetDB()

	id := uint(1)
	costume := models.Costume{
		Name:          "Tari Piring Dummy",
		Description:   "Dummy",
		Size:          "All Size",
		RegionID:      &id,
		CategoryID:    &id,
		RentalFee:     150000,
		TotalQuantity: 5,
	}
	if err := db.Create(&costume).Error; err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Dummy Costume created with ID", costume.ID)
	}

	client := models.Client{
		Name:    "John Doe",
		Phone:   "08123456789",
		Address: "Jakarta",
	}
	db.Create(&client)
}
