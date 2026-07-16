package handlers

import (
	"net/http"

	"github.com/busana/backend/services"
	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	statsService *services.StatsService
}

func NewStatsHandler() *StatsHandler {
	return &StatsHandler{
		statsService: services.NewStatsService(),
	}
}

func (h *StatsHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.statsService.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dashboard statistics", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *StatsHandler) GetRevenueChart(c *gin.Context) {
	filter := c.Query("filter")
	if filter == "" {
		filter = "daily"
	}

	chart, err := h.statsService.GetRevenueChart(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revenue chart", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": chart})
}
