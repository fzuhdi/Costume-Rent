package routes

import (
	"net/http"
	"os"

	"github.com/busana/backend/handlers"
	"github.com/busana/backend/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	r.Use(middleware.CORSMiddleware())
	r.Use(serveStaticFiles(uploadDir))

	r.GET("/uploads/*path", func(c *gin.Context) {
		filePath := c.Param("path")
		fullPath := uploadDir + filePath
		c.File(fullPath)
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	authHandler := handlers.NewAuthHandler()
	costumeHandler := handlers.NewCostumeHandler()
	clientHandler := handlers.NewClientHandler()
	rentHandler := handlers.NewRentHandler()
	notificationHandler := handlers.NewNotificationHandler()
	userHandler := handlers.NewUserHandler()
	settingsHandler := handlers.NewSettingsHandler()
	statsHandler := handlers.NewStatsHandler()

	api := r.Group("/api")
	{
		api.GET("/settings", settingsHandler.GetAll)
		api.POST("/settings/logo", settingsHandler.UploadLogo)

		api.GET("/regions", costumeHandler.GetRegions)
		api.POST("/regions", middleware.AuthMiddleware(), costumeHandler.CreateRegion)
		api.GET("/categories", costumeHandler.GetCategories)
		api.POST("/categories", middleware.AuthMiddleware(), costumeHandler.CreateCategory)

		api.GET("/costumes", costumeHandler.List)
		api.GET("/costumes/search", costumeHandler.Search)
		api.GET("/costumes/:id", costumeHandler.GetByID)
		api.POST("/costumes", middleware.AuthMiddleware(), costumeHandler.Create)
		api.PUT("/costumes/:id", middleware.AuthMiddleware(), costumeHandler.Update)
		api.DELETE("/costumes/:id", middleware.AuthMiddleware(), costumeHandler.Delete)
		api.POST("/costumes/:id/images", middleware.AuthMiddleware(), costumeHandler.UploadImage)
		api.DELETE("/costumes/:id/images/:imgId", middleware.AuthMiddleware(), costumeHandler.RemoveImage)

		api.POST("/auth/login", middleware.LoginRateLimiter(), authHandler.Login)
		api.POST("/auth/logout", middleware.AuthMiddleware(), authHandler.Logout)
		api.GET("/auth/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
		api.POST("/auth/register", authHandler.Register)

		auth := api.Group("")
		auth.Use(middleware.AuthMiddleware())
		{
			auth.PUT("/auth/change-password", authHandler.ChangePassword)

			// Client routes
			auth.GET("/clients", clientHandler.List)
			auth.GET("/clients/search", clientHandler.Search)
			auth.GET("/clients/:id", clientHandler.GetByID)
			auth.POST("/clients", clientHandler.Create)
			auth.PUT("/clients/:id", clientHandler.Update)
			auth.DELETE("/clients/:id", clientHandler.Delete)
			auth.GET("/clients/:id/rents", clientHandler.GetRentHistory)

			auth.GET("/rents", rentHandler.List)
			auth.GET("/rents/:id", rentHandler.GetByID)
			auth.POST("/rents", rentHandler.Create)
			auth.PUT("/rents/:id", rentHandler.Update)
			auth.PUT("/rents/:id/return", rentHandler.MarkReturned)
			auth.PUT("/rents/:id/rent", rentHandler.MarkRented)
			auth.PUT("/rents/:id/rollback", rentHandler.RollbackOrder)
			auth.PUT("/rents/:id/cancel", rentHandler.CancelOrder)
			auth.POST("/rents/upload-proof", rentHandler.UploadPaymentProof)
			auth.PUT("/rents/:id/book", rentHandler.MarkBooked)
			auth.POST("/rents/:id/extend", rentHandler.ExtendRent)
			auth.POST("/rents/:id/payments", rentHandler.AddPayment)
			auth.DELETE("/rents/:id", rentHandler.Delete)

			auth.GET("/notifications", notificationHandler.GetNotifications)

			auth.GET("/users", userHandler.List)
			auth.GET("/users/:id", userHandler.GetByID)
			auth.POST("/users", userHandler.Create)
			auth.PUT("/users/:id", userHandler.Update)
			auth.DELETE("/users/:id", userHandler.Delete)

			auth.PUT("/settings", settingsHandler.Update)

			auth.GET("/stats/dashboard", statsHandler.GetDashboardStats)
			auth.GET("/stats/revenue", statsHandler.GetRevenueChart)
		}
	}

	return r
}

func serveStaticFiles(uploadDir string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if len(c.Request.URL.Path) > 9 && c.Request.URL.Path[:9] == "/uploads/" {
			filePath := c.Request.URL.Path[9:]
			fullPath := uploadDir + "/" + filePath
			c.File(fullPath)
			c.Abort()
			return
		}
		c.Next()
	}
}
