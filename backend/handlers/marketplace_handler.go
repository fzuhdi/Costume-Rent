package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/busana/backend/dto"
	"github.com/busana/backend/middleware"
	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MarketplaceHandler struct {
	service *services.MarketplaceService
}

func NewMarketplaceHandler() *MarketplaceHandler {
	return &MarketplaceHandler{service: services.NewMarketplaceService()}
}

func (h *MarketplaceHandler) ListCostumes(c *gin.Context) {
	var filter dto.MarketplaceCostumeFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}
	response, err := h.service.ListCostumes(filter)
	if err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, response)
}

func (h *MarketplaceHandler) GetCostume(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	response, err := h.service.GetCostume(id, c.Query("event_date"))
	if err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, response)
}

func (h *MarketplaceHandler) CreateCheckout(c *gin.Context) {
	var request dto.CreateMarketplaceCheckoutRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondFailed(c, http.StatusUnprocessableEntity, utils.NewAppError("ERR_INVALID_CHECKOUT"))
		return
	}
	response, replay, err := h.service.CreateCheckout(
		c.Request.Context(),
		middleware.GetCustomerAccountID(c),
		c.GetHeader("Idempotency-Key"),
		request,
	)
	if err != nil {
		respondMarketplaceError(c, err)
		return
	}
	if replay {
		c.Header("Idempotent-Replayed", "true")
		utils.RespondSuccess(c, response)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": response})
}

func (h *MarketplaceHandler) GetCheckout(c *gin.Context) {
	h.getOwnedOrder(c)
}

func (h *MarketplaceHandler) GetOrder(c *gin.Context) {
	h.getOwnedOrder(c)
}

func (h *MarketplaceHandler) getOwnedOrder(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	response, err := h.service.GetOwnedOrder(id, middleware.GetCustomerAccountID(c))
	if err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, response)
}

func (h *MarketplaceHandler) AbandonCheckout(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	if err := h.service.AbandonCheckout(c.Request.Context(), id, middleware.GetCustomerAccountID(c)); err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, gin.H{"status": "cancelled"})
}

func (h *MarketplaceHandler) ListOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	response, err := h.service.ListOrders(middleware.GetCustomerAccountID(c), page, limit)
	if err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, response)
}

func (h *MarketplaceHandler) CancelOrder(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	response, err := h.service.CancelOrder(id, middleware.GetCustomerAccountID(c))
	if err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, response)
}

func (h *MarketplaceHandler) MidtransWebhook(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64<<10)
	raw, err := io.ReadAll(c.Request.Body)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_PAYMENT_NOTIFICATION"))
		return
	}
	var notification services.GatewayNotification
	if err := json.Unmarshal(raw, &notification); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_PAYMENT_NOTIFICATION"))
		return
	}
	if err := h.service.ProcessNotification(c.Request.Context(), notification, raw); err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, gin.H{"status": "accepted"})
}

func (h *MarketplaceHandler) UpdateDelivery(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	var request dto.UpdateDeliveryRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondFailed(c, http.StatusUnprocessableEntity, utils.NewAppError("ERR_INVALID_DELIVERY_STATE"))
		return
	}
	if err := h.service.UpdateDelivery(id, middleware.GetUserID(c), request.Status); err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, gin.H{"delivery_request_status": request.Status})
}

func (h *MarketplaceHandler) CreateRefund(c *gin.Context) {
	if middleware.GetUserRole(c) != "admin" {
		utils.RespondFailed(c, http.StatusForbidden, utils.NewAppError("ERR_ADMIN_REQUIRED"))
		return
	}
	id, err := parseID(c.Param("id"))
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	var request dto.CreateRefundRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondFailed(c, http.StatusUnprocessableEntity, utils.NewAppError("ERR_INVALID_REFUND"))
		return
	}
	if err := h.service.CreateExceptionalRefund(c.Request.Context(), id, middleware.GetUserID(c), request); err != nil {
		respondMarketplaceError(c, err)
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"success": true, "data": gin.H{"status": "refund_pending"}})
}

func (h *MarketplaceHandler) ReconcilePayment(c *gin.Context) {
	if middleware.GetUserRole(c) != "admin" {
		utils.RespondFailed(c, http.StatusForbidden, utils.NewAppError("ERR_ADMIN_REQUIRED"))
		return
	}
	id, err := parseID(c.Param("id"))
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	if err := h.service.ReconcilePayment(c.Request.Context(), id); err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, gin.H{"status": "reconciled"})
}

func parseID(value string) (uint, error) {
	id, err := strconv.ParseUint(value, 10, 32)
	return uint(id), err
}

func respondMarketplaceError(c *gin.Context, err error) {
	status := http.StatusInternalServerError
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		status = http.StatusNotFound
	case services.IsConflictError(err):
		status = http.StatusConflict
	case services.IsValidationError(err):
		status = http.StatusUnprocessableEntity
	default:
		var appErr *utils.AppError
		if errors.As(err, &appErr) {
			if appErr.Code == "ERR_INVALID_PAYMENT_SIGNATURE" {
				status = http.StatusUnauthorized
			} else {
				status = http.StatusBadRequest
			}
		}
	}
	utils.RespondFailed(c, status, err)
}
