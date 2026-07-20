package models

type RentTransaction struct {
	BaseModel
	RentOrderID    uint   `json:"rent_order_id" gorm:"not null;index"`
	Type           string `json:"type" gorm:"not null"`     // DEBIT or CREDIT
	Category       string `json:"category" gorm:"not null"` // PAYMENT, DAMAGE_FEE, LATE_FEE, EXTENSION_FEE, EARLY_TAKEAWAY_FEE, REFUND
	Amount         int    `json:"amount" gorm:"not null"`
	OriginalAmount int    `json:"original_amount" gorm:"default:0"`
	PaymentMethod  string `json:"payment_method"`
	PaymentProof   string `json:"payment_proof"`
	Notes          string `json:"notes"`
	IsVoided       bool   `json:"is_voided" gorm:"default:false"`
	CreatedBy      uint   `json:"created_by"`
	Creator        User   `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
}
