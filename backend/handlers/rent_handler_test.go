package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
	"github.com/gin-gonic/gin"
)

func setupTestDB() {
	os.Setenv("DB_PATH", ":memory:")
	config.InitDB()
	
	// Migrate schema
	config.DB.AutoMigrate(
		&models.User{},
		&models.Client{},
		&models.Category{},
		&models.Costume{},
		&models.RentOrder{},
		&models.RentOrderItem{},
		&models.RentTransaction{},
		&models.ActivityLog{},
	)
}

func TestAddPayment(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB()

	// Seed user
	user := models.User{Name: "testuser", Email: "test@test.com", Password: "abc", Role: "admin"}
	config.DB.Create(&user)

	// Seed client
	client := models.Client{Name: "John Doe", Phone: "123", Address: "123 St"}
	config.DB.Create(&client)

	// Seed costume
	costume := models.Costume{Name: "Baju Adat", RentalFee: 100000}
	config.DB.Create(&costume)

	// Seed Rent Order (TotalTagihan = 200000, TotalPaid = 50000)
	order := models.RentOrder{
		ClientID: client.ID,
		EventDate: time.Now(),
		TotalPaid: 50000,
		PaymentStatus: "DP",
		CreatedBy: user.ID,
	}
	config.DB.Create(&order)

	orderItem := models.RentOrderItem{
		RentOrderID: order.ID,
		CostumeID: costume.ID,
		Quantity: 2,
		RentalFee: 100000,
	}
	config.DB.Create(&orderItem)

	// Setup Router
	r := gin.Default()
	
	// Mock middleware to set user ID
	r.Use(func(c *gin.Context) {
		c.Set("user_id", user.ID)
		c.Next()
	})

	rentHandler := NewRentHandler()

	r.POST("/api/rents/:id/payments", rentHandler.AddPayment)

	// Test Case 1: Add partial payment
	reqPayload := dto.AddPaymentRequest{
		Amount:        50000,
		PaymentMethod: "TRANSFER",
		Notes:         "Cicilan",
	}
	jsonBody, _ := json.Marshal(reqPayload)

	req, _ := http.NewRequest(http.MethodPost, "/api/rents/"+strconv.Itoa(int(order.ID))+"/payments", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Verify Database Updates
	var updatedOrder models.RentOrder
	config.DB.Preload("Transactions").First(&updatedOrder, order.ID)

	if updatedOrder.TotalPaid != 100000 {
		t.Errorf("Expected TotalPaid to be 100000, got %d", updatedOrder.TotalPaid)
	}

	if updatedOrder.PaymentStatus != "DP" {
		t.Errorf("Expected PaymentStatus to be DP, got %s", updatedOrder.PaymentStatus)
	}

	if len(updatedOrder.Transactions) != 1 {
		t.Fatalf("Expected 1 transaction, got %d", len(updatedOrder.Transactions))
	}

	tx := updatedOrder.Transactions[0]
	if tx.Amount != 50000 || tx.PaymentMethod != "TRANSFER" || tx.Notes != "Cicilan" {
		t.Errorf("Transaction data mismatch: %+v", tx)
	}

	// Test Case 2: Settle remaining balance
	reqPayload2 := dto.AddPaymentRequest{
		Amount:        100000,
		PaymentMethod: "CASH",
		Notes:         "Pelunasan",
	}
	jsonBody2, _ := json.Marshal(reqPayload2)

	req2, _ := http.NewRequest(http.MethodPost, "/api/rents/"+strconv.Itoa(int(order.ID))+"/payments", bytes.NewBuffer(jsonBody2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()

	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", w2.Code)
	}

	// Verify Database Updates for full settlement
	config.DB.Preload("Transactions").First(&updatedOrder, order.ID)

	if updatedOrder.TotalPaid != 200000 {
		t.Errorf("Expected TotalPaid to be 200000, got %d", updatedOrder.TotalPaid)
	}

	if updatedOrder.PaymentStatus != "LUNAS" {
		t.Errorf("Expected PaymentStatus to be LUNAS, got %s", updatedOrder.PaymentStatus)
	}
}

func TestMarkBooked(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB()

	user := models.User{Name: "testuser", Email: "test2@test.com", Password: "abc", Role: "admin"}
	config.DB.Create(&user)

	client := models.Client{Name: "Jane Doe", Phone: "123"}
	config.DB.Create(&client)

	costume := models.Costume{Name: "Baju Jawa", RentalFee: 100000, Quantity: 5}
	config.DB.Create(&costume)

	order := models.RentOrder{
		ClientID: client.ID,
		EventDate: time.Now().AddDate(0, 0, 3),
		Status: "draft",
		CreatedBy: user.ID,
	}
	config.DB.Create(&order)

	orderItem := models.RentOrderItem{
		RentOrderID: order.ID,
		CostumeID: costume.ID,
		Quantity: 1,
		RentalFee: 100000,
	}
	config.DB.Create(&orderItem)

	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", user.ID)
		c.Next()
	})

	rentHandler := NewRentHandler()
	r.PUT("/api/rents/:id/booked", rentHandler.MarkBooked)

	paymentPayload := dto.AddPaymentRequest{
		Amount: 50000,
		PaymentMethod: "CASH",
		Notes: "DP Booking",
	}

	reqPayload := dto.UpgradeToBookedRequest{
		Payment: &paymentPayload,
	}

	jsonBody, _ := json.Marshal(reqPayload)
	req, _ := http.NewRequest(http.MethodPut, "/api/rents/"+strconv.Itoa(int(order.ID))+"/booked", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var updatedOrder models.RentOrder
	config.DB.Preload("Transactions").First(&updatedOrder, order.ID)

	if updatedOrder.Status != "booked" {
		t.Errorf("Expected Status to be booked, got %s", updatedOrder.Status)
	}

	if updatedOrder.TotalPaid != 50000 {
		t.Errorf("Expected TotalPaid to be 50000, got %d", updatedOrder.TotalPaid)
	}

	if len(updatedOrder.Transactions) != 1 {
		t.Fatalf("Expected 1 transaction, got %d", len(updatedOrder.Transactions))
	}
}
