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
	TotalPaid          *int            `json:"total_paid"`
	PaymentStatus      string          `json:"payment_status"`
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
	TotalPaid          int                       `json:"total_paid"`
	PaymentStatus      string                    `json:"payment_status"`
	HasSecurityItem    bool                      `json:"has_security_item"`
	Status             string                    `json:"status"`
	Notes              string                    `json:"notes"`
	Items              []RentOrderItemResponse   `json:"items"`
	Transactions       []RentTransactionResponse `json:"transactions"`
	CreatedAt          string                    `json:"created_at"`
	UpdatedAt          string                    `json:"updated_at"`
}

type RentOrderItemResponse struct {
	ID          uint   `json:"id"`
	CostumeID   uint   `json:"costume_id"`
	CostumeName string `json:"costume_name"`
	CoverImage  string `json:"cover_image"`
	Quantity    int    `json:"quantity"`
	RentalFee   int    `json:"rental_fee"`
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

type MarkReturnedRequest struct {
	ReturnedAt      string             `json:"returned_at"`
	DamageFee       int                `json:"damage_fee"`
	OriginalLateFee *int               `json:"original_late_fee"`
	LateFee         int                `json:"late_fee"` // Some forms might need this
	DamagedItems    []DamagedItem      `json:"damaged_items"`
	Payment         *AddPaymentRequest `json:"payment"`
}

type DamagedItem struct {
	CostumeID uint `json:"costume_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

type MarkRentedRequest struct {
	GuaranteeType string             `json:"guarantee_type" binding:"required"`
	Payment       *AddPaymentRequest `json:"payment"`
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
	CreatedAt      string `json:"created_at"`
}

type AddPaymentRequest struct {
	Amount        int    `json:"amount" binding:"required,min=1"`
	PaymentMethod string `json:"payment_method" binding:"required"`
	PaymentProof  string `json:"payment_proof"`
	Notes         string `json:"notes"`
}
