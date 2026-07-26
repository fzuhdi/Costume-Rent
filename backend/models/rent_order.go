package models

import "time"

type RentOrder struct {
	BaseModel
	ClientID              uint              `json:"client_id" gorm:"not null" validate:"required"`
	Client                Client            `json:"client,omitempty" gorm:"foreignKey:ClientID"`
	CustomerAccountID     *uint             `json:"customer_account_id" gorm:"index"`
	CustomerAccount       *CustomerAccount  `json:"-" gorm:"foreignKey:CustomerAccountID"`
	GuaranteeType         string            `json:"guarantee_type" gorm:"not null" validate:"required"`
	EventDate             time.Time         `json:"event_date" gorm:"not null" validate:"required"`
	PickupDate            time.Time         `json:"pickup_date" gorm:"not null" validate:"required"`
	ExpectedReturnDate    time.Time         `json:"expected_return_date" gorm:"not null" validate:"required"`
	ActualReturnDate      *time.Time        `json:"actual_return_date"`
	HasSecurityItem       bool              `json:"has_security_item" gorm:"default:false"`
	Status                string            `json:"status" gorm:"default:booked"`
	OrderSource           string            `json:"order_source" gorm:"default:'offline'"`
	ExpiresAt             *time.Time        `json:"expires_at" gorm:"index"`
	FulfillmentType       string            `json:"fulfillment_type" gorm:"not null;default:'pickup'"`
	DeliveryRequestStatus string            `json:"delivery_request_status" gorm:"not null;default:'not_requested'"`
	ShippingAddress       string            `json:"shipping_address"`
	TermsVersion          string            `json:"terms_version"`
	TermsAcceptedAt       *time.Time        `json:"terms_accepted_at"`
	PickupPhotos          string            `json:"pickup_photos"` // JSON array string
	ReturnPhotos          string            `json:"return_photos"` // JSON array string
	DamagePhotos          string            `json:"damage_photos"` // JSON array string
	Notes                 string            `json:"notes"`
	CreatedBy             uint              `json:"created_by"`
	Creator               User              `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Items                 []RentOrderItem   `json:"items,omitempty" gorm:"foreignKey:RentOrderID"`
	ActivityLogs          []ActivityLog     `json:"activity_logs,omitempty" gorm:"foreignKey:RentOrderID"`
	Transactions          []RentTransaction `json:"transactions,omitempty" gorm:"foreignKey:RentOrderID"`
	PaymentAttempts       []PaymentAttempt  `json:"payment_attempts,omitempty" gorm:"foreignKey:RentOrderID"`
}

type RentOrderItem struct {
	BaseModel
	RentOrderID   uint    `json:"rent_order_id" gorm:"not null;index" validate:"required"`
	CostumeID     uint    `json:"costume_id" gorm:"not null" validate:"required"`
	Costume       Costume `json:"costume,omitempty" gorm:"foreignKey:CostumeID"`
	Quantity      int     `json:"quantity" gorm:"not null;default:1" validate:"required,min=1"`
	RentalFee     int     `json:"rental_fee" gorm:"not null"`
	OriginalPrice int     `json:"original_price" gorm:"not null;default:0"`
}
