package handlers

import (
	"net/http"
	"os"

	"github.com/busana/backend/dto"
	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(),
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	response, err := h.authService.Login(req)
	if err != nil {
		utils.RespondFailed(c, http.StatusUnauthorized, utils.NewAppError("ERR_INVALID_CREDENTIALS"))
		return
	}

	isProduction := os.Getenv("ENV") == "production" || os.Getenv("GIN_MODE") == "release"

	// Set HTTP-only cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("token", response.Token, 3600*24, "/", "", isProduction, true)

	// Keep returning token in JSON for backwards compatibility or mobile clients, but web will use cookie
	utils.RespondSuccess(c, response)
}

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		utils.RespondFailed(c, http.StatusUnauthorized, utils.NewAppError("ERR_USER_NOT_FOUND"))
		return
	}

	var id uint
	switch v := userId.(type) {
	case float64:
		id = uint(v)
	case uint:
		id = v
	}

	user, err := h.authService.GetUserByID(id)
	if err != nil {
		utils.RespondFailed(c, http.StatusNotFound, utils.NewAppError("ERR_USER_NOT_FOUND"))
		return
	}

	utils.RespondSuccess(c, gin.H{
		"id":       user.ID,
		"name":     user.Name,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear the HTTP-only cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("token", "", -1, "/", "", false, true)
	utils.RespondSuccess(c, gin.H{"message": "Logged out successfully"})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	if req.Role == "" {
		req.Role = "admin"
	}

	user, err := h.authService.CreateUser(dto.CreateUserRequest(req))

	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_USER_EXISTS"))
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"name":     user.Name,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
	})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		utils.RespondFailed(c, http.StatusUnauthorized, utils.NewAppError("ERR_USER_NOT_FOUND"))
		return
	}

	var id uint
	switch v := userId.(type) {
	case float64:
		id = uint(v)
	case uint:
		id = v
	default:
		utils.RespondFailed(c, http.StatusInternalServerError, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	if err := h.authService.ChangePassword(id, req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	utils.RespondSuccess(c, gin.H{"message": "Password berhasil diubah"})
}
