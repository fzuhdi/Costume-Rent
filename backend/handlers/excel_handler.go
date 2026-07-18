package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/busana/backend/services"
	"github.com/gin-gonic/gin"
)

type ExcelHandler struct {
	excelService *services.ExcelService
}

func NewExcelHandler() *ExcelHandler {
	return &ExcelHandler{
		excelService: services.NewExcelService(),
	}
}

// Clients

func (h *ExcelHandler) ExportClients(c *gin.Context) {
	buf, err := h.excelService.ExportClients()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate Excel file: " + err.Error()})
		return
	}

	filename := fmt.Sprintf("clients_export_%s.xlsx", time.Now().Format("20060102"))
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *ExcelHandler) ImportClients(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file: " + err.Error()})
		return
	}
	defer func() {
		_ = f.Close()
	}()

	if err := h.excelService.ImportClients(f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Import failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Clients imported successfully"})
}

func (h *ExcelHandler) DownloadClientTemplate(c *gin.Context) {
	buf, err := h.excelService.GetClientTemplate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate template: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="clients_template.xlsx"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// Costumes (Catalogue)

func (h *ExcelHandler) ExportCostumes(c *gin.Context) {
	buf, err := h.excelService.ExportCostumes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate Excel file: " + err.Error()})
		return
	}

	filename := fmt.Sprintf("catalogue_export_%s.xlsx", time.Now().Format("20060102"))
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *ExcelHandler) ImportCostumes(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file: " + err.Error()})
		return
	}
	defer func() {
		_ = f.Close()
	}()

	if err := h.excelService.ImportCostumes(f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Import failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Catalogue imported successfully"})
}

func (h *ExcelHandler) DownloadCostumeTemplate(c *gin.Context) {
	buf, err := h.excelService.GetCostumeTemplate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate template: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="catalogue_template.xlsx"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// Rent Orders

func (h *ExcelHandler) ExportRents(c *gin.Context) {
	buf, err := h.excelService.ExportRents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate Excel file: " + err.Error()})
		return
	}

	filename := fmt.Sprintf("rents_export_%s.xlsx", time.Now().Format("20060102"))
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *ExcelHandler) ImportRents(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file: " + err.Error()})
		return
	}
	defer func() {
		_ = f.Close()
	}()

	if err := h.excelService.ImportRents(f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Import failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rent orders imported successfully"})
}

func (h *ExcelHandler) DownloadRentTemplate(c *gin.Context) {
	buf, err := h.excelService.GetRentTemplate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate template: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="rents_template.xlsx"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
