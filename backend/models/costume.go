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
	Condition   string          `json:"condition" gorm:"default:good"`
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