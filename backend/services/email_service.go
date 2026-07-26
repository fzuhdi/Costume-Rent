package services

import (
	"fmt"
	"net"
	"net/mail"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type EmailService struct {
	now func() time.Time
}

func NewEmailService() *EmailService {
	return &EmailService{now: time.Now}
}

func (s *EmailService) QueueOrderEmail(tx *gorm.DB, orderID uint, template, dedupeSuffix string) error {
	var order models.RentOrder
	if err := tx.Preload("CustomerAccount").First(&order, orderID).Error; err != nil {
		return err
	}
	if order.CustomerAccount == nil || order.CustomerAccount.Email == "" {
		return nil
	}
	subject, body := orderEmailContent(template, order)
	delivery := models.EmailDelivery{
		CustomerAccountID: order.CustomerAccountID,
		RentOrderID:       &order.ID,
		DedupeKey:         fmt.Sprintf("order:%d:%s:%s", order.ID, template, dedupeSuffix),
		Recipient:         order.CustomerAccount.Email,
		Template:          template,
		Subject:           subject,
		Body:              body,
		Status:            "pending",
		NextAttemptAt:     s.now(),
	}
	return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&delivery).Error
}

func (s *EmailService) QueueReminders() error {
	today := businessToday(s.now())
	return config.DB.Transaction(func(tx *gorm.DB) error {
		var pickupOrders []models.RentOrder
		if err := tx.Where("order_source = ? AND status = ? AND date(pickup_date) = date(?)", "online", "booked", today.AddDate(0, 0, 1)).
			Find(&pickupOrders).Error; err != nil {
			return err
		}
		for _, order := range pickupOrders {
			if err := s.QueueOrderEmail(tx, order.ID, "pickup_reminder", order.PickupDate.Format("2006-01-02")); err != nil {
				return err
			}
		}
		var returnOrders []models.RentOrder
		if err := tx.Where("order_source = ? AND status IN ? AND date(expected_return_date) = date(?)", "online", []string{"rented", "overdue"}, today.AddDate(0, 0, 1)).
			Find(&returnOrders).Error; err != nil {
			return err
		}
		for _, order := range returnOrders {
			if err := s.QueueOrderEmail(tx, order.ID, "return_reminder", order.ExpectedReturnDate.Format("2006-01-02")); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *EmailService) DeliverPending() error {
	if os.Getenv("SMTP_HOST") == "" || os.Getenv("SMTP_FROM") == "" {
		return nil
	}
	var deliveries []models.EmailDelivery
	if err := config.DB.Where("status IN ? AND next_attempt_at <= ?", []string{"pending", "retry"}, s.now()).
		Order("id ASC").Limit(20).Find(&deliveries).Error; err != nil {
		return err
	}
	for i := range deliveries {
		err := sendSMTP(deliveries[i])
		now := s.now()
		if err == nil {
			config.DB.Model(&deliveries[i]).Updates(map[string]interface{}{"status": "sent", "sent_at": now, "last_error": ""})
			continue
		}
		attempts := deliveries[i].Attempts + 1
		status := "retry"
		if attempts >= 5 {
			status = "failed"
		}
		backoff := time.Duration(1<<min(attempts, 6)) * time.Minute
		config.DB.Model(&deliveries[i]).Updates(map[string]interface{}{
			"status": status, "attempts": attempts, "last_error": err.Error(), "next_attempt_at": now.Add(backoff),
		})
	}
	return nil
}

func sendSMTP(delivery models.EmailDelivery) error {
	return sendSMTPMessage(delivery.Recipient, delivery.Subject, delivery.Body)
}

func sendSMTPMessage(recipientValue, subjectValue, body string) error {
	recipient, err := mail.ParseAddress(recipientValue)
	if err != nil {
		return err
	}
	from, err := mail.ParseAddress(os.Getenv("SMTP_FROM"))
	if err != nil {
		return err
	}
	host := os.Getenv("SMTP_HOST")
	port := 587
	if configured := os.Getenv("SMTP_PORT"); configured != "" {
		if parsed, err := strconv.Atoi(configured); err == nil {
			port = parsed
		}
	}
	address := net.JoinHostPort(host, strconv.Itoa(port))
	var auth smtp.Auth
	if username := os.Getenv("SMTP_USERNAME"); username != "" {
		auth = smtp.PlainAuth("", username, os.Getenv("SMTP_PASSWORD"), host)
	}
	subject := strings.ReplaceAll(strings.ReplaceAll(subjectValue, "\r", ""), "\n", "")
	message := []byte("From: " + from.String() + "\r\n" +
		"To: " + recipient.String() + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
		body)
	return smtp.SendMail(address, auth, from.Address, []string{recipient.Address}, message)
}

func orderEmailContent(template string, order models.RentOrder) (string, string) {
	reference := fmt.Sprintf("#%d", order.ID)
	switch template {
	case "booking_confirmed":
		return "Pemesanan kostum dikonfirmasi", "Pembayaran downpayment untuk pesanan " + reference + " telah diterima. Kostum Anda sudah dipesan."
	case "payment_failed":
		return "Pembayaran pesanan tidak berhasil", "Pembayaran pesanan " + reference + " gagal atau kedaluwarsa. Stok yang ditahan telah dilepas."
	case "late_refund_started":
		return "Pengembalian dana sedang diproses", "Pembayaran pesanan " + reference + " diterima setelah batas waktu. Pesanan tidak diaktifkan dan dana sedang dikembalikan."
	case "refund_completed":
		return "Pengembalian dana selesai", "Pengembalian dana untuk pesanan " + reference + " telah dikonfirmasi."
	case "booking_cancelled":
		return "Pemesanan dibatalkan", "Pesanan " + reference + " telah dibatalkan. Sesuai persetujuan Anda, downpayment tidak dikembalikan."
	case "pickup_reminder":
		return "Pengingat pengambilan kostum", "Pengambilan pesanan " + reference + " dijadwalkan pada " + order.PickupDate.Format("02-01-2006") + "."
	case "return_reminder":
		return "Pengingat pengembalian kostum", "Pengembalian pesanan " + reference + " diharapkan pada " + order.ExpectedReturnDate.Format("02-01-2006") + "."
	default:
		return "Pembaruan pesanan kostum", "Ada pembaruan untuk pesanan " + reference + "."
	}
}
