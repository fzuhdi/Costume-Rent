package dto

type CreateClientRequest struct {
	Name    string `json:"name" validate:"required"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
}

type UpdateClientRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
}

type ClientResponse struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Phone        string `json:"phone"`
	Address      string `json:"address"`
	TotalRents   int64  `json:"total_rents"`
	ActiveRents  int64  `json:"active_rents"`
	HasOverdue   bool   `json:"has_overdue"`
	LastRentDate string `json:"last_rent_date"`
	CreatedAt    string `json:"created_at"`
}

type ClientFilter struct {
	Search string `form:"search"`
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
}
