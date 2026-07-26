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
	r.NoRoute(middleware.CORSMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not Found"})
	})
	r.NoMethod(middleware.CORSMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method Not Allowed"})
	})
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
	excelHandler := handlers.NewExcelHandler()
	marketplaceHandler := handlers.NewMarketplaceHandler()
	customerAuthHandler := handlers.NewCustomerAuthHandler()

	api := r.Group("/api")
	{
		api.GET("/settings", settingsHandler.GetAll)
		api.POST("/settings/logo", middleware.AuthMiddleware(), settingsHandler.UploadLogo)

		api.GET("/regions", costumeHandler.GetRegions)
		api.POST("/regions", middleware.AuthMiddleware(), costumeHandler.CreateRegion)
		api.PUT("/regions/:id", middleware.AuthMiddleware(), costumeHandler.UpdateRegion)
		api.DELETE("/regions/:id", middleware.AuthMiddleware(), costumeHandler.DeleteRegion)

		api.GET("/categories", costumeHandler.GetCategories)
		api.POST("/categories", middleware.AuthMiddleware(), costumeHandler.CreateCategory)
		api.PUT("/categories/:id", middleware.AuthMiddleware(), costumeHandler.UpdateCategory)
		api.DELETE("/categories/:id", middleware.AuthMiddleware(), costumeHandler.DeleteCategory)

		api.GET("/costumes", middleware.AuthMiddleware(), costumeHandler.List)
		api.GET("/costumes/search", middleware.AuthMiddleware(), costumeHandler.Search)
		api.GET("/costumes/:id", middleware.AuthMiddleware(), costumeHandler.GetByID)
		api.POST("/costumes", middleware.AuthMiddleware(), costumeHandler.Create)
		api.PUT("/costumes/:id", middleware.AuthMiddleware(), costumeHandler.Update)
		api.DELETE("/costumes/:id", middleware.AuthMiddleware(), costumeHandler.Delete)
		api.POST("/costumes/:id/images", middleware.AuthMiddleware(), costumeHandler.UploadImage)
		api.DELETE("/costumes/:id/images/:imgId", middleware.AuthMiddleware(), costumeHandler.RemoveImage)

		api.GET("/costumes/excel/export", middleware.AuthMiddleware(), excelHandler.ExportCostumes)
		api.GET("/costumes/excel/template", middleware.AuthMiddleware(), excelHandler.DownloadCostumeTemplate)
		api.POST("/costumes/excel/import", middleware.AuthMiddleware(), excelHandler.ImportCostumes)

		api.POST("/auth/login", middleware.LoginRateLimiter(), authHandler.Login)
		api.POST("/auth/logout", middleware.AuthMiddleware(), authHandler.Logout)
		api.GET("/auth/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
		api.GET("/marketplace/costumes", marketplaceHandler.ListCostumes)
		api.GET("/marketplace/costumes/:id", marketplaceHandler.GetCostume)
		api.POST("/payments/midtrans/webhook", middleware.PaymentWebhookRateLimiter(), marketplaceHandler.MidtransWebhook)
		api.POST("/marketplace/auth/register", middleware.CustomerAuthRateLimiter(), customerAuthHandler.Register)
		api.POST("/marketplace/auth/login", middleware.CustomerAuthRateLimiter(), customerAuthHandler.Login)
		api.POST("/marketplace/auth/verify-email", middleware.CustomerRecoveryRateLimiter(), customerAuthHandler.VerifyEmail)
		api.POST("/marketplace/auth/forgot-password", middleware.CustomerRecoveryRateLimiter(), customerAuthHandler.ForgotPassword)
		api.POST("/marketplace/auth/reset-password", middleware.CustomerRecoveryRateLimiter(), customerAuthHandler.ResetPassword)
		api.POST("/marketplace/auth/resend-verification", middleware.CustomerRecoveryRateLimiter(), customerAuthHandler.ResendVerification)

		customer := api.Group("/marketplace")
		customer.Use(middleware.MarketplaceAuthMiddleware())
		{
			customer.POST("/checkouts", middleware.MarketplaceCheckoutEnabled(), middleware.MarketplaceCheckoutRateLimiter(), marketplaceHandler.CreateCheckout)
			customer.GET("/checkouts/:id", marketplaceHandler.GetCheckout)
			customer.DELETE("/checkouts/:id", marketplaceHandler.AbandonCheckout)
			customer.GET("/orders", marketplaceHandler.ListOrders)
			customer.GET("/orders/:id", marketplaceHandler.GetOrder)
			customer.POST("/orders/:id/cancel", middleware.MarketplaceCancellationRateLimiter(), marketplaceHandler.CancelOrder)
		}

		auth := api.Group("")
		auth.Use(middleware.AuthMiddleware())
		{
			auth.PUT("/auth/change-password", authHandler.ChangePassword)
			auth.POST("/auth/register", middleware.RequireRole("admin"), authHandler.Register)

			// Client routes
			auth.GET("/clients", clientHandler.List)
			auth.GET("/clients/search", clientHandler.Search)
			auth.GET("/clients/:id", clientHandler.GetByID)
			auth.POST("/clients", clientHandler.Create)
			auth.PUT("/clients/:id", clientHandler.Update)
			auth.DELETE("/clients/:id", clientHandler.Delete)
			auth.GET("/clients/:id/rents", clientHandler.GetRentHistory)

			auth.GET("/clients-excel/export", excelHandler.ExportClients)
			auth.GET("/clients-excel/template", excelHandler.DownloadClientTemplate)
			auth.POST("/clients-excel/import", excelHandler.ImportClients)

			auth.GET("/rents", rentHandler.List)
			auth.GET("/rents/:id", rentHandler.GetByID)
			auth.POST("/rents", rentHandler.Create)
			auth.PUT("/rents/:id", rentHandler.Update)
			auth.PUT("/rents/:id/return", rentHandler.MarkReturned)
			auth.POST("/rents/:id/complete", rentHandler.MarkCompleted)
			auth.POST("/rents/:id/receive", rentHandler.ReceiveOrder)
			auth.PUT("/rents/:id/rent", rentHandler.MarkRented)
			auth.PUT("/rents/:id/rollback", rentHandler.RollbackOrder)
			auth.PUT("/rents/:id/cancel", rentHandler.CancelOrder)
			auth.PUT("/rents/:id/delivery", marketplaceHandler.UpdateDelivery)
			auth.POST("/rents/:id/refunds", marketplaceHandler.CreateRefund)
			auth.POST("/payment-attempts/:id/reconcile", marketplaceHandler.ReconcilePayment)
			auth.POST("/rents/upload-proof", rentHandler.UploadPaymentProof)
			auth.POST("/rents/upload-photo", rentHandler.UploadRentPhoto)
			auth.PUT("/rents/:id/book", rentHandler.MarkBooked)
			auth.POST("/rents/:id/extend", rentHandler.ExtendRent)
			auth.POST("/rents/:id/payments", rentHandler.AddPayment)
			auth.POST("/rents/:id/transactions/:trxId/void", rentHandler.VoidTransaction)
			auth.DELETE("/rents/:id", rentHandler.Delete)

			auth.GET("/rents-excel/export", excelHandler.ExportRents)
			auth.GET("/rents-excel/template", excelHandler.DownloadRentTemplate)
			auth.POST("/rents-excel/import", excelHandler.ImportRents)

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
