package handlers

import (
	"net/http"
	"strconv"

	"github.com/busana/backend/dto"
	"github.com/busana/backend/services"
	"github.com/gin-gonic/gin"
)

type ClientHandler struct {
	clientService *services.ClientService
}

func NewClientHandler() *ClientHandler {
	return &ClientHandler{
		clientService: services.NewClientService(),
	}
}

func (h *ClientHandler) List(c *gin.Context) {
	var filter dto.ClientFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.clientService.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *ClientHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	client, err := h.clientService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	// Build response with rent_history
	type RentOrderSimple struct {
		ID                 uint   `json:"id"`
		Status             string `json:"status"`
		EventDate          string `json:"event_date"`
		PickupDate         string `json:"pickup_date"`
		ExpectedReturnDate string `json:"expected_return_date"`
	}

	type ClientDetailResponse struct {
		ID         uint              `json:"id"`
		Name       string            `json:"name"`
		Phone      string            `json:"phone"`
		Address    string            `json:"address"`
		CreatedAt  string            `json:"created_at"`
		RentOrders []RentOrderSimple `json:"rent_orders"`
	}

	rentHistory := make([]RentOrderSimple, 0)
	for _, order := range client.RentOrders {
		if order.DeletedAt.Valid {
			continue
		}
		rentHistory = append(rentHistory, RentOrderSimple{
			ID:                 order.ID,
			Status:             order.Status,
			EventDate:          order.EventDate.Format("2006-01-02"),
			PickupDate:         order.PickupDate.Format("2006-01-02"),
			ExpectedReturnDate: order.ExpectedReturnDate.Format("2006-01-02"),
		})
	}

	response := ClientDetailResponse{
		ID:         client.ID,
		Name:       client.Name,
		Phone:      client.Phone,
		Address:    client.Address,
		CreatedAt:  client.CreatedAt.Format("2006-01-02"),
		RentOrders: rentHistory,
	}
	c.JSON(http.StatusOK, response)
}

func (h *ClientHandler) Search(c *gin.Context) {
	query := c.Query("search")
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	clients, err := h.clientService.Search(query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, clients)
}

func (h *ClientHandler) Create(c *gin.Context) {
	var req dto.CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.clientService.Create(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ClientResponse{
		ID:        client.ID,
		Name:      client.Name,
		Phone:     client.Phone,
		Address:   client.Address,
		CreatedAt: client.CreatedAt.Format("2006-01-02"),
	}
	c.JSON(http.StatusCreated, response)
}

func (h *ClientHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req dto.UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.clientService.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, client)
}

func (h *ClientHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.clientService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client deleted successfully"})
}

func (h *ClientHandler) GetRentHistory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	orders, err := h.clientService.GetRentHistory(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}
