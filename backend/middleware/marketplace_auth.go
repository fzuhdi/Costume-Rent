package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

const marketplaceAudience = "costume-rent-marketplace-api"

func MarketplaceAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("MARKETPLACE_ASSERTION_SECRET")
		if secret == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"success": false, "data": gin.H{"error_code": "ERR_MARKETPLACE_AUTH_NOT_CONFIGURED"}})
			c.Abort()
			return
		}

		header := c.GetHeader("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "data": gin.H{"error_code": "ERR_CUSTOMER_AUTH_REQUIRED"}})
			c.Abort()
			return
		}

		token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
			if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		}, jwt.WithAudience(marketplaceAudience), jwt.WithIssuedAt(), jwt.WithExpirationRequired(), jwt.WithLeeway(15*time.Second))
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "data": gin.H{"error_code": "ERR_CUSTOMER_ASSERTION_INVALID"}})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "data": gin.H{"error_code": "ERR_CUSTOMER_ASSERTION_INVALID"}})
			c.Abort()
			return
		}
		sub, _ := claims["sub"].(string)
		email, _ := claims["email"].(string)
		if sub == "" || email == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "data": gin.H{"error_code": "ERR_CUSTOMER_ASSERTION_INVALID"}})
			c.Abort()
			return
		}
		verified, _ := claims["email_verified"].(bool)
		if !verified {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "data": gin.H{"error_code": "ERR_EMAIL_NOT_VERIFIED"}})
			c.Abort()
			return
		}

		account, err := resolveCustomerAccount(claims, sub, email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": gin.H{"error_code": "ERR_CUSTOMER_RESOLUTION_FAILED"}})
			c.Abort()
			return
		}
		if account.Status != "active" {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "data": gin.H{"error_code": "ERR_CUSTOMER_ACCOUNT_INACTIVE"}})
			c.Abort()
			return
		}

		c.Set("customerAccountID", account.ID)
		c.Set("customerClientID", account.ClientID)
		c.Next()
	}
}

func resolveCustomerAccount(claims jwt.MapClaims, subject, email string) (*models.CustomerAccount, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	var account models.CustomerAccount
	err := config.DB.Where("email = ?", normalizedEmail).First(&account).Error
	if err == nil {
		now := time.Now()
		updates := map[string]interface{}{"last_login_at": now}
		if account.EmailVerifiedAt == nil {
			updates["email_verified_at"] = now
		}
		provider, _ := claims["provider"].(string)
		if account.GoogleSubject == nil && provider == "google" {
			updates["google_subject"] = subject
		}
		if err := config.DB.Model(&account).Updates(updates).Error; err != nil {
			return nil, err
		}
		return &account, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	name, _ := claims["name"].(string)
	phone, _ := claims["phone"].(string)
	now := time.Now()
	var googleSubject *string
	provider, _ := claims["provider"].(string)
	if provider == "google" {
		googleSubject = &subject
	}
	client := models.Client{Name: strings.TrimSpace(name), Phone: strings.TrimSpace(phone)}
	if client.Name == "" {
		client.Name = normalizedEmail
	}
	var created models.CustomerAccount
	err = config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&client).Error; err != nil {
			return err
		}
		created = models.CustomerAccount{
			ClientID:        client.ID,
			Email:           normalizedEmail,
			EmailVerifiedAt: &now,
			GoogleSubject:   googleSubject,
			Status:          "active",
			LastLoginAt:     &now,
		}
		return tx.Create(&created).Error
	})
	if err != nil {
		if lookupErr := config.DB.Where("email = ?", normalizedEmail).First(&created).Error; lookupErr == nil {
			return &created, nil
		}
		return nil, err
	}
	return &created, nil
}

func GetCustomerAccountID(c *gin.Context) uint {
	value, exists := c.Get("customerAccountID")
	if !exists {
		return 0
	}
	id, _ := value.(uint)
	return id
}

func MarketplaceCheckoutEnabled() gin.HandlerFunc {
	return func(c *gin.Context) {
		configured := os.Getenv("MARKETPLACE_CHECKOUT_ENABLED")
		disabled := strings.EqualFold(configured, "false") ||
			(os.Getenv("APP_ENV") == "production" && !strings.EqualFold(configured, "true"))
		if disabled {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"data":    gin.H{"error_code": "ERR_MARKETPLACE_CHECKOUT_DISABLED"},
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
