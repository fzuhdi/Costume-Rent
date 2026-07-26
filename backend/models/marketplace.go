package models

import "time"

type CustomerAccount struct {
	BaseModel
	ClientID        uint       `json:"client_id" gorm:"not null;uniqueIndex"`
	Client          Client     `json:"client,omitempty" gorm:"foreignKey:ClientID"`
	Email           string     `json:"email" gorm:"not null;uniqueIndex"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	PasswordHash    string     `json:"-"`
	GoogleSubject   *string    `json:"-" gorm:"uniqueIndex"`
	Status          string     `json:"status" gorm:"not null;default:'active'"`
	LastLoginAt     *time.Time `json:"last_login_at"`
}

type CustomerAuthToken struct {
	BaseModel
	CustomerAccountID uint            `json:"customer_account_id" gorm:"not null;index"`
	CustomerAccount   CustomerAccount `json:"-" gorm:"foreignKey:CustomerAccountID"`
	Purpose           string          `json:"purpose" gorm:"not null;index"`
	TokenHash         string          `json:"-" gorm:"not null;uniqueIndex"`
	ExpiresAt         time.Time       `json:"expires_at" gorm:"not null;index"`
	ConsumedAt        *time.Time      `json:"consumed_at"`
}

type PaymentAttempt struct {
	BaseModel
	RentOrderID           uint           `json:"rent_order_id" gorm:"not null;index"`
	RentOrder             RentOrder      `json:"-" gorm:"foreignKey:RentOrderID"`
	Provider              string         `json:"provider" gorm:"not null;default:'midtrans'"`
	ProviderOrderID       string         `json:"provider_order_id" gorm:"not null;uniqueIndex"`
	ProviderTransactionID string         `json:"provider_transaction_id"`
	IdempotencyKey        string         `json:"-" gorm:"not null;uniqueIndex"`
	RequestedAmount       int            `json:"requested_amount" gorm:"not null"`
	Status                string         `json:"status" gorm:"not null;index"`
	PaymentType           string         `json:"payment_type"`
	RedirectURL           string         `json:"redirect_url"`
	ExpiresAt             time.Time      `json:"expires_at" gorm:"not null;index"`
	PaidAt                *time.Time     `json:"paid_at"`
	RefundedAt            *time.Time     `json:"refunded_at"`
	FailureReason         string         `json:"failure_reason"`
	Events                []PaymentEvent `json:"-" gorm:"foreignKey:PaymentAttemptID"`
}

type PaymentEvent struct {
	BaseModel
	PaymentAttemptID uint           `json:"payment_attempt_id" gorm:"not null;index"`
	PaymentAttempt   PaymentAttempt `json:"-" gorm:"foreignKey:PaymentAttemptID"`
	DedupeKey        string         `json:"dedupe_key" gorm:"not null;uniqueIndex"`
	PayloadHash      string         `json:"payload_hash" gorm:"not null"`
	ProcessingResult string         `json:"processing_result" gorm:"not null"`
	ReceivedAt       time.Time      `json:"received_at" gorm:"not null"`
	ProcessedAt      *time.Time     `json:"processed_at"`
}

type RefundOperation struct {
	BaseModel
	PaymentAttemptID uint           `json:"payment_attempt_id" gorm:"not null;index"`
	PaymentAttempt   PaymentAttempt `json:"-" gorm:"foreignKey:PaymentAttemptID"`
	OperationID      string         `json:"operation_id" gorm:"not null;uniqueIndex"`
	Amount           int            `json:"amount" gorm:"not null"`
	Reason           string         `json:"reason" gorm:"not null"`
	Status           string         `json:"status" gorm:"not null;index"`
	RetryCount       int            `json:"retry_count" gorm:"not null;default:0"`
	ProviderResponse string         `json:"-"`
	RequestedBy      uint           `json:"requested_by"`
}

type MarketplaceAuditLog struct {
	BaseModel
	RentOrderID       *uint  `json:"rent_order_id" gorm:"index"`
	CustomerAccountID *uint  `json:"customer_account_id" gorm:"index"`
	UserID            *uint  `json:"user_id" gorm:"index"`
	Action            string `json:"action" gorm:"not null;index"`
	Details           string `json:"details"`
}

type EmailDelivery struct {
	BaseModel
	CustomerAccountID *uint      `json:"customer_account_id" gorm:"index"`
	RentOrderID       *uint      `json:"rent_order_id" gorm:"index"`
	DedupeKey         string     `json:"dedupe_key" gorm:"not null;uniqueIndex"`
	Recipient         string     `json:"recipient" gorm:"not null"`
	Template          string     `json:"template" gorm:"not null;index"`
	Subject           string     `json:"subject" gorm:"not null"`
	Body              string     `json:"-"`
	Status            string     `json:"status" gorm:"not null;default:'pending';index"`
	Attempts          int        `json:"attempts" gorm:"not null;default:0"`
	NextAttemptAt     time.Time  `json:"next_attempt_at" gorm:"index"`
	LastError         string     `json:"last_error"`
	SentAt            *time.Time `json:"sent_at"`
}
