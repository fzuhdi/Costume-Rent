package main

import (
	"log"
	"os"
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
	middleware.InitJWT()

	migrateDB()
	seedData()

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

	err := db.AutoMigrate(
		&models.User{},
		&models.Region{},
		&models.Category{},
		&models.Costume{},
		&models.CostumeImage{},
		&models.Client{},
		&models.RentOrder{},
		&models.RentOrderItem{},
		&models.AppSetting{},
	)

	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database migrations completed successfully")
}

func seedData() {
	db := config.GetDB()

	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		log.Println("Seeding default admin user...")

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		admin := models.User{
			Name:     "Admin Tari",
			Email:    "admin@busana.com",
			Password: string(hashedPassword),
			Role:     "admin",
		}

		if err := db.Create(&admin).Error; err != nil {
			log.Printf("Failed to create admin user: %v", err)
		} else {
			log.Println("Default admin user created: admin@busana.com / admin123")
		}
	}

	var regionCount int64
	db.Model(&models.Region{}).Count(&regionCount)
	if regionCount == 0 {
		log.Println("Seeding regions...")
		regions := []models.Region{
			{Name: "Bali"},
			{Name: "Jawa"},
			{Name: "Sumatera"},
			{Name: "Kalimantan"},
			{Name: "Sulawesi"},
			{Name: "Nusa Tenggara"},
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
			{Name: "Baju Adat"},
			{Name: "Baju Pernikahan"},
			{Name: "Baju Upacara"},
			{Name: "Topeng"},
			{Name: "Aksesoris"},
			{Name: "Selendang"},
		}
		for _, c := range categories {
			db.Create(&c)
		}
	}

	var settingsCount int64
	db.Model(&models.AppSetting{}).Count(&settingsCount)
	if settingsCount == 0 {
		log.Println("Seeding default settings...")
		settings := []models.AppSetting{
			{Key: "app_name", Value: "Costume Rental"},
			{Key: "app_tagline", Value: "Inventory & Rental Management"},
			{Key: "app_logo", Value: ""},
		}
		for _, s := range settings {
			db.Create(&s)
		}
	}

	var costumeCount int64
	db.Model(&models.Costume{}).Count(&costumeCount)
	if costumeCount == 0 {
		log.Println("Seeding sample costumes...")
		var bali, jawa, sumatera models.Region
		var category1, category2, category3 models.Category

		db.Where("name = ?", "Bali").First(&bali)
		db.Where("name = ?", "Jawa").First(&jawa)
		db.Where("name = ?", "Sumatera").First(&sumatera)
		db.Where("name = ?", "Baju Adat").First(&category1)
		db.Where("name = ?", "Topeng").First(&category2)
		db.Where("name = ?", "Aksesoris").First(&category3)

		acquired := time.Now().AddDate(-1, 0, 0)
		baliID := bali.ID
		jawaID := jawa.ID
		sumateraID := sumatera.ID
		cat1ID := category1.ID
		cat2ID := category2.ID
		cat3ID := category3.ID

		costumes := []models.Costume{
			{Name: "Kebaya Bali", Description: "Kebaya Bali dengan motif songket tradisional", RegionID: &baliID, CategoryID: &cat1ID, Condition: "excellent", Quantity: 5, AcquiredAt: &acquired},
			{Name: "Baju Joged", Description: "Baju tari joged banteng untuk pertunjukan", RegionID: &baliID, CategoryID: &cat1ID, Condition: "good", Quantity: 3, AcquiredAt: &acquired},
			{Name: "Topeng Keras", Description: "Topeng keras untuk tari topeng khas Bali", RegionID: &baliID, CategoryID: &cat2ID, Condition: "good", Quantity: 10, AcquiredAt: &acquired},
			{Name: "Baju Batik", Description: "Baju batik Jawa untuk acara formal", RegionID: &jawaID, CategoryID: &cat1ID, Condition: "excellent", Quantity: 8, AcquiredAt: &acquired},
			{Name: "Baju Melayu", Description: "Pakaian adat Melayu Sumatera", RegionID: &sumateraID, CategoryID: &cat1ID, Condition: "good", Quantity: 4, AcquiredAt: &acquired},
			{Name: "Selendang Songket", Description: "Selendang songket dengan benang emas", RegionID: &baliID, CategoryID: &cat3ID, Condition: "excellent", Quantity: 15, AcquiredAt: &acquired},
		}

		for _, c := range costumes {
			db.Create(&c)
		}
		log.Println("Sample costumes created")
	}

	log.Println("Seed data check completed")
}