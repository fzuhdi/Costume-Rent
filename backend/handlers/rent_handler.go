package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/busana/backend/dto"
	"github.com/busana/backend/middleware"
	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RentHandler struct {
	rentService *services.RentService
}

func NewRentHandler() *RentHandler {
	return &RentHandler{
		rentService: services.NewRentService(),
	}
}

func (h *RentHandler) List(c *gin.Context) {
	var filter dto.RentOrderFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	response, err := h.rentService.List(filter)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, response)
}

func (h *RentHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	order, err := h.rentService.GetByID(uint(id))
	if err != nil {
		utils.RespondFailed(c, http.StatusNotFound, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) Create(c *gin.Context) {
	var req dto.CreateRentOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	if len(req.Items) == 0 {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	userID := middleware.GetUserID(c)

	order, err := h.rentService.Create(req, userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusCreated, order)
}

func (h *RentHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.UpdateRentOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.Update(uint(id), req, userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) MarkReturned(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.MarkReturnedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.MarkReturned(uint(id), req, userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) ReceiveOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.ReceiveOrder(uint(id), userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) MarkRented(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.MarkRentedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.MarkRented(uint(id), req, userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) RollbackOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.RollbackStatus(uint(id), userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) MarkBooked(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.UpgradeToBookedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.MarkBooked(uint(id), req, userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) UploadPaymentProof(c *gin.Context) {
	file, err := c.FormFile("payment_proof")
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	if err := os.MkdirAll(uploadDir, 0750); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("proof_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	utils.RespondSuccess(c, gin.H{"payment_proof": "/uploads/" + filename})
}

func (h *RentHandler) ExtendRent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.ExtendRentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.ExtendRent(uint(id), req, userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) AddPayment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.AddPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.AddPayment(uint(id), req, userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) CancelOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	userID := middleware.GetUserID(c)
	order, err := h.rentService.CancelOrder(uint(id), userID)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, order)
}

func (h *RentHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	if err := h.rentService.Delete(uint(id)); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, gin.H{"message": "Rent order deleted successfully"})
}
