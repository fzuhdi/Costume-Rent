package services

import (
	"errors"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
	"github.com/busana/backend/utils"
	"gorm.io/gorm"
)

type CostumeService struct{}

func NewCostumeService() *CostumeService {
	return &CostumeService{}
}

func (s *CostumeService) List(filter dto.CostumeFilter) (*dto.PaginatedResponse, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	query := config.DB.Model(&models.Costume{}).Preload("Region").Preload("Category")

	if filter.Search != "" {
		query = query.Where("name LIKE ?", "%"+filter.Search+"%")
	}
	if filter.RegionID != "" {
		if id, err := strconv.ParseUint(filter.RegionID, 10, 32); err == nil {
			query = query.Where("region_id = ?", id)
		}
	}
	if filter.CategoryID != "" {
		if id, err := strconv.ParseUint(filter.CategoryID, 10, 32); err == nil {
			query = query.Where("category_id = ?", id)
		}
	}

	var total int64
	query.Count(&total)

	var costumes []models.Costume
	offset := (filter.Page - 1) * filter.Limit
	if err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&costumes).Error; err != nil {
		return nil, err
	}

	response := []dto.CostumeListResponse{}
	for _, c := range costumes {
		item := dto.CostumeListResponse{
			ID:            c.ID,
			Name:          c.Name,
			Description:   c.Description,
			RegionID:      c.RegionID,
			CategoryID:    c.CategoryID,
			Size:          c.Size,
			RentalFee:     c.RentalFee,
			BuyPrice:      c.BuyPrice,
			TotalQuantity: c.TotalQuantity,
			CoverImage:    c.CoverImage,
		}
		if c.RegionID != nil {
			item.Region = c.Region.Name
		}
		if c.CategoryID != nil {
			item.Category = c.Category.Name
		}
		if c.AcquiredAt != nil {
			acquired := c.AcquiredAt.Format("2006-01-02")
			item.AcquiredAt = &acquired
		}
		response = append(response, item)
	}

	// Batch compute available quantity for all costumes in the list
	var eventDate *time.Time
	if filter.EventDate != "" {
		if t, err := time.Parse("2006-01-02", filter.EventDate); err == nil {
			eventDate = &t
		}
	}

	costumeIDs := make([]uint, len(costumes))
	for i, c := range costumes {
		costumeIDs[i] = c.ID
	}
	type qtyResult struct {
		CostumeID uint
		RentedQty int64
	}
	var rentedResults []qtyResult

	dbQuery := config.DB.Model(&models.RentOrderItem{}).
		Select("rent_order_items.costume_id as costume_id, COALESCE(SUM(rent_order_items.quantity), 0) as rented_qty").
		Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
		Where("rent_order_items.costume_id IN ? AND rent_orders.status IN ? AND rent_orders.deleted_at IS NULL", costumeIDs, []string{"booked", "rented", "overdue"})

	if eventDate != nil {
		pickupDaysBefore := s.getSettingInt("pickup_days_before", 2)
		returnDaysAfter := s.getSettingInt("return_days_after", 1)

		pickupDate := eventDate.AddDate(0, 0, -pickupDaysBefore)
		expectedReturnDate := eventDate.AddDate(0, 0, returnDaysAfter)

		dbQuery = dbQuery.Where("rent_orders.pickup_date <= ? AND rent_orders.expected_return_date >= ?", expectedReturnDate, pickupDate)
	}

	dbQuery.Group("rent_order_items.costume_id").Scan(&rentedResults)

	rentedMap := make(map[uint]int64)
	for _, r := range rentedResults {
		rentedMap[r.CostumeID] = r.RentedQty
	}
	for i := range response {
		rented := rentedMap[response[i].ID]
		response[i].AvailableQuantity = response[i].TotalQuantity - int(rented)
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))

	return &dto.PaginatedResponse{
		Data:       response,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *CostumeService) GetByID(id uint) (*dto.CostumeDetailResponse, error) {
	var costume models.Costume
	if err := config.DB.Preload("Region").Preload("Category").Preload("Images").First(&costume, id).Error; err != nil {
		return nil, err
	}

	availableQty, _ := s.GetAvailableQuantity(costume.ID)

	response := &dto.CostumeDetailResponse{
		ID:                costume.ID,
		Name:              costume.Name,
		Description:       costume.Description,
		RegionID:          costume.RegionID,
		CategoryID:        costume.CategoryID,
		Size:              costume.Size,
		RentalFee:         costume.RentalFee,
		BuyPrice:          costume.BuyPrice,
		TotalQuantity:     costume.TotalQuantity,
		AvailableQuantity: availableQty,
		CoverImage:        costume.CoverImage,
	}

	if costume.RegionID != nil {
		response.Region = costume.Region.Name
	}
	if costume.CategoryID != nil {
		response.Category = costume.Category.Name
	}
	if costume.AcquiredAt != nil {
		acquired := costume.AcquiredAt.Format("2006-01-02")
		response.AcquiredAt = &acquired
	}

	var images []dto.CostumeImageResponse
	for _, img := range costume.Images {
		images = append(images, dto.CostumeImageResponse{
			ID:        img.ID,
			CostumeID: img.CostumeID,
			Path:      img.Path,
			CreatedAt: img.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	response.Images = images

	return response, nil
}

func (s *CostumeService) Create(req dto.CreateCostumeRequest) (*dto.CostumeDetailResponse, error) {
	costume := models.Costume{
		Name:          req.Name,
		Description:   req.Description,
		RegionID:      req.RegionID,
		CategoryID:    req.CategoryID,
		Size:          req.Size,
		RentalFee:     req.RentalFee,
		BuyPrice:      req.BuyPrice,
		TotalQuantity: req.TotalQuantity,
	}

	if costume.TotalQuantity < 1 {
		costume.TotalQuantity = 1
	}

	if req.AcquiredAt != nil {
		if t, err := time.Parse("2006-01-02", *req.AcquiredAt); err == nil {
			costume.AcquiredAt = &t
		}
	}

	if err := config.DB.Create(&costume).Error; err != nil {
		return nil, err
	}

	return s.GetByID(costume.ID)
}

func (s *CostumeService) Update(id uint, req dto.UpdateCostumeRequest) (*dto.CostumeDetailResponse, error) {
	var costume models.Costume
	if err := config.DB.First(&costume, id).Error; err != nil {
		return nil, err
	}

	if req.Name != "" {
		costume.Name = req.Name
	}
	if req.Description != "" {
		costume.Description = req.Description
	}
	if req.RegionID != nil {
		costume.RegionID = req.RegionID
	}
	if req.CategoryID != nil {
		costume.CategoryID = req.CategoryID
	}
	if req.Size != "" {
		costume.Size = req.Size
	}
	if req.RentalFee > 0 {
		costume.RentalFee = req.RentalFee
	}
	if req.BuyPrice > 0 {
		costume.BuyPrice = req.BuyPrice
	}
	if req.TotalQuantity > 0 {
		costume.TotalQuantity = req.TotalQuantity
	}
	if req.AcquiredAt != nil {
		if t, err := time.Parse("2006-01-02", *req.AcquiredAt); err == nil {
			costume.AcquiredAt = &t
		}
	}

	if err := config.DB.Save(&costume).Error; err != nil {
		return nil, err
	}

	return s.GetByID(costume.ID)
}

func (s *CostumeService) Delete(id uint) error {
	return config.DB.Delete(&models.Costume{}, id).Error
}

func (s *CostumeService) AddImage(costumeID uint, path string) (*models.CostumeImage, error) {
	var costume models.Costume
	if err := config.DB.First(&costume, costumeID).Error; err != nil {
		return nil, err
	}

	image := models.CostumeImage{
		CostumeID: costumeID,
		Path:      path,
	}

	if err := config.DB.Create(&image).Error; err != nil {
		return nil, err
	}

	if costume.CoverImage == "" {
		config.DB.Model(&costume).Update("cover_image", path)
	}

	return &image, nil
}

func (s *CostumeService) RemoveImage(costumeID, imageID uint) error {
	var image models.CostumeImage
	if err := config.DB.Where("id = ? AND costume_id = ?", imageID, costumeID).First(&image).Error; err != nil {
		return err
	}

	if err := config.DB.Delete(&image).Error; err != nil {
		return err
	}

	var costume models.Costume
	if err := config.DB.First(&costume, costumeID).Error; err != nil {
		return nil
	}

	if costume.CoverImage == image.Path {
		var firstImage models.CostumeImage
		if err := config.DB.Where("costume_id = ?", costumeID).First(&firstImage).Error; err == nil {
			config.DB.Model(&costume).Update("cover_image", firstImage.Path)
		} else {
			config.DB.Model(&costume).Update("cover_image", "")
		}
	}

	return nil
}

func (s *CostumeService) getSettingInt(key string, defaultValue int) int {
	var setting models.AppSetting
	if err := config.DB.Where("key = ?", key).First(&setting).Error; err == nil {
		if val, err := strconv.Atoi(setting.Value); err == nil {
			return val
		}
	}
	return defaultValue
}

func (s *CostumeService) GetAvailableQuantityOnDate(costumeID uint, eventDate time.Time) (int, error) {
	var costume models.Costume
	if err := config.DB.First(&costume, costumeID).Error; err != nil {
		return 0, err
	}

	pickupDaysBefore := s.getSettingInt("pickup_days_before", 2)
	returnDaysAfter := s.getSettingInt("return_days_after", 1)

	pickupDate := eventDate.AddDate(0, 0, -pickupDaysBefore)
	expectedReturnDate := eventDate.AddDate(0, 0, returnDaysAfter)

	var rentedQty int64
	err := config.DB.Model(&models.RentOrderItem{}).
		Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
		Where("rent_order_items.costume_id = ? AND rent_orders.status IN ? AND rent_orders.deleted_at IS NULL", costumeID, []string{"booked", "rented", "overdue"}).
		Where("rent_orders.pickup_date <= ? AND rent_orders.expected_return_date >= ?", expectedReturnDate, pickupDate).
		Select("COALESCE(SUM(rent_order_items.quantity), 0)").
		Scan(&rentedQty).Error

	if err != nil {
		return 0, err
	}

	return costume.TotalQuantity - int(rentedQty), nil
}

func (s *CostumeService) GetAvailableQuantity(costumeID uint) (int, error) {
	var costume models.Costume
	if err := config.DB.First(&costume, costumeID).Error; err != nil {
		return 0, err
	}

	var rentedQty int64
	config.DB.Model(&models.RentOrderItem{}).
		Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
		Where("rent_order_items.costume_id = ? AND rent_orders.status IN ? AND rent_orders.deleted_at IS NULL", costumeID, []string{"booked", "rented", "overdue"}).
		Select("COALESCE(SUM(rent_order_items.quantity), 0)").
		Scan(&rentedQty)

	return costume.TotalQuantity - int(rentedQty), nil
}

type CostumeSearchResponse struct {
	ID                uint   `json:"id"`
	Name              string `json:"name"`
	Size              string `json:"size"`
	RentalFee         int    `json:"rental_fee"`
	TotalQuantity     int    `json:"total_quantity"`
	AvailableQuantity int    `json:"available_quantity"`
	CoverImage        string `json:"cover_image"`
}

func (s *CostumeService) Search(query string, limit int) ([]CostumeSearchResponse, error) {
	if limit < 1 {
		limit = 10
	}

	var costumes []models.Costume
	searchQuery := "%" + query + "%"
	if err := config.DB.Where("name LIKE ?", searchQuery).
		Limit(limit).
		Find(&costumes).Error; err != nil {
		return nil, err
	}

	response := []CostumeSearchResponse{}
	for _, c := range costumes {
		avail, _ := s.GetAvailableQuantity(c.ID)
		response = append(response, CostumeSearchResponse{
			ID:                c.ID,
			Name:              c.Name,
			Size:              c.Size,
			RentalFee:         c.RentalFee,
			TotalQuantity:     c.TotalQuantity,
			AvailableQuantity: avail,
			CoverImage:        c.CoverImage,
		})
	}
	return response, nil
}

func (s *CostumeService) GetRegions() ([]dto.RegionResponse, error) {
	var regions []models.Region
	if err := config.DB.Find(&regions).Error; err != nil {
		return nil, err
	}

	response := []dto.RegionResponse{}
	for _, r := range regions {
		item := dto.RegionResponse{
			ID:   r.ID,
			Name: r.Name,
		}
		if !r.CreatedAt.IsZero() {
			item.CreatedAt = r.CreatedAt.Format("2006-01-02 15:04:05")
		}
		if !r.UpdatedAt.IsZero() {
			item.UpdatedAt = r.UpdatedAt.Format("2006-01-02 15:04:05")
		}
		response = append(response, item)
	}
	return response, nil
}

func (s *CostumeService) CreateRegion(name string) (*dto.RegionResponse, error) {
	region := models.Region{Name: name}
	if err := config.DB.Create(&region).Error; err != nil {
		if strings.Contains(err.Error(), "UNIQUE") || strings.Contains(err.Error(), "unique") {
			return nil, utils.NewAppError("ERR_DUPLICATE_REGION")
		}
		return nil, err
	}

	return &dto.RegionResponse{
		ID:        region.ID,
		Name:      region.Name,
		CreatedAt: region.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: region.UpdatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *CostumeService) GetCategories() ([]dto.CategoryResponse, error) {
	var categories []models.Category
	if err := config.DB.Find(&categories).Error; err != nil {
		return nil, err
	}

	response := []dto.CategoryResponse{}
	for _, c := range categories {
		item := dto.CategoryResponse{
			ID:   c.ID,
			Name: c.Name,
		}
		if !c.CreatedAt.IsZero() {
			item.CreatedAt = c.CreatedAt.Format("2006-01-02 15:04:05")
		}
		if !c.UpdatedAt.IsZero() {
			item.UpdatedAt = c.UpdatedAt.Format("2006-01-02 15:04:05")
		}
		response = append(response, item)
	}
	return response, nil
}

func (s *CostumeService) CreateCategory(name string) (*dto.CategoryResponse, error) {
	category := models.Category{Name: name}
	if err := config.DB.Create(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, utils.NewAppError("ERR_DUPLICATE_CATEGORY")
		}
		return nil, err
	}

	return &dto.CategoryResponse{
		ID:        category.ID,
		Name:      category.Name,
		CreatedAt: category.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: category.UpdatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *CostumeService) UpdateRegion(id uint, req dto.CreateRegionRequest) (*dto.RegionResponse, error) {
	var region models.Region
	if err := config.DB.First(&region, id).Error; err != nil {
		return nil, err
	}
	region.Name = req.Name
	if err := config.DB.Save(&region).Error; err != nil {
		return nil, err
	}
	return &dto.RegionResponse{
		ID:        region.ID,
		Name:      region.Name,
		CreatedAt: region.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: region.UpdatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *CostumeService) DeleteRegion(id uint) error {
	var count int64
	config.DB.Model(&models.Costume{}).Where("region_id = ?", id).Count(&count)
	if count > 0 {
		return errors.New("cannot delete region: it is currently used by " + strconv.FormatInt(count, 10) + " costume(s)")
	}
	return config.DB.Delete(&models.Region{}, id).Error
}

func (s *CostumeService) UpdateCategory(id uint, req dto.CreateCategoryRequest) (*dto.CategoryResponse, error) {
	var category models.Category
	if err := config.DB.First(&category, id).Error; err != nil {
		return nil, err
	}
	category.Name = req.Name
	if err := config.DB.Save(&category).Error; err != nil {
		return nil, err
	}
	return &dto.CategoryResponse{
		ID:        category.ID,
		Name:      category.Name,
		CreatedAt: category.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: category.UpdatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *CostumeService) DeleteCategory(id uint) error {
	var count int64
	config.DB.Model(&models.Costume{}).Where("category_id = ?", id).Count(&count)
	if count > 0 {
		return errors.New("cannot delete category: it is currently used by " + strconv.FormatInt(count, 10) + " costume(s)")
	}
	return config.DB.Delete(&models.Category{}, id).Error
}

