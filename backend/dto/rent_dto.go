package dto

type CreateRentOrderRequest struct {
	ClientID        *uint          `json:"client_id"`
	ClientName      string         `json:"client_name"`
	ClientPhone     string         `json:"client_phone"`
	ClientAddress   string         `json:"client_address"`
	GuaranteeType   string         `json:"guarantee_type" binding:"required"`
	RentStart       string         `json:"rent_start" binding:"required"`
	RentEnd         string         `json:"rent_end" binding:"required"`
	Items           []RentItemInput `json:"items" binding:"required"`
	Notes           string         `json:"notes"`
}

type RentItemInput struct {
	CostumeID uint `json:"costume_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

type UpdateRentOrderRequest struct {
	GuaranteeType   string         `json:"guarantee_type"`
	RentStart       string         `json:"rent_start"`
	RentEnd         string         `json:"rent_end"`
	Status          string         `json:"status"`
	Notes           string         `json:"notes"`
	Items           []RentItemInput `json:"items"`
}

type RentOrderResponse struct {
	ID              uint              `json:"id"`
	ClientID        uint              `json:"client_id"`
	ClientName      string            `json:"client_name"`
	ClientPhone      string            `json:"client_phone"`
	ClientAddress   string            `json:"client_address"`
	GuaranteeType   string            `json:"guarantee_type"`
	RentStart       string            `json:"rent_start"`
	RentEnd         string            `json:"rent_end"`
	Status          string            `json:"status"`
	Notes           string            `json:"notes"`
	Items           []RentOrderItemResponse `json:"items"`
	CreatedAt       string            `json:"created_at"`
	UpdatedAt       string            `json:"updated_at"`
}

type RentOrderItemResponse struct {
	ID         uint   `json:"id"`
	CostumeID  uint   `json:"costume_id"`
	CostumeName string `json:"costume_name"`
	CoverImage string `json:"cover_image"`
	Quantity   int    `json:"quantity"`
}

type RentOrderFilter struct {
	Status    string `form:"status"`
	ClientID  string `form:"client_id"`
	From      string `form:"from"`
	To        string `form:"to"`
	Search    string `form:"search"`
	Page      int    `form:"page"`
	Limit     int    `form:"limit"`
}

type MarkReturnedRequest struct {
	ReturnedAt string `json:"returned_at"`
}

type NotificationResponse struct {
	Count int64                  `json:"count"`
	Items []NotificationItem     `json:"items"`
}

type NotificationItem struct {
	RentOrderID uint   `json:"rent_order_id"`
	ClientName  string `json:"client_name"`
	RentEnd     string `json:"rent_end"`
	Type        string `json:"type"`
}