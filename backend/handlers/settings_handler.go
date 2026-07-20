package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	settingsService *services.SettingsService
}

func NewSettingsHandler() *SettingsHandler {
	return &SettingsHandler{
		settingsService: services.NewSettingsService(),
	}
}

func (h *SettingsHandler) GetAll(c *gin.Context) {
	settings, err := h.settingsService.GetAll()
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, settings)
}

func (h *SettingsHandler) Update(c *gin.Context) {
	var settings map[string]string
	if err := c.ShouldBindJSON(&settings); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	if err := h.settingsService.BulkUpdate(settings); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	updated, _ := h.settingsService.GetAll()
	utils.RespondSuccess(c, updated)
}

func (h *SettingsHandler) UploadLogo(c *gin.Context) {
	file, err := c.FormFile("logo")
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
	filename := fmt.Sprintf("logo_%d%s", time.Now().UnixNano(), ext)
	filepath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	logoPath := "/uploads/" + filename
	if err := h.settingsService.SetLogo(logoPath); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, gin.H{"path": logoPath})
}
