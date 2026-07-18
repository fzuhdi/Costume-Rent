package models

type Client struct {
	BaseModel
	Name       string      `json:"name" gorm:"not null" validate:"required"`
	Phone      string      `json:"phone"`
	Address    string      `json:"address"`
	RentOrders []RentOrder `json:"rent_orders,omitempty" gorm:"foreignKey:ClientID"`
}
