package dto

type CreateRentOrderRequest struct {
	ClientID           *uint              `json:"client_id"`
	ClientName         string             `json:"client_name"`
	ClientPhone        string             `json:"client_phone"`
	ClientAddress      string             `json:"client_address"`
	GuaranteeType      string             `json:"guarantee_type"`
	EventDate          string             `json:"event_date" binding:"required"`
	PickupDate         string             `json:"pickup_date"`
	ExpectedReturnDate string             `json:"expected_return_date"`
	Payment            *AddPaymentRequest `json:"payment"` // Replaces TotalPaid, PaymentMethod, PaymentProof for "booked" creation
	HasSecurityItem    bool               `json:"has_security_item"`
	Status             string             `json:"status"`
	Items              []RentItemInput    `json:"items" binding:"required"`
	Notes              string             `json:"notes"`
}

type RentItemInput struct {
	CostumeID       uint `json:"costume_id" binding:"required"`
	Quantity        int  `json:"quantity" binding:"required,min=1"`
	CustomRentalFee *int `json:"custom_rental_fee"`
}

type UpdateRentOrderRequest struct {
	ClientID           *uint           `json:"client_id"`
	GuaranteeType      string          `json:"guarantee_type"`
	EventDate          string          `json:"event_date"`
	PickupDate         string          `json:"pickup_date"`
	ExpectedReturnDate string          `json:"expected_return_date"`
	ActualReturnDate   *string         `json:"actual_return_date"`
	HasSecurityItem    *bool           `json:"has_security_item"`
	Status             string          `json:"status"`
	Notes              string          `json:"notes"`
	Items              []RentItemInput `json:"items"`
}

type RentOrderResponse struct {
	ID                 uint                      `json:"id"`
	ClientID           uint                      `json:"client_id"`
	ClientName         string                    `json:"client_name"`
	ClientPhone        string                    `json:"client_phone"`
	ClientAddress      string                    `json:"client_address"`
	GuaranteeType      string                    `json:"guarantee_type"`
	EventDate          string                    `json:"event_date"`
	PickupDate         string                    `json:"pickup_date"`
	ExpectedReturnDate string                    `json:"expected_return_date"`
	ActualReturnDate   *string                   `json:"actual_return_date"`
	PaymentSummary     PaymentSummary            `json:"payment_summary"`
	HasSecurityItem    bool                      `json:"has_security_item"`
	Status             string                    `json:"status"`
	PickupPhotos       []string                  `json:"pickup_photos"`
	ReturnPhotos       []string                  `json:"return_photos"`
	DamagePhotos       []string                  `json:"damage_photos"`
	Notes              string                    `json:"notes"`
	CreatedBy          string                    `json:"created_by"`
	Items              []RentOrderItemResponse   `json:"items"`
	ActivityLogs       []ActivityLogResponse     `json:"activity_logs,omitempty"`
	Transactions       []RentTransactionResponse `json:"transactions,omitempty"`
	CreatedAt          string                    `json:"created_at"`
	UpdatedAt          string                    `json:"updated_at"`
}

type ActivityLogResponse struct {
	ID         uint   `json:"id"`
	ActionType string `json:"action_type"`
	OldValue   string `json:"old_value"`
	NewValue   string `json:"new_value"`
	CreatedAt  string `json:"created_at"`
}
type PaymentSummary struct {
	TotalDebits  int    `json:"total_debits"`
	TotalCredits int    `json:"total_credits"`
	Balance      int    `json:"balance"`
	Status       string `json:"status"`
}

type CostumeMinResponse struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Size        string `json:"size"`
	RentalFee   int    `json:"rental_fee"`
	Description string `json:"description"`
	CoverImage  string `json:"cover_image"`
}

type RentOrderItemResponse struct {
	ID            uint               `json:"id"`
	CostumeID     uint               `json:"costume_id"`
	Quantity      int                `json:"quantity"`
	RentalFee     int                `json:"rental_fee"`
	OriginalPrice int                `json:"original_price"`
	Costume       CostumeMinResponse `json:"costume"`
}

type RentOrderFilter struct {
	Status   string `form:"status"`
	ClientID string `form:"client_id"`
	From     string `form:"from"`
	To       string `form:"to"`
	Search   string `form:"search"`
	Page     int    `form:"page"`
	Limit    int    `form:"limit"`
}

type ReceiveOrderRequest struct {
	GuaranteeReturned bool     `json:"guarantee_returned"`
	ReturnPhotos      []string `json:"return_photos"`
}

type MarkReturnedRequest struct {
	ReturnedAt      string             `json:"returned_at"`
	DamageFee       int                `json:"damage_fee"`
	OriginalLateFee *int               `json:"original_late_fee"`
	LateFee         int                `json:"late_fee"` // Some forms might need this
	DamagedItems    []DamagedItem      `json:"damaged_items"`
	Payment         *AddPaymentRequest `json:"payment"`
	ReturnPhotos    []string           `json:"return_photos"`
	DamagePhotos    []string           `json:"damage_photos"`
}

type DamagedItem struct {
	CostumeID uint `json:"costume_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

type MarkRentedRequest struct {
	GuaranteeType string             `json:"guarantee_type" binding:"required"`
	Payment       *AddPaymentRequest `json:"payment"`
	PickupPhotos  []string           `json:"pickup_photos"`
}

type UpgradeToBookedRequest struct {
	Payment *AddPaymentRequest `json:"payment"`
}

type ExtendRentRequest struct {
	ExtraDays          int  `json:"extra_days" binding:"required,min=1"`
	CustomExtensionFee *int `json:"custom_extension_fee"`
}

type CancelRentRequest struct{}

type NotificationResponse struct {
	Count int64              `json:"count"`
	Items []NotificationItem `json:"items"`
}

type NotificationItem struct {
	RentOrderID        uint   `json:"rent_order_id"`
	ClientName         string `json:"client_name"`
	ExpectedReturnDate string `json:"expected_return_date"`
	PickupDate         string `json:"pickup_date"`
	Type               string `json:"type"`
}

type RentTransactionResponse struct {
	ID             uint   `json:"id"`
	RentOrderID    uint   `json:"rent_order_id"`
	Type           string `json:"type"`
	Category       string `json:"category"`
	Amount         int    `json:"amount"`
	OriginalAmount int    `json:"original_amount"`
	PaymentMethod  string `json:"payment_method"`
	PaymentProof   string `json:"payment_proof"`
	Notes          string `json:"notes"`
	IsVoided       bool   `json:"is_voided"`
	CreatedAt      string `json:"created_at"`
}

type AddPaymentRequest struct {
	Amount        int    `json:"amount" binding:"required,min=1"`
	PaymentMethod string `json:"payment_method" binding:"required"`
	PaymentProof  string `json:"payment_proof"`
	Notes         string `json:"notes"`
}
