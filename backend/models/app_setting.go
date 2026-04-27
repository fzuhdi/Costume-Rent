package models

import (
	"time"

	"gorm.io/gorm"
)

type AppSetting struct {
	Key       string    `json:"key" gorm:"primaryKey"`
	Value     string    `json:"value" gorm:"default:''"`
	UpdatedAt time.Time `json:"updated_at"`
}