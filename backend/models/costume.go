package models

import (
	"time"

	"gorm.io/gorm"
)

type Region struct {
	gorm.Model
	Name      string         `json:"name" gorm:"not null;uniqueIndex"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type Category struct {
	gorm.Model
	Name      string         `json:"name" gorm:"not null;uniqueIndex"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
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