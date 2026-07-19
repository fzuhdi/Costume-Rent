package handlers

import (
	"net/http"
	"strconv"

	"github.com/busana/backend/dto"
	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	authService *services.AuthService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		authService: services.NewAuthService(),
	}
}

func (h *UserHandler) List(c *gin.Context) {
	users, err := h.authService.GetUsers()
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	var response []dto.UserResponse
	for _, u := range users {
		response = append(response, dto.UserResponse{
			ID:       u.ID,
			Name:     u.Name,
			Username: u.Username,
			Email:    u.Email,
			Role:     u.Role,
		})
	}

	utils.RespondSuccess(c, response)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	user, err := h.authService.GetUserByID(uint(id))
	if err != nil {
		utils.RespondFailed(c, http.StatusNotFound, utils.NewAppError("ERR_USER_NOT_FOUND"))
		return
	}

	utils.RespondSuccess(c, dto.UserResponse{
		ID:       user.ID,
		Name:     user.Name,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
	})
}

func (h *UserHandler) Create(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	user, err := h.authService.CreateUser(req)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_USER_EXISTS"))
		return
	}

	c.JSON(http.StatusCreated, dto.UserResponse{
		ID:       user.ID,
		Name:     user.Name,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
	})
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	user, err := h.authService.UpdateUser(uint(id), req)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, dto.UserResponse{
		ID:       user.ID,
		Name:     user.Name,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
	})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	if err := h.authService.DeleteUser(uint(id)); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, gin.H{"message": "User deleted successfully"})
}
