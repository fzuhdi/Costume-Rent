package models

import (
	"time"

	"gorm.io/gorm"
)

type Client struct {
	gorm.Model
	Name       string         `json:"name" gorm:"not null" validate:"required"`
	Phone      string         `json:"phone"`
	Address    string         `json:"address"`
	RentOrders []RentOrder    `json:"rent_orders,omitempty" gorm:"foreignKey:ClientID"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}