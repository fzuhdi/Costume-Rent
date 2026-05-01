package models

type User struct {
	BaseModel
	Name     string `json:"name" gorm:"not null" validate:"required"`
	Email    string `json:"email" gorm:"not null;uniqueIndex" validate:"required,email"`
	Password string `json:"-" gorm:"not null"`
	Role     string `json:"role" gorm:"not null;default:admin"`
}