package handlers

import (
	"net/http"

	"github.com/busana/backend/services"
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *NotificationHandler) UpdateOverdueStatuses(c *gin.Context) {
	if err := h.notificationService.UpdateOverdueStatus(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Overdue statuses updated"})
}