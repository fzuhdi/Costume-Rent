package dto

type CreateCostumeRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	RegionID    *uint   `json:"region_id"`
	CategoryID  *uint   `json:"category_id"`
	Price       int     `json:"price"`
	Quantity    int     `json:"quantity" binding:"min=0"`
	AcquiredAt  *string `json:"acquired_at"`
}

type UpdateCostumeRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	RegionID    *uint   `json:"region_id"`
	CategoryID  *uint   `json:"category_id"`
	Price       int     `json:"price"`
	Quantity    int     `json:"quantity"`
	AcquiredAt  *string `json:"acquired_at"`
}

type CostumeListResponse struct {
	ID               uint    `json:"id"`
	Name             string  `json:"name"`
	Description      string  `json:"description"`
	RegionID         *uint   `json:"region_id"`
	Region           string  `json:"region"`
	CategoryID       *uint   `json:"category_id"`
	Category         string  `json:"category"`
	Price            int     `json:"price"`
	Quantity         int     `json:"quantity"`
	AvailableQuantity int     `json:"available_quantity"`
	CoverImage       string  `json:"cover_image"`
	AcquiredAt       *string `json:"acquired_at"`
}

type CostumeFilter struct {
	Search    string `form:"search"`
	RegionID  string `form:"region_id"`
	CategoryID string `form:"category_id"`
	Page      int    `form:"page"`
	Limit     int    `form:"limit"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type CostumeDetailResponse struct {
	ID               uint                    `json:"id"`
	Name             string                  `json:"name"`
	Description      string                  `json:"description"`
	RegionID         *uint                   `json:"region_id"`
	Region           string                  `json:"region"`
	CategoryID       *uint                   `json:"category_id"`
	Category         string                  `json:"category"`
	Price            int                     `json:"price"`
	Quantity         int                     `json:"quantity"`
	AvailableQuantity int                     `json:"available_quantity"`
	CoverImage       string                  `json:"cover_image"`
	AcquiredAt       *string                 `json:"acquired_at"`
	Images           []CostumeImageResponse `json:"images"`
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

type AvailabilityQuery struct {
	ProductIDs string `form:"product_ids"`
	CostumeIDs string `form:"costume_ids"`
	Start      string `form:"start" binding:"required"`
	End        string `form:"end" binding:"required"`
	VariantIDs string `form:"variant_ids"`
}

type AvailabilityDayResponse struct {
	Date      string `json:"date"`
	ProductID uint   `json:"productId"`
	CostumeID uint   `json:"costumeId"`
	VariantID string `json:"variantId"`
	Total     int    `json:"total"`
	Booked    int    `json:"booked"`
	Available int    `json:"available"`
	State     string `json:"state"`
}

type AvailabilityResponse struct {
	Start           string                    `json:"start"`
	End             string                    `json:"end"`
	CacheTTLSeconds int                       `json:"cacheTtlSeconds"`
	Days            []AvailabilityDayResponse `json:"days"`
}

type NextAvailabilityQuery struct {
	ProductID    string `form:"product_id"`
	CostumeID    string `form:"costume_id"`
	VariantID    string `form:"variant_id"`
	Start        string `form:"start" binding:"required"`
	DurationDays int    `form:"duration_days" binding:"required"`
}

type NextAvailabilityResponse struct {
	ProductID uint   `json:"productId"`
	CostumeID uint   `json:"costumeId"`
	VariantID string `json:"variantId"`
	Start     string `json:"start"`
	End       string `json:"end"`
	State     string `json:"state"`
	Available int    `json:"available"`
}
