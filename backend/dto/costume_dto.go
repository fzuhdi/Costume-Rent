package dto

type CreateCostumeRequest struct {
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	Size          string  `json:"size"`
	RegionID      *uint   `json:"region_id"`
	CategoryID    *uint   `json:"category_id"`
	RentalFee     int     `json:"rental_fee"`
	BuyPrice      int     `json:"buy_price"`
	TotalQuantity int     `json:"total_quantity" binding:"min=0"`
	AcquiredAt    *string `json:"acquired_at"`
}

type UpdateCostumeRequest struct {
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	Size          string  `json:"size"`
	RegionID      *uint   `json:"region_id"`
	CategoryID    *uint   `json:"category_id"`
	RentalFee     int     `json:"rental_fee"`
	BuyPrice      int     `json:"buy_price"`
	TotalQuantity int     `json:"total_quantity"`
	AcquiredAt    *string `json:"acquired_at"`
}

type CostumeListResponse struct {
	ID                uint    `json:"id"`
	Name              string  `json:"name"`
	Description       string  `json:"description"`
	RegionID          *uint   `json:"region_id"`
	Region            string  `json:"region"`
	CategoryID        *uint   `json:"category_id"`
	Category          string  `json:"category"`
	Size              string  `json:"size"`
	RentalFee         int     `json:"rental_fee"`
	BuyPrice          int     `json:"buy_price"`
	TotalQuantity     int     `json:"total_quantity"`
	AvailableQuantity int     `json:"available_quantity"`
	CoverImage        string  `json:"cover_image"`
	AcquiredAt        *string `json:"acquired_at"`
}

type CostumeFilter struct {
	Search     string `form:"search"`
	RegionID   string `form:"region_id"`
	CategoryID string `form:"category_id"`
	EventDate  string `form:"event_date"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type CostumeDetailResponse struct {
	ID                uint                   `json:"id"`
	Name              string                 `json:"name"`
	Description       string                 `json:"description"`
	RegionID          *uint                  `json:"region_id"`
	Region            string                 `json:"region"`
	CategoryID        *uint                  `json:"category_id"`
	Category          string                 `json:"category"`
	Size              string                 `json:"size"`
	RentalFee         int                    `json:"rental_fee"`
	BuyPrice          int                    `json:"buy_price"`
	TotalQuantity     int                    `json:"total_quantity"`
	AvailableQuantity int                    `json:"available_quantity"`
	CoverImage        string                 `json:"cover_image"`
	AcquiredAt        *string                `json:"acquired_at"`
	Images            []CostumeImageResponse `json:"images"`
}

type CostumeImageResponse struct {
	ID        uint   `json:"id"`
	CostumeID uint   `json:"costume_id"`
	Path      string `json:"path"`
	CreatedAt string `json:"created_at"`
}

type RegionResponse struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CategoryResponse struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CreateRegionRequest struct {
	Name string `json:"name" binding:"required"`
}

type CreateCategoryRequest struct {
	Name string `json:"name" binding:"required"`
}
