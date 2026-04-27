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