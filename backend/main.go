package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/middleware"
	"github.com/busana/backend/models"
	"github.com/busana/backend/routes"
	"github.com/google/uuid"
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
	if os.Getenv("APP_ENV") != "development" {
		return
	}

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

		type costumeSeed struct {
			name        string
			description string
			regionID    *uint
			categoryID  *uint
			condition   string
			quantity    int
			imageURL    string
		}

		costumes := []costumeSeed{
			{
				name: "Kebaya Bali", description: "Kebaya Bali dengan motif songket tradisional",
				regionID: &baliID, categoryID: &cat1ID, condition: "excellent", quantity: 5,
				imageURL: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Balinese_Hindus_dressed_for_traditional_dance_Indonesia.jpg",
			},
			{
				name: "Baju Joged", description: "Baju tari joged banteng untuk pertunjukan",
				regionID: &baliID, categoryID: &cat1ID, condition: "good", quantity: 3,
				imageURL: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Legong_Dance_Indonesia_2.jpg",
			},
			{
				name: "Topeng Keras", description: "Topeng keras untuk tari topeng khas Bali",
				regionID: &baliID, categoryID: &cat2ID, condition: "good", quantity: 10,
				imageURL: "https://upload.wikimedia.org/wikipedia/commons/6/60/Topeng_Bali.jpg",
			},
			{
				name: "Baju Batik", description: "Baju batik Jawa untuk acara formal",
				regionID: &jawaID, categoryID: &cat1ID, condition: "excellent", quantity: 8,
				imageURL: "https://upload.wikimedia.org/wikipedia/commons/7/74/Indonesian_Batik_Shirt_for_Men.jpg",
			},
			{
				name: "Baju Melayu", description: "Pakaian adat Melayu Sumatera",
				regionID: &sumateraID, categoryID: &cat1ID, condition: "good", quantity: 4,
				imageURL: "https://upload.wikimedia.org/wikipedia/commons/0/03/Pakaian_adat_jawa_2.jpg",
			},
			{
				name: "Selendang Songket", description: "Selendang songket dengan benang emas",
				regionID: &baliID, categoryID: &cat3ID, condition: "excellent", quantity: 15,
				imageURL: "https://upload.wikimedia.org/wikipedia/commons/7/75/Kain_Samping_Songket_Lelaki.jpg",
			},
		}

		for _, c := range costumes {
			costume := models.Costume{
				Name:        c.name,
				Description: c.description,
				RegionID:    c.regionID,
				CategoryID:  c.categoryID,
				Condition:   c.condition,
				Quantity:    c.quantity,
				AcquiredAt:  &acquired,
			}
			db.Create(&costume)

			if c.imageURL != "" {
				path, err := downloadImage(c.imageURL)
				if err != nil {
					log.Printf("Warning: failed to download image for %s: %v", c.name, err)
				} else {
					db.Create(&models.CostumeImage{CostumeID: costume.ID, Path: path})
				}
			}
		}
		log.Println("Sample costumes created")
	}

	log.Println("Seed data check completed")
}

func downloadImage(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("http get: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status: %s", resp.Status)
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("mkdir: %w", err)
	}

	ext := filepath.Ext(url)
	if ext == "" {
		ext = ".jpg"
	}
	filename := fmt.Sprintf("seed_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
	filepath := filepath.Join(uploadDir, filename)

	out, err := os.Create(filepath)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, resp.Body); err != nil {
		os.Remove(filepath)
		return "", fmt.Errorf("copy: %w", err)
	}

	return "/uploads/" + filename, nil
}