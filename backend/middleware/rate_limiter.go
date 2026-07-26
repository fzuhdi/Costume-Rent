package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

var (
	visitors = make(map[string]*visitor)
	mu       sync.Mutex
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// Cleanup old visitors every 5 minutes
func init() {
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			mu.Lock()
			for ip, v := range visitors {
				if time.Since(v.lastSeen) > 10*time.Minute {
					delete(visitors, ip)
				}
			}
			mu.Unlock()
		}
	}()
}

func getVisitor(key string, requests rate.Limit, burst int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	v, exists := visitors[key]
	if !exists {
		limiter := rate.NewLimiter(requests, burst)
		visitors[key] = &visitor{limiter, time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

// LoginRateLimiter limits the number of login attempts
func LoginRateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP() // Uses CF-Connecting-IP if trusted proxies are set
		limiter := getVisitor("staff-login:"+ip, rate.Limit(5), 10)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Terlalu banyak percobaan. Silakan coba lagi nanti."})
			c.Abort()
			return
		}
		c.Next()
	}
}

func MarketplaceCheckoutRateLimiter() gin.HandlerFunc {
	return namedRateLimiter("marketplace-checkout", rate.Every(10*time.Second), 3, true)
}

func MarketplaceCancellationRateLimiter() gin.HandlerFunc {
	return namedRateLimiter("marketplace-cancel", rate.Every(5*time.Second), 3, true)
}

func PaymentWebhookRateLimiter() gin.HandlerFunc {
	return namedRateLimiter("midtrans-webhook", rate.Limit(20), 40, false)
}

func CustomerAuthRateLimiter() gin.HandlerFunc {
	return namedRateLimiter("customer-auth", rate.Every(5*time.Second), 5, false)
}

func CustomerRecoveryRateLimiter() gin.HandlerFunc {
	return namedRateLimiter("customer-recovery", rate.Every(30*time.Second), 3, false)
}

func namedRateLimiter(name string, requests rate.Limit, burst int, includeCustomer bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := name + ":" + c.ClientIP()
		if includeCustomer {
			if customerID := GetCustomerAccountID(c); customerID > 0 {
				key += fmt.Sprintf(":%d", customerID)
			}
		}
		if !getVisitor(key, requests, burst).Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"data":    gin.H{"error_code": "ERR_RATE_LIMITED"},
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
