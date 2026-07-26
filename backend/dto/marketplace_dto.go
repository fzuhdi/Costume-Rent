package dto

type MarketplaceCostumeFilter struct {
	Search     string `form:"search"`
	RegionID   string `form:"region_id"`
	CategoryID string `form:"category_id"`
	Size       string `form:"size"`
	EventDate  string `form:"event_date"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}

type MarketplaceCostumeResponse struct {
	ID          uint                   `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	RegionID    *uint                  `json:"region_id"`
	Region      string                 `json:"region"`
	CategoryID  *uint                  `json:"category_id"`
	Category    string                 `json:"category"`
	Size        string                 `json:"size"`
	RentalFee   int                    `json:"rental_fee"`
	CoverImage  string                 `json:"cover_image"`
	Images      []CostumeImageResponse `json:"images,omitempty"`
	Available   bool                   `json:"available"`
	MaxQuantity int                    `json:"max_quantity"`
}

type MarketplaceCheckoutItemRequest struct {
	CostumeID uint `json:"costume_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1,max=2"`
	RentalFee int  `json:"rental_fee" binding:"required,min=0"`
}

type CreateMarketplaceCheckoutRequest struct {
	EventDate       string                           `json:"event_date" binding:"required"`
	Name            string                           `json:"name" binding:"required,max=120"`
	Phone           string                           `json:"phone" binding:"required,max=40"`
	FulfillmentType string                           `json:"fulfillment_type" binding:"required,oneof=pickup delivery_request"`
	ShippingAddress string                           `json:"shipping_address" binding:"max=500"`
	TermsVersion    string                           `json:"terms_version" binding:"required,max=80"`
	TermsAccepted   bool                             `json:"terms_accepted" binding:"required"`
	Items           []MarketplaceCheckoutItemRequest `json:"items" binding:"required,min=1,dive"`
}

type PaymentAttemptResponse struct {
	ID              uint    `json:"id"`
	Status          string  `json:"status"`
	RequestedAmount int     `json:"requested_amount"`
	PaymentType     string  `json:"payment_type,omitempty"`
	RedirectURL     string  `json:"redirect_url,omitempty"`
	ExpiresAt       string  `json:"expires_at"`
	PaidAt          *string `json:"paid_at,omitempty"`
	RefundedAt      *string `json:"refunded_at,omitempty"`
	FailureReason   string  `json:"failure_reason,omitempty"`
}

type MarketplaceOrderItemResponse struct {
	CostumeID  uint   `json:"costume_id"`
	Name       string `json:"name"`
	Size       string `json:"size"`
	CoverImage string `json:"cover_image"`
	Quantity   int    `json:"quantity"`
	RentalFee  int    `json:"rental_fee"`
	LineTotal  int    `json:"line_total"`
}

type MarketplaceOrderResponse struct {
	ID                    uint                           `json:"id"`
	Status                string                         `json:"status"`
	OrderSource           string                         `json:"order_source"`
	EventDate             string                         `json:"event_date"`
	PickupDate            string                         `json:"pickup_date"`
	ExpectedReturnDate    string                         `json:"expected_return_date"`
	ExpiresAt             *string                        `json:"expires_at,omitempty"`
	FulfillmentType       string                         `json:"fulfillment_type"`
	DeliveryRequestStatus string                         `json:"delivery_request_status"`
	ShippingAddress       string                         `json:"shipping_address,omitempty"`
	TermsVersion          string                         `json:"terms_version"`
	TotalRentalFee        int                            `json:"total_rental_fee"`
	DownpaymentAmount     int                            `json:"downpayment_amount"`
	PaymentSummary        PaymentSummary                 `json:"payment_summary"`
	PaymentAttempt        *PaymentAttemptResponse        `json:"payment_attempt,omitempty"`
	Items                 []MarketplaceOrderItemResponse `json:"items"`
	CreatedAt             string                         `json:"created_at"`
}

type MarketplaceOrderListResponse struct {
	Data       []MarketplaceOrderResponse `json:"data"`
	Total      int64                      `json:"total"`
	Page       int                        `json:"page"`
	Limit      int                        `json:"limit"`
	TotalPages int                        `json:"total_pages"`
}

type UpdateDeliveryRequest struct {
	Status string `json:"status" binding:"required,oneof=confirmed declined"`
}

type CreateRefundRequest struct {
	Amount         int    `json:"amount" binding:"required,min=1"`
	Reason         string `json:"reason" binding:"required,max=500"`
	IdempotencyKey string `json:"idempotency_key" binding:"required,max=120"`
}

type RegisterCustomerRequest struct {
	Name     string `json:"name" binding:"required,max=120"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Phone    string `json:"phone" binding:"required,max=40"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

type CustomerLoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required,max=72"`
}

type CustomerTokenRequest struct {
	Token string `json:"token" binding:"required,max=200"`
}

type CustomerPasswordResetRequest struct {
	Token       string `json:"token" binding:"required,max=200"`
	NewPassword string `json:"new_password" binding:"required,min=8,max=72"`
}

type CustomerEmailRequest struct {
	Email string `json:"email" binding:"required,email,max=254"`
}

type CustomerIdentityResponse struct {
	ID            uint   `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Phone         string `json:"phone"`
	EmailVerified bool   `json:"email_verified"`
}
