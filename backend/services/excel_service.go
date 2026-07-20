package services

import (
	"bytes"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
	"github.com/busana/backend/utils"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ExcelService struct{}

func NewExcelService() *ExcelService {
	return &ExcelService{}
}

func setRow(f *excelize.File, sheet string, row int, values ...interface{}) error {
	for i, v := range values {
		cell, err := excelize.CoordinatesToCellName(i+1, row)
		if err != nil {
			return err
		}
		if err := f.SetCellValue(sheet, cell, v); err != nil {
			return err
		}
	}
	return nil
}

// Clients

func (s *ExcelService) ExportClients() (*bytes.Buffer, error) {
	var clients []models.Client
	if err := config.DB.Find(&clients).Error; err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Sheet1"
	if err := f.SetSheetName(f.GetSheetName(0), sheet); err != nil {
		return nil, err
	}

	if err := setRow(f, sheet, 1, "Name", "Phone", "Address"); err != nil {
		return nil, err
	}

	for r, client := range clients {
		if err := setRow(f, sheet, r+2, client.Name, client.Phone, client.Address); err != nil {
			return nil, err
		}
	}

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}
	return &b, nil
}

func (s *ExcelService) ImportClients(r io.Reader) error {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return err
	}

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		if closeErr := f.Close(); closeErr != nil {
			return closeErr
		}
		return err
	}

	if err := f.Close(); err != nil {
		return err
	}

	if len(rows) < 2 {
		return utils.NewAppError("ERR_EXCEL_EMPTY")
	}

	return config.DB.Transaction(func(tx *gorm.DB) error {
		for i, row := range rows {
			if i == 0 || len(row) == 0 || row[0] == "" {
				continue
			}

			client := models.Client{Name: row[0]}
			if len(row) > 1 {
				client.Phone = row[1]
			}
			if len(row) > 2 {
				client.Address = row[2]
			}

			if err := tx.Create(&client).Error; err != nil {
				return fmt.Errorf("error on row %d: %v", i+1, err)
			}
		}
		return nil
	})
}

func (s *ExcelService) GetClientTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Sheet1"
	if err := f.SetSheetName(f.GetSheetName(0), sheet); err != nil {
		return nil, err
	}

	if err := setRow(f, sheet, 1, "Name", "Phone", "Address"); err != nil {
		return nil, err
	}
	if err := setRow(f, sheet, 2, "John Doe", "08123456789", "Jl. Merdeka No. 1"); err != nil {
		return nil, err
	}

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}
	return &b, nil
}

// Costumes (Catalogue)

func (s *ExcelService) ExportCostumes() (*bytes.Buffer, error) {
	var costumes []models.Costume
	if err := config.DB.Preload("Region").Preload("Category").Find(&costumes).Error; err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Sheet1"
	if err := f.SetSheetName(f.GetSheetName(0), sheet); err != nil {
		return nil, err
	}

	if err := setRow(f, sheet, 1, "Name", "Description", "Size", "Region", "Category", "Rental Fee", "Total Quantity"); err != nil {
		return nil, err
	}

	for r, costume := range costumes {
		regionName := ""
		if costume.Region.ID != 0 {
			regionName = costume.Region.Name
		}
		categoryName := ""
		if costume.Category.ID != 0 {
			categoryName = costume.Category.Name
		}

		if err := setRow(f, sheet, r+2, costume.Name, costume.Description, costume.Size, regionName, categoryName, costume.RentalFee, costume.TotalQuantity); err != nil {
			return nil, err
		}
	}

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}
	return &b, nil
}

func (s *ExcelService) ImportCostumes(r io.Reader) error {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return err
	}

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		if closeErr := f.Close(); closeErr != nil {
			return closeErr
		}
		return err
	}

	if err := f.Close(); err != nil {
		return err
	}

	if len(rows) < 2 {
		return utils.NewAppError("ERR_EXCEL_EMPTY")
	}

	return config.DB.Transaction(func(tx *gorm.DB) error {
		regions := make(map[string]uint)
		categories := make(map[string]uint)

		for i, row := range rows {
			if i == 0 || len(row) == 0 || row[0] == "" {
				continue
			}

			costume := models.Costume{Name: row[0]}

			if len(row) > 1 {
				costume.Description = row[1]
			}
			if len(row) > 2 {
				costume.Size = row[2]
			}
			if len(row) > 3 && row[3] != "" {
				regionName := row[3]
				if id, ok := regions[regionName]; ok {
					costume.RegionID = &id
				} else {
					var region models.Region
					if err := tx.Where("name = ?", regionName).First(&region).Error; err != nil {
						region = models.Region{Name: regionName}
						if err := tx.Create(&region).Error; err != nil {
							return fmt.Errorf("failed to create region %s on row %d: %v", regionName, i+1, err)
						}
					}
					regions[regionName] = region.ID
					costume.RegionID = &region.ID
				}
			}
			if len(row) > 4 && row[4] != "" {
				catName := row[4]
				if id, ok := categories[catName]; ok {
					costume.CategoryID = &id
				} else {
					var cat models.Category
					if err := tx.Where("name = ?", catName).First(&cat).Error; err != nil {
						cat = models.Category{Name: catName}
						if err := tx.Create(&cat).Error; err != nil {
							return fmt.Errorf("failed to create category %s on row %d: %v", catName, i+1, err)
						}
					}
					categories[catName] = cat.ID
					costume.CategoryID = &cat.ID
				}
			}
			if len(row) > 5 {
				fee, _ := strconv.Atoi(row[5])
				costume.RentalFee = fee
			}
			if len(row) > 6 {
				qty, _ := strconv.Atoi(row[6])
				if qty > 0 {
					costume.TotalQuantity = qty
				} else {
					costume.TotalQuantity = 1
				}
			} else {
				costume.TotalQuantity = 1
			}

			if err := tx.Create(&costume).Error; err != nil {
				return fmt.Errorf("error on row %d: %v", i+1, err)
			}
		}
		return nil
	})
}

func (s *ExcelService) GetCostumeTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Sheet1"
	if err := f.SetSheetName(f.GetSheetName(0), sheet); err != nil {
		return nil, err
	}

	if err := setRow(f, sheet, 1, "Name", "Description", "Size", "Region", "Category", "Rental Fee", "Total Quantity"); err != nil {
		return nil, err
	}
	if err := setRow(f, sheet, 2, "Baju Bodo", "Traditional Makassarese Costume", "L", "Sulawesi Selatan", "Dewasa", "150000", "5"); err != nil {
		return nil, err
	}

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}
	return &b, nil
}

// Rent Orders

func (s *ExcelService) ExportRents() (*bytes.Buffer, error) {
	var rents []models.RentOrder
	if err := config.DB.Preload("Client").Preload("Items").Preload("Items.Costume").Find(&rents).Error; err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Sheet1"
	if err := f.SetSheetName(f.GetSheetName(0), sheet); err != nil {
		return nil, err
	}

	headers := []interface{}{
		"Group ID", "Client Name", "Client Phone", "Guarantee Type",
		"Event Date", "Pickup Date", "Expected Return Date",
		"Costume Name", "Quantity", "Rental Fee",
		"Total Paid", "Payment Status", "Status",
	}
	if err := setRow(f, sheet, 1, headers...); err != nil {
		return nil, err
	}

	rowIdx := 2
	for _, rent := range rents {
		for _, item := range rent.Items {
			err := setRow(f, sheet, rowIdx,
				rent.ID, rent.Client.Name, rent.Client.Phone, rent.GuaranteeType,
				rent.EventDate.Format("2006-01-02"), rent.PickupDate.Format("2006-01-02"), rent.ExpectedReturnDate.Format("2006-01-02"),
				item.Costume.Name, item.Quantity, item.RentalFee, rent.TotalPaid, rent.PaymentStatus, rent.Status)
			if err != nil {
				return nil, err
			}
			rowIdx++
		}
	}

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}
	return &b, nil
}

func (s *ExcelService) ImportRents(r io.Reader) error {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return err
	}

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		if closeErr := f.Close(); closeErr != nil {
			return closeErr
		}
		return err
	}

	if err := f.Close(); err != nil {
		return err
	}

	if len(rows) < 2 {
		return utils.NewAppError("ERR_EXCEL_EMPTY")
	}

	return config.DB.Transaction(func(tx *gorm.DB) error {
		clientsCache := make(map[string]uint)
		costumesCache := make(map[string]uint)

		type tempItem struct {
			CostumeName string
			Quantity    int
			RentalFee   int
		}

		type tempRent struct {
			ClientName     string
			ClientPhone    string
			GuaranteeType  string
			EventDate      time.Time
			PickupDate     time.Time
			ExpectedReturn time.Time
			TotalPaid      int
			PaymentStatus  string
			Status         string
			Items          []tempItem
		}

		rentsMap := make(map[string]*tempRent)

		for i, row := range rows {
			if i == 0 || len(row) == 0 || row[0] == "" {
				continue
			}

			for len(row) < 13 {
				row = append(row, "")
			}

			groupID := row[0]
			if _, ok := rentsMap[groupID]; !ok {
				eventDate, _ := time.Parse("2006-01-02", row[4])
				pickupDate, _ := time.Parse("2006-01-02", row[5])
				expectedReturn, _ := time.Parse("2006-01-02", row[6])
				totalPaid, _ := strconv.Atoi(row[10])

				rentsMap[groupID] = &tempRent{
					ClientName:     row[1],
					ClientPhone:    row[2],
					GuaranteeType:  row[3],
					EventDate:      eventDate,
					PickupDate:     pickupDate,
					ExpectedReturn: expectedReturn,
					TotalPaid:      totalPaid,
					PaymentStatus:  row[11],
					Status:         row[12],
					Items:          []tempItem{},
				}

				if rentsMap[groupID].Status == "" {
					rentsMap[groupID].Status = "booked"
				}
				if rentsMap[groupID].PaymentStatus == "" {
					rentsMap[groupID].PaymentStatus = "unpaid"
				}
			}

			qty, _ := strconv.Atoi(row[8])
			if qty == 0 {
				qty = 1
			}
			rentalFee, _ := strconv.Atoi(row[9])

			rentsMap[groupID].Items = append(rentsMap[groupID].Items, tempItem{
				CostumeName: row[7],
				Quantity:    qty,
				RentalFee:   rentalFee,
			})
		}

		for groupID, tr := range rentsMap {
			if tr.ClientName == "" {
				return fmt.Errorf("missing client name for group %s", groupID)
			}

			var clientID uint
			if id, ok := clientsCache[tr.ClientName]; ok {
				clientID = id
			} else {
				var client models.Client
				if err := tx.Where("name = ?", tr.ClientName).First(&client).Error; err != nil {
					client = models.Client{
						Name:  tr.ClientName,
						Phone: tr.ClientPhone,
					}
					if err := tx.Create(&client).Error; err != nil {
						return fmt.Errorf("failed to create client %s: %v", tr.ClientName, err)
					}
				}
				clientsCache[tr.ClientName] = client.ID
				clientID = client.ID
			}

			rent := models.RentOrder{
				ClientID:           clientID,
				GuaranteeType:      tr.GuaranteeType,
				EventDate:          tr.EventDate,
				PickupDate:         tr.PickupDate,
				ExpectedReturnDate: tr.ExpectedReturn,
				TotalPaid:          tr.TotalPaid,
				PaymentStatus:      tr.PaymentStatus,
				Status:             tr.Status,
			}

			if err := tx.Create(&rent).Error; err != nil {
				return fmt.Errorf("failed to create rent order for group %s: %v", groupID, err)
			}

			for _, ti := range tr.Items {
				var costumeID uint
				if id, ok := costumesCache[ti.CostumeName]; ok {
					costumeID = id
				} else {
					var costume models.Costume
					if err := tx.Where("name = ?", ti.CostumeName).First(&costume).Error; err != nil {
						costume = models.Costume{
							Name:      ti.CostumeName,
							RentalFee: ti.RentalFee,
						}
						if err := tx.Create(&costume).Error; err != nil {
							return fmt.Errorf("failed to create costume %s: %v", ti.CostumeName, err)
						}
					}
					costumesCache[ti.CostumeName] = costume.ID
					costumeID = costume.ID
				}

				item := models.RentOrderItem{
					RentOrderID: rent.ID,
					CostumeID:   costumeID,
					Quantity:    ti.Quantity,
					RentalFee:   ti.RentalFee,
				}

				if err := tx.Create(&item).Error; err != nil {
					return fmt.Errorf("failed to create rent order item for group %s: %v", groupID, err)
				}
			}
		}

		return nil
	})
}

func (s *ExcelService) GetRentTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Sheet1"
	if err := f.SetSheetName(f.GetSheetName(0), sheet); err != nil {
		return nil, err
	}

	headers := []interface{}{
		"Group ID", "Client Name", "Client Phone", "Guarantee Type",
		"Event Date (YYYY-MM-DD)", "Pickup Date (YYYY-MM-DD)", "Expected Return Date (YYYY-MM-DD)",
		"Costume Name", "Quantity", "Rental Fee",
		"Total Paid", "Payment Status", "Status",
	}
	if err := setRow(f, sheet, 1, headers...); err != nil {
		return nil, err
	}

	row2 := []interface{}{
		"ORDER-1", "Jane Doe", "08987654321", "KTP",
		time.Now().Format("2006-01-02"), time.Now().Format("2006-01-02"), time.Now().AddDate(0, 0, 3).Format("2006-01-02"),
		"Tari Piring", "2", "50000", "100000", "paid", "booked",
	}
	if err := setRow(f, sheet, 2, row2...); err != nil {
		return nil, err
	}

	row3 := []interface{}{
		"ORDER-1", "Jane Doe", "08987654321", "KTP",
		time.Now().Format("2006-01-02"), time.Now().Format("2006-01-02"), time.Now().AddDate(0, 0, 3).Format("2006-01-02"),
		"Tari Saman", "1", "75000", "100000", "paid", "booked",
	}
	if err := setRow(f, sheet, 3, row3...); err != nil {
		return nil, err
	}

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}
	return &b, nil
}
