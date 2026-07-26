package handlers

import (
	"net/http"

	"github.com/busana/backend/dto"
	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
)

type CustomerAuthHandler struct {
	service *services.CustomerAuthService
}

func NewCustomerAuthHandler() *CustomerAuthHandler {
	return &CustomerAuthHandler{service: services.NewCustomerAuthService()}
}

func (h *CustomerAuthHandler) Register(c *gin.Context) {
	var request dto.RegisterCustomerRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondFailed(c, http.StatusUnprocessableEntity, utils.NewAppError("ERR_INVALID_CUSTOMER_REGISTRATION"))
		return
	}
	response, err := h.service.Register(request)
	if err != nil {
		respondMarketplaceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": response})
}

func (h *CustomerAuthHandler) Login(c *gin.Context) {
	var request dto.CustomerLoginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondFailed(c, http.StatusUnauthorized, utils.NewAppError("ERR_INVALID_CUSTOMER_CREDENTIALS"))
		return
	}
	response, err := h.service.Login(request)
	if err != nil {
		utils.RespondFailed(c, http.StatusUnauthorized, err)
		return
	}
	utils.RespondSuccess(c, response)
}

func (h *CustomerAuthHandler) VerifyEmail(c *gin.Context) {
	var request dto.CustomerTokenRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondFailed(c, http.StatusUnprocessableEntity, utils.NewAppError("ERR_CUSTOMER_TOKEN_INVALID"))
		return
	}
	if err := h.service.VerifyEmail(request.Token); err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, gin.H{"email_verified": true})
}

func (h *CustomerAuthHandler) ForgotPassword(c *gin.Context) {
	var request dto.CustomerEmailRequest
	if err := c.ShouldBindJSON(&request); err == nil {
		h.service.RequestPasswordReset(request.Email)
	}
	utils.RespondSuccess(c, gin.H{"message": "Jika akun ditemukan, instruksi akan dikirim."})
}

func (h *CustomerAuthHandler) ResetPassword(c *gin.Context) {
	var request dto.CustomerPasswordResetRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		utils.RespondFailed(c, http.StatusUnprocessableEntity, utils.NewAppError("ERR_INVALID_PASSWORD"))
		return
	}
	if err := h.service.ResetPassword(request.Token, request.NewPassword); err != nil {
		respondMarketplaceError(c, err)
		return
	}
	utils.RespondSuccess(c, gin.H{"password_reset": true})
}

func (h *CustomerAuthHandler) ResendVerification(c *gin.Context) {
	var request dto.CustomerEmailRequest
	if err := c.ShouldBindJSON(&request); err == nil {
		h.service.ResendVerification(request.Email)
	}
	utils.RespondSuccess(c, gin.H{"message": "Jika akun ditemukan, instruksi akan dikirim."})
}
