package main

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/middleware"
	"github.com/busana/backend/models"
	"github.com/busana/backend/routes"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	config.LoadEnv()
	config.InitDB()
	migrateDB()

	if len(os.Args) > 1 && os.Args[1] == "seed" {
		runSeedCommand(os.Args[2:])
		return
	}

	if err := middleware.InitJWT(); err != nil {
		log.Fatalf("Failed to initialize JWT: %v", err)
	}

	if os.Getenv("APP_ENV") == "development" {
		runSeedCommand([]string{"demo"})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := routes.SetupRouter()

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func migrateDB() {
	db := config.GetDB()

	log.Println("Running database migrations...")

	// Workaround for SQLite limitation: Cannot add a UNIQUE column to an existing table
	// We drop the improperly parsed column (if it exists) and recreate it with backticks so GORM's DDL parser can read it.
	db.Exec("ALTER TABLE users DROP COLUMN username")
	db.Exec("ALTER TABLE users ADD COLUMN `username` text")
	// Set default for existing admin so unique index doesn't complain about null/empty duplicates
	db.Exec("UPDATE users SET `username` = 'admin' WHERE email = 'admin@busana.com'")

	err := db.AutoMigrate(
		&models.User{},
		&models.Region{},
		&models.Category{},
		&models.Costume{},
		&models.CostumeImage{},
		&models.Client{},
		&models.RentOrder{},
		&models.RentOrderItem{},
		&models.RentTransaction{},
		&models.AppSetting{},
		&models.ActivityLog{},
	)

	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Data migration: rename legacy "active" status to "rented"
	result := db.Model(&models.RentOrder{}).Where("status = ?", "active").Update("status", "rented")
	if result.RowsAffected > 0 {
		log.Printf("Migrated %d orders from 'active' to 'rented'", result.RowsAffected)
	}

	// Data migration: rename "draft" status to "pending" for e-commerce alignment
	draftResult := db.Model(&models.RentOrder{}).Where("status = ?", "draft").Update("status", "pending")
	if draftResult.RowsAffected > 0 {
		log.Printf("Migrated %d orders from 'draft' to 'pending'", draftResult.RowsAffected)
	}

	// Data migration: ensure default admin has a username
	db.Model(&models.User{}).Where("email = ? AND username = ?", "admin@busana.com", "").Update("username", "admin")

	log.Println("Database migrations completed successfully")
}

func runSeedCommand(args []string) {
	log.Println("Running seed command...")
	seedReferenceData()
	adminID := seedAdminUser()
	seedStaffUser()

	if len(args) > 0 && args[0] == "demo" {
		seedSampleCostumes()
		seedSampleRentals(adminID)
	}

	log.Println("Seed command completed successfully")
}

func seedReferenceData() {
	db := config.GetDB()

	var regionCount int64
	db.Model(&models.Region{}).Count(&regionCount)
	if regionCount == 0 {
		log.Println("Seeding regions...")
		regions := []models.Region{
			{Name: "Region 1"},
			{Name: "Region 2"},
			{Name: "Region 3"},
			{Name: "Region 4"},
			{Name: "Region 5"},
		}
		for _, r := range regions {
			db.Create(&r)
		}
	}

	var categoryCount int64
	db.Model(&models.Category{}).Count(&categoryCount)
	if categoryCount == 0 {
		log.Println("Seeding categories...")
		categories := []models.Category{
			{Name: "Category 1"},
			{Name: "Category 2"},
			{Name: "Category 3"},
			{Name: "Category 4"},
			{Name: "Category 5"},
		}
		for _, c := range categories {
			db.Create(&c)
		}
	}

	defaultSettings := []models.AppSetting{
		{Key: "app_name", Value: "Costume Rental"},
		{Key: "app_tagline", Value: "Inventory & Rental Management"},
		{Key: "app_logo", Value: ""},
		{Key: "pickup_days_before", Value: "2"},
		{Key: "return_days_after", Value: "1"},
	}
	for _, s := range defaultSettings {
		var count int64
		db.Model(&models.AppSetting{}).Where("key = ?", s.Key).Count(&count)
		if count == 0 {
			db.Create(&s)
		}
	}

	log.Println("Reference data seed check completed")
}

func seedAdminUser() uint {
	db := config.GetDB()

	var existingAdmin models.User
	if err := db.Where("username = ?", "admin").First(&existingAdmin).Error; err == nil {
		log.Println("Default admin user already exists")
		return existingAdmin.ID
	}

	log.Println("Seeding default admin user...")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	admin := models.User{
		Name:     "Admin Tari",
		Username: "admin",
		Email:    "admin@busana.com",
		Password: string(hashedPassword),
		Role:     "admin",
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	log.Println("Default admin user created: admin / admin123")
	return admin.ID
}

func seedStaffUser() {
	db := config.GetDB()

	var existingStaff models.User
	if err := db.Where("username = ?", "staff").First(&existingStaff).Error; err == nil {
		log.Println("Default staff user already exists")
		return
	}

	log.Println("Seeding default staff user...")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("staff123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	staff := models.User{
		Name:     "Staff Dummy",
		Username: "staff",
		Email:    "staff@busana.com",
		Password: string(hashedPassword),
		Role:     "staff",
	}

	if err := db.Create(&staff).Error; err != nil {
		log.Fatalf("Failed to create staff user: %v", err)
	}

	log.Println("Default staff user created: staff / staff123")
}

func seedSampleCostumes() {
	db := config.GetDB()

	var costumeCount int64
	db.Model(&models.Costume{}).Count(&costumeCount)
	if costumeCount == 0 {
		log.Println("Seeding sample costumes...")
		var bali, jawa, sumatera models.Region
		var category1 models.Category

		db.Where("name = ?", "Bali").First(&bali)
		db.Where("name = ?", "Jawa").First(&jawa)
		db.Where("name = ?", "Sumatera").First(&sumatera)
		db.Where("name = ?", "Baju Adat").First(&category1)

		acquired := time.Now().AddDate(-1, 0, 0)
		baliID := bali.ID
		jawaID := jawa.ID
		sumateraID := sumatera.ID
		cat1ID := category1.ID

		type costumeSeed struct {
			name          string
			description   string
			size          string
			regionID      *uint
			categoryID    *uint
			rentalFee     int
			totalQuantity int
			imageFile     string
		}

		costumes := []costumeSeed{
			{
				name: "Tari Pendet", description: "Busana tari Pendet asli Bali lengkap dengan prada dan hiasan kepala", size: "M",
				regionID: &baliID, categoryID: &cat1ID, rentalFee: 150000, totalQuantity: 3,
				imageFile: "tari_pendet.jpg",
			},
			{
				name: "Tari Jaipong", description: "Baju tari Jaipong khas Sunda, Jawa Barat", size: "L",
				regionID: &jawaID, categoryID: &cat1ID, rentalFee: 125000, totalQuantity: 5,
				imageFile: "tari_jaipong.jpg",
			},
			{
				name: "Tari Piring", description: "Pakaian adat tari Piring khas Minangkabau Sumatera", size: "All Size",
				regionID: &sumateraID, categoryID: &cat1ID, rentalFee: 135000, totalQuantity: 4,
				imageFile: "tari_piring.jpg",
			},
		}

		for _, c := range costumes {
			imagePath := ""
			if c.imageFile != "" && imageExists(c.imageFile) {
				imagePath = "/uploads/" + c.imageFile
			} else if c.imageFile != "" {
				log.Printf("Warning: image file %s not found in uploads folder", c.imageFile)
			}

			costume := models.Costume{
				Name:          c.name,
				Description:   c.description,
				Size:          c.size,
				RegionID:      c.regionID,
				CategoryID:    c.categoryID,
				RentalFee:     c.rentalFee,
				TotalQuantity: c.totalQuantity,
				AcquiredAt:    &acquired,
				CoverImage:    imagePath,
			}
			db.Create(&costume)

			if imagePath != "" {
				db.Create(&models.CostumeImage{CostumeID: costume.ID, Path: imagePath})
			}
		}
		log.Println("Sample costumes created")
	}

	log.Println("Sample costume seed check completed")
}

func seedSampleRentals(adminID uint) {
	db := config.GetDB()

	var clientCount int64
	db.Model(&models.Client{}).Count(&clientCount)
	if clientCount > 0 {
		return // Already seeded
	}

	log.Println("Seeding sample rental data...")

	client := models.Client{
		Name:    "Budi Santoso",
		Phone:   "08123456789",
		Address: "Jl. Merdeka No. 1, Jakarta",
	}
	if err := db.Create(&client).Error; err != nil {
		log.Printf("Failed to seed client: %v", err)
		return
	}

	var costume models.Costume
	if err := db.First(&costume).Error; err != nil {
		log.Printf("No costume found for rental seed: %v", err)
		return
	}

	eventDate := time.Now().AddDate(0, 0, 7)
	pickupDate := eventDate.AddDate(0, 0, -2)
	expectedReturnDate := eventDate.AddDate(0, 0, 1)

	rent := models.RentOrder{
		ClientID:           client.ID,
		GuaranteeType:      "KTP",
		EventDate:          eventDate,
		PickupDate:         pickupDate,
		ExpectedReturnDate: expectedReturnDate,
		TotalPaid:          costume.RentalFee / 2, // 50% dp
		HasSecurityItem:    true,
		Status:             "booked",
		Notes:              "Penyewaan untuk acara adat",
		CreatedBy:          adminID,
	}
	if err := db.Create(&rent).Error; err != nil {
		log.Printf("Failed to seed rental: %v", err)
		return
	}

	item := models.RentOrderItem{
		RentOrderID: rent.ID,
		CostumeID:   costume.ID,
		Quantity:    1,
		RentalFee:   costume.RentalFee,
	}
	if err := db.Create(&item).Error; err != nil {
		log.Printf("Failed to seed rental item: %v", err)
		return
	}

	baseFeeTx := models.RentTransaction{
		RentOrderID: rent.ID,
		Type:        "DEBIT",
		Category:    "BASE_FEE",
		Amount:      costume.RentalFee,
		Notes:       "Biaya Sewa",
		CreatedBy:   adminID,
	}
	if err := db.Create(&baseFeeTx).Error; err != nil {
		log.Printf("Failed to seed rental base fee transaction: %v", err)
		return
	}

	tx := models.RentTransaction{
		RentOrderID:   rent.ID,
		Type:          "CREDIT",
		Category:      "PAYMENT",
		Amount:        costume.RentalFee / 2,
		PaymentMethod: "CASH",
		Notes:         "DP Tunai (Seed)",
		CreatedBy:     adminID,
	}
	if err := db.Create(&tx).Error; err != nil {
		log.Printf("Failed to seed rental transaction: %v", err)
		return
	}

	log.Println("Sample rental created for client Budi Santoso")
}

func imageExists(filename string) bool {
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	fullPath := filepath.Join(uploadDir, filename)
	info, err := os.Stat(fullPath)
	if err != nil {
		return false
	}
	return !info.IsDir()
}
