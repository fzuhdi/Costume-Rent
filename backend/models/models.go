package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name       string         `json:"name" gorm:"not null" validate:"required"`
	Email      string         `json:"email" gorm:"not null;uniqueIndex" validate:"required,email"`
	Password   string         `json:"-" gorm:"not null"`
	Role       string         `json:"role" gorm:"not null;default:admin"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type Region struct {
	gorm.Model
	Name      string         `json:"name" gorm:"not null;uniqueIndex"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type Category struct {
	gorm.Model
	Name      string         `json:"name" gorm:"not null;uniqueIndex"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type Costume struct {
	gorm.Model
	Name        string          `json:"name" gorm:"not null" validate:"required"`
	Description string          `json:"description"`
	RegionID    *uint           `json:"region_id"`
	Region      Region          `json:"region,omitempty" gorm:"foreignKey:RegionID"`
	CategoryID  *uint           `json:"category_id"`
	Category    Category        `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Condition   string          `json:"condition" gorm:"default:good"`
	Quantity    int             `json:"quantity" gorm:"default:1"`
	AcquiredAt  *time.Time      `json:"acquired_at"`
	CoverImage  string          `json:"cover_image"`
	Images      []CostumeImage  `json:"images,omitempty" gorm:"foreignKey:CostumeID"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type CostumeImage struct {
	gorm.Model
	CostumeID uint      `json:"costume_id" gorm:"not null;index"`
	Path      string    `json:"path" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}

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

type RentOrder struct {
	gorm.Model
	ClientID        uint            `json:"client_id" gorm:"not null" validate:"required"`
	Client          Client          `json:"client,omitempty" gorm:"foreignKey:ClientID"`
	GuaranteeType   string          `json:"guarantee_type" gorm:"not null" validate:"required"`
	GuaranteeNumber string          `json:"guarantee_number"`
	RentStart       time.Time       `json:"rent_start" gorm:"not null" validate:"required"`
	RentEnd         time.Time       `json:"rent_end" gorm:"not null" validate:"required"`
	Status          string          `json:"status" gorm:"default:active"`
	Notes           string          `json:"notes"`
	CreatedBy       uint            `json:"created_by"`
	Creator         User            `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Items           []RentOrderItem `json:"items,omitempty" gorm:"foreignKey:RentOrderID"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       gorm.DeletedAt  `json:"deleted_at,omitempty" gorm:"index"`
}

type RentOrderItem struct {
	gorm.Model
	RentOrderID uint    `json:"rent_order_id" gorm:"not null;index" validate:"required"`
	CostumeID   uint    `json:"costume_id" gorm:"not null" validate:"required"`
	Costume     Costume `json:"costume,omitempty" gorm:"foreignKey:CostumeID"`
	Quantity    int     `json:"quantity" gorm:"not null;default:1" validate:"required,min=1"`
	CreatedAt   time.Time `json:"created_at"`
}

type AppSetting struct {
	Key       string    `json:"key" gorm:"primaryKey"`
	Value     string    `json:"value" gorm:"default:''"`
	UpdatedAt time.Time `json:"updated_at"`
}