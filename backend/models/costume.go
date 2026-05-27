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
	Name        string          `json:"name" gorm:"not null" validate:"required"`
	Description string          `json:"description"`
	RegionID    *uint           `json:"region_id"`
	Region      Region          `json:"region,omitempty" gorm:"foreignKey:RegionID"`
	CategoryID  *uint           `json:"category_id"`
	Category    Category        `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Price       int             `json:"price" gorm:"default:0"`
	Quantity    int             `json:"quantity" gorm:"default:1"`
	AcquiredAt  *time.Time      `json:"acquired_at"`
	CoverImage  string          `json:"cover_image"`
	Images      []CostumeImage  `json:"images,omitempty" gorm:"foreignKey:CostumeID"`
}

type CostumeImage struct {
	BaseModel
	CostumeID uint      `json:"costume_id" gorm:"not null;index"`
	Path      string    `json:"path" gorm:"not null"`
}

type CostumeAvailabilityBlock struct {
	BaseModel
	CostumeID uint      `json:"costume_id" gorm:"not null;index"`
	Costume   Costume   `json:"costume,omitempty" gorm:"foreignKey:CostumeID"`
	VariantID string    `json:"variant_id" gorm:"default:'';index"`
	StartDate time.Time `json:"start_date" gorm:"not null;index"`
	EndDate   time.Time `json:"end_date" gorm:"not null;index"`
	Reason    string    `json:"reason"`
}
