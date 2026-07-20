package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/busana/backend/dto"
	"github.com/busana/backend/services"
	"github.com/busana/backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CostumeHandler struct {
	costumeService *services.CostumeService
}

func NewCostumeHandler() *CostumeHandler {
	return &CostumeHandler{
		costumeService: services.NewCostumeService(),
	}
}

func (h *CostumeHandler) List(c *gin.Context) {
	var filter dto.CostumeFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	response, err := h.costumeService.List(filter)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, response)
}

func (h *CostumeHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	costume, err := h.costumeService.GetByID(uint(id))
	if err != nil {
		utils.RespondFailed(c, http.StatusNotFound, utils.NewAppError("ERR_COSTUME_NOT_FOUND"))
		return
	}

	utils.RespondSuccess(c, costume)
}

func (h *CostumeHandler) Create(c *gin.Context) {
	var req dto.CreateCostumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	if req.Name == "" {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	costume, err := h.costumeService.Create(req)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusCreated, costume)
}

func (h *CostumeHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	var req dto.UpdateCostumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	costume, err := h.costumeService.Update(uint(id), req)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, costume)
}

func (h *CostumeHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	if err := h.costumeService.Delete(uint(id)); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, gin.H{"message": "Costume deleted successfully"})
}

func (h *CostumeHandler) UploadImage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}

	file, err := c.FormFile("image")
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
	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
	filepath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	image, err := h.costumeService.AddImage(uint(id), "/uploads/"+filename)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusCreated, image)
}

func (h *CostumeHandler) RemoveImage(c *gin.Context) {
	costumeID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	imageID, err := strconv.ParseUint(c.Param("imgId"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_BAD_REQUEST"))
		return
	}

	if err := h.costumeService.RemoveImage(uint(costumeID), uint(imageID)); err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, gin.H{"message": "Image deleted successfully"})
}

func (h *CostumeHandler) GetRegions(c *gin.Context) {
	regions, err := h.costumeService.GetRegions()
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}
	utils.RespondSuccess(c, regions)
}

func (h *CostumeHandler) CreateRegion(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	region, err := h.costumeService.CreateRegion(req.Name)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusCreated, region)
}

func (h *CostumeHandler) GetCategories(c *gin.Context) {
	categories, err := h.costumeService.GetCategories()
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}
	utils.RespondSuccess(c, categories)
}

func (h *CostumeHandler) CreateCategory(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	category, err := h.costumeService.CreateCategory(req.Name)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (h *CostumeHandler) Search(c *gin.Context) {
	query := c.Query("q")
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	costumes, err := h.costumeService.Search(query, limit)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}

	utils.RespondSuccess(c, costumes)
}

func (h *CostumeHandler) UpdateRegion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	var req dto.CreateRegionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}
	res, err := h.costumeService.UpdateRegion(uint(id), req)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}
	utils.RespondSuccess(c, res)
}

func (h *CostumeHandler) DeleteRegion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	if err := h.costumeService.DeleteRegion(uint(id)); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err) // using 400 because it might be a foreign key constraint
		return
	}
	utils.RespondSuccess(c, gin.H{"message": "Region deleted"})
}

func (h *CostumeHandler) UpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	var req dto.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err)
		return
	}
	res, err := h.costumeService.UpdateCategory(uint(id), req)
	if err != nil {
		utils.RespondFailed(c, http.StatusInternalServerError, err)
		return
	}
	utils.RespondSuccess(c, res)
}

func (h *CostumeHandler) DeleteCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, utils.NewAppError("ERR_INVALID_ID"))
		return
	}
	if err := h.costumeService.DeleteCategory(uint(id)); err != nil {
		utils.RespondFailed(c, http.StatusBadRequest, err) // using 400 because it might be a foreign key constraint
		return
	}
	utils.RespondSuccess(c, gin.H{"message": "Category deleted"})
}
