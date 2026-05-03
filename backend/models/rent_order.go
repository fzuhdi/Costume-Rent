package models

import "time"

type RentOrder struct {
	BaseModel
	ClientID        uint            `json:"client_id" gorm:"not null" validate:"required"`
	Client          Client          `json:"client,omitempty" gorm:"foreignKey:ClientID"`
	GuaranteeType   string          `json:"guarantee_type" gorm:"not null" validate:"required"`
	RentStart       time.Time       `json:"rent_start" gorm:"not null" validate:"required"`
	RentEnd         time.Time       `json:"rent_end" gorm:"not null" validate:"required"`
	Status          string          `json:"status" gorm:"default:active"`
	Notes           string          `json:"notes"`
	CreatedBy       uint            `json:"created_by"`
	Creator         User            `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Items           []RentOrderItem `json:"items,omitempty" gorm:"foreignKey:RentOrderID"`
}

type RentOrderItem struct {
	BaseModel
	RentOrderID uint    `json:"rent_order_id" gorm:"not null;index" validate:"required"`
	CostumeID uint    `json:"costume_id" gorm:"not null" validate:"required"`
	Costume     Costume `json:"costume,omitempty" gorm:"foreignKey:CostumeID"`
	Quantity    int     `json:"quantity" gorm:"not null;default:1" validate:"required,min=1"`
}