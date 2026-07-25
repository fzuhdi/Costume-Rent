package services

import "github.com/busana/backend/models"

type PaymentLedger struct {
	transactions []models.RentTransaction
}

func NewPaymentLedger(transactions []models.RentTransaction) *PaymentLedger {
	return &PaymentLedger{
		transactions: transactions,
	}
}

// TotalDebits returns the sum of all DEBIT transactions
func (pl *PaymentLedger) TotalDebits() int {
	total := 0
	for _, t := range pl.transactions {
		if t.Type == "DEBIT" {
			total += t.Amount
		}
	}
	return total
}

// TotalCredits returns the sum of all CREDIT transactions
func (pl *PaymentLedger) TotalCredits() int {
	total := 0
	for _, t := range pl.transactions {
		if t.Type == "CREDIT" {
			total += t.Amount
		}
	}
	return total
}

// Balance returns the remaining balance to be paid (TotalDebits - TotalCredits)
func (pl *PaymentLedger) Balance() int {
	balance := pl.TotalDebits() - pl.TotalCredits()
	if balance < 0 {
		return 0 // Overpaid
	}
	return balance
}

// IsFullyPaid returns true if the total credits cover the total debits
func (pl *PaymentLedger) IsFullyPaid() bool {
	return pl.TotalCredits() >= pl.TotalDebits()
}

// PaymentStatus returns the current payment status
func (pl *PaymentLedger) PaymentStatus() string {
	credits := pl.TotalCredits()
	debits := pl.TotalDebits()

	if credits >= debits && debits > 0 {
		return "LUNAS"
	} else if credits > 0 {
		return "DP"
	}

	if len(pl.transactions) == 0 {
		return ""
	}

	return "BELUM_BAYAR"
}
