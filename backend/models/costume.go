package models

import "time"

type Region struct {
	BaseModel
	Name string `json:"name" gorm:"not null;uniqueIndex"`
}

type Category struct {
	BaseModel
	Name string `json:"name" gorm:"not null;uniqueIndex"`
}

type Costume struct {
	BaseModel
	Name          string         `json:"name" gorm:"not null" validate:"required"`
	Description   string         `json:"description"`
	Size          string         `json:"size" gorm:"default:'All Size'"`
	RegionID      *uint          `json:"region_id"`
	Region        Region         `json:"region,omitempty" gorm:"foreignKey:RegionID"`
	CategoryID    *uint          `json:"category_id"`
	Category      Category       `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	RentalFee     int            `json:"rental_fee" gorm:"default:0"`
	TotalQuantity int            `json:"total_quantity" gorm:"default:1"`
	AcquiredAt    *time.Time     `json:"acquired_at"`
	CoverImage    string         `json:"cover_image"`
	Images        []CostumeImage `json:"images,omitempty" gorm:"foreignKey:CostumeID"`
}

type CostumeImage struct {
	BaseModel
	CostumeID uint   `json:"costume_id" gorm:"not null;index"`
	Path      string `json:"path" gorm:"not null"`
}
