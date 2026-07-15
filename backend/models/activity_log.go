package models

import "time"

type ActivityLog struct {
	BaseModel
	RentOrderID uint      `json:"rent_order_id" gorm:"not null;index"`
	UserID      uint      `json:"user_id" gorm:"not null"`
	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ActionType  string    `json:"action_type" gorm:"not null"` // e.g., 'STATUS_CHANGE', 'PRICE_OVERRIDE', 'FEE_WAIVER'
	OldValue    string    `json:"old_value"`
	NewValue    string    `json:"new_value"`
	Timestamp   time.Time `json:"timestamp" gorm:"not null;autoCreateTime"`
}
