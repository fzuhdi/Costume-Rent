package middleware

import (
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

func getVisitor(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	v, exists := visitors[ip]
	if !exists {
		// 5 requests per second, burst of 10
		limiter := rate.NewLimiter(5, 10)
		visitors[ip] = &visitor{limiter, time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

// LoginRateLimiter limits the number of login attempts
func LoginRateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP() // Uses CF-Connecting-IP if trusted proxies are set
		limiter := getVisitor(ip)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Terlalu banyak percobaan. Silakan coba lagi nanti."})
			c.Abort()
			return
		}
		c.Next()
	}
}
