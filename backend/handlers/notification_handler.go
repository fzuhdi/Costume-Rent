package handlers

import (
	"net/http"

	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
}

func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{
		notificationService: services.NewNotificationService(),
	}
}

func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	response, err := h.notificationService.GetNotifications()
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, response)
}

func (h *NotificationHandler) UpdateOverdueStatuses(c *gin.Context) {
	if err := h.notificationService.UpdateOverdueStatus(); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, gin.H{"message": "Overdue statuses updated"})
}
