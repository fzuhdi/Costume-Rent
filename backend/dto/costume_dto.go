package dto

type CreateCostumeRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	RegionID    *uint   `json:"region_id"`
	CategoryID  *uint   `json:"category_id"`
	Condition   string  `json:"condition"`
	Quantity    int     `json:"quantity" validate:"min=0"`
	AcquiredAt  *string `json:"acquired_at"`
}

type UpdateCostumeRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	RegionID    *uint   `json:"region_id"`
	CategoryID  *uint   `json:"category_id"`
	Condition   string  `json:"condition"`
	Quantity    int     `json:"quantity"`
	AcquiredAt  *string `json:"acquired_at"`
}

type CostumeListResponse struct {
	ID          uint    `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	RegionID    *uint   `json:"region_id"`
	Region      string  `json:"region"`
	CategoryID  *uint   `json:"category_id"`
	Category    string  `json:"category"`
	Condition   string  `json:"condition"`
	Quantity    int     `json:"quantity"`
	CoverImage  string  `json:"cover_image"`
	AcquiredAt  *string `json:"acquired_at"`
}

type CostumeFilter struct {
	Search    string `form:"search"`
	RegionID  string `form:"region_id"`
	CategoryID string `form:"category_id"`
	Condition string `form:"condition"`
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