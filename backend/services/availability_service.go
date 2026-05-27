package services

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/busana/backend/config"
	"github.com/busana/backend/dto"
	"github.com/busana/backend/models"
)

const (
	availabilityRangeLimitDays     = 62
	nextAvailabilitySearchLimitDays = 90
	availabilityCacheTTL           = 45 * time.Second
	defaultVariantID               = "default"
)

var blockingAvailabilityStatuses = []string{
	"requested",
	"confirmed",
	"preparing",
	"ready_pickup",
	"out_delivery",
	"on_rent",
	"active",
}

type availabilityCacheEntry struct {
	expiresAt time.Time
	response  *dto.AvailabilityResponse
}

type rentalAvailabilityRow struct {
	CostumeID uint
	Quantity  int
	RentStart time.Time
	RentEnd   time.Time
}

var availabilityCache = struct {
	sync.Mutex
	items map[string]availabilityCacheEntry
}{
	items: map[string]availabilityCacheEntry{},
}

type AvailabilityService struct{}

func NewAvailabilityService() *AvailabilityService {
	return &AvailabilityService{}
}

func ClearAvailabilityCache() {
	availabilityCache.Lock()
	defer availabilityCache.Unlock()
	availabilityCache.items = map[string]availabilityCacheEntry{}
}

func (s *AvailabilityService) GetAvailability(query dto.AvailabilityQuery) (*dto.AvailabilityResponse, error) {
	productIDs, err := parseAvailabilityIDs(query.ProductIDs, query.CostumeIDs)
	if err != nil {
		return nil, err
	}

	start, end, err := parseAvailabilityRange(query.Start, query.End, availabilityRangeLimitDays)
	if err != nil {
		return nil, err
	}

	variantIDs := parseVariantFilter(query.VariantIDs)
	return s.computeAvailability(productIDs, variantIDs, start, end, availabilityRangeLimitDays, true)
}

func (s *AvailabilityService) FindNextAvailableWindow(query dto.NextAvailabilityQuery) (*dto.NextAvailabilityResponse, error) {
	productIDs, err := parseAvailabilityIDs(query.ProductID, query.CostumeID)
	if err != nil {
		return nil, err
	}
	if len(productIDs) != 1 {
		return nil, errors.New("exactly one product_id is required")
	}
	if query.DurationDays < 1 || query.DurationDays > nextAvailabilitySearchLimitDays {
		return nil, fmt.Errorf("duration_days must be between 1 and %d", nextAvailabilitySearchLimitDays)
	}

	start, err := parseAvailabilityDate(query.Start)
	if err != nil {
		return nil, err
	}
	searchEnd := start.AddDate(0, 0, nextAvailabilitySearchLimitDays-1)
	variantIDs := parseVariantFilter(query.VariantID)

	availability, err := s.computeAvailability(productIDs, variantIDs, start, searchEnd, nextAvailabilitySearchLimitDays, false)
	if err != nil {
		return nil, err
	}

	byDate := map[string][]dto.AvailabilityDayResponse{}
	for _, day := range availability.Days {
		byDate[day.Date] = append(byDate[day.Date], day)
	}

	for offset := 0; offset <= nextAvailabilitySearchLimitDays-query.DurationDays; offset++ {
		windowStart := start.AddDate(0, 0, offset)
		windowEnd := windowStart.AddDate(0, 0, query.DurationDays-1)
		minAvailable := 0
		windowState := "available"
		windowOK := true

		for cursor := windowStart; !cursor.After(windowEnd); cursor = cursor.AddDate(0, 0, 1) {
			rows := byDate[cursor.Format("2006-01-02")]
			available, state, ok := availableForRows(rows)
			if !ok {
				windowOK = false
				break
			}
			if minAvailable == 0 || available < minAvailable {
				minAvailable = available
			}
			if state == "partially_booked" {
				windowState = state
			}
		}

		if windowOK {
			return &dto.NextAvailabilityResponse{
				ProductID: productIDs[0],
				CostumeID: productIDs[0],
				VariantID: requestedVariantID(variantIDs),
				Start:     windowStart.Format("2006-01-02"),
				End:       windowEnd.Format("2006-01-02"),
				State:     windowState,
				Available: minAvailable,
			}, nil
		}
	}

	return nil, errors.New("no available window found within 90 days")
}

func (s *AvailabilityService) computeAvailability(productIDs []uint, variantIDs map[string]bool, start, end time.Time, maxDays int, useCache bool) (*dto.AvailabilityResponse, error) {
	if err := validateAvailabilityRange(start, end, maxDays); err != nil {
		return nil, err
	}

	cacheKey := availabilityCacheKey(productIDs, variantIDs, start, end)
	if useCache {
		if response := readAvailabilityCache(cacheKey); response != nil {
			return response, nil
		}
	}

	var costumes []models.Costume
	if err := config.DB.
		Select("id", "quantity").
		Where("id IN ?", productIDs).
		Find(&costumes).Error; err != nil {
		return nil, err
	}

	var rentalRows []rentalAvailabilityRow
	if len(costumes) > 0 {
		if err := config.DB.Model(&models.RentOrderItem{}).
			Select("rent_order_items.costume_id, rent_order_items.quantity, rent_orders.rent_start, rent_orders.rent_end").
			Joins("JOIN rent_orders ON rent_orders.id = rent_order_items.rent_order_id").
			Where("rent_order_items.costume_id IN ? AND rent_orders.status IN ? AND rent_orders.deleted_at IS NULL AND rent_orders.rent_start <= ? AND rent_orders.rent_end >= ?", productIDs, blockingAvailabilityStatuses, end, start).
			Scan(&rentalRows).Error; err != nil {
			return nil, err
		}
	}

	var blocks []models.CostumeAvailabilityBlock
	if len(costumes) > 0 {
		if err := config.DB.
			Where("costume_id IN ? AND start_date <= ? AND end_date >= ?", productIDs, end, start).
			Find(&blocks).Error; err != nil {
			return nil, err
		}
	}

	days := []dto.AvailabilityDayResponse{}
	sort.Slice(costumes, func(i, j int) bool { return costumes[i].ID < costumes[j].ID })

	for _, costume := range costumes {
		for _, variantID := range availabilityVariantIDs(variantIDs) {
			for day := start; !day.After(end); day = day.AddDate(0, 0, 1) {
				booked := bookedQuantityForDay(rentalRows, costume.ID, day)
				total := costume.Quantity
				available := total - booked
				if available < 0 {
					available = 0
				}

				state := availabilityState(total, booked, available, isUnavailableForDay(blocks, costume.ID, variantID, day))
				if state == "unavailable" {
					available = 0
				}

				days = append(days, dto.AvailabilityDayResponse{
					Date:      day.Format("2006-01-02"),
					ProductID: costume.ID,
					CostumeID: costume.ID,
					VariantID: variantID,
					Total:     total,
					Booked:    booked,
					Available: available,
					State:     state,
				})
			}
		}
	}

	response := &dto.AvailabilityResponse{
		Start:           start.Format("2006-01-02"),
		End:             end.Format("2006-01-02"),
		CacheTTLSeconds: int(availabilityCacheTTL.Seconds()),
		Days:            days,
	}

	if useCache {
		writeAvailabilityCache(cacheKey, response)
	}
	return response, nil
}

func parseAvailabilityIDs(primary, fallback string) ([]uint, error) {
	raw := primary
	if strings.TrimSpace(raw) == "" {
		raw = fallback
	}
	parts := strings.Split(raw, ",")
	ids := map[uint]bool{}
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		id, err := strconv.ParseUint(part, 10, 32)
		if err != nil || id == 0 {
			return nil, errors.New("product_ids must be a comma-separated list of numeric IDs")
		}
		ids[uint(id)] = true
	}
	if len(ids) == 0 {
		return nil, errors.New("product_ids is required")
	}

	result := make([]uint, 0, len(ids))
	for id := range ids {
		result = append(result, id)
	}
	sort.Slice(result, func(i, j int) bool { return result[i] < result[j] })
	return result, nil
}

func parseAvailabilityRange(startRaw, endRaw string, maxDays int) (time.Time, time.Time, error) {
	start, err := parseAvailabilityDate(startRaw)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	end, err := parseAvailabilityDate(endRaw)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	if err := validateAvailabilityRange(start, end, maxDays); err != nil {
		return time.Time{}, time.Time{}, err
	}
	return start, end, nil
}

func parseAvailabilityDate(raw string) (time.Time, error) {
	parsed, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return time.Time{}, errors.New("dates must use YYYY-MM-DD format")
	}
	return parsed, nil
}

func validateAvailabilityRange(start, end time.Time, maxDays int) error {
	if end.Before(start) {
		return errors.New("end must be on or after start")
	}
	days := int(end.Sub(start).Hours()/24) + 1
	if days > maxDays {
		return fmt.Errorf("availability range cannot exceed %d days", maxDays)
	}
	return nil
}

func parseVariantFilter(raw string) map[string]bool {
	result := map[string]bool{}
	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			result[part] = true
		}
	}
	return result
}

func availabilityVariantIDs(variantFilter map[string]bool) []string {
	if len(variantFilter) == 0 {
		return []string{defaultVariantID}
	}
	var result []string
	for variantID := range variantFilter {
		if variantID == "" {
			continue
		}
		result = append(result, variantID)
	}
	sort.Strings(result)
	return result
}

func requestedVariantID(variantFilter map[string]bool) string {
	variants := availabilityVariantIDs(variantFilter)
	if len(variants) == 1 {
		return variants[0]
	}
	return ""
}

func bookedQuantityForDay(rows []rentalAvailabilityRow, costumeID uint, day time.Time) int {
	booked := 0
	for _, row := range rows {
		if row.CostumeID != costumeID {
			continue
		}
		if sameDayOrBefore(row.RentStart, day) && sameDayOrBefore(day, row.RentEnd) {
			booked += row.Quantity
		}
	}
	return booked
}

func isUnavailableForDay(blocks []models.CostumeAvailabilityBlock, costumeID uint, variantID string, day time.Time) bool {
	for _, block := range blocks {
		if block.CostumeID != costumeID {
			continue
		}
		if block.VariantID != "" && block.VariantID != variantID {
			continue
		}
		if sameDayOrBefore(block.StartDate, day) && sameDayOrBefore(day, block.EndDate) {
			return true
		}
	}
	return false
}

func availabilityState(total, booked, available int, unavailable bool) string {
	if unavailable || total <= 0 {
		return "unavailable"
	}
	if available <= 0 {
		return "fully_booked"
	}
	if booked > 0 {
		return "partially_booked"
	}
	return "available"
}

func availableForRows(rows []dto.AvailabilityDayResponse) (int, string, bool) {
	if len(rows) == 0 {
		return 0, "", false
	}

	bestAvailable := 0
	bestState := "fully_booked"
	for _, row := range rows {
		if row.State == "unavailable" || row.State == "fully_booked" || row.Available <= 0 {
			continue
		}
		if row.Available > bestAvailable {
			bestAvailable = row.Available
			bestState = row.State
		}
	}
	return bestAvailable, bestState, bestAvailable > 0
}

func sameDayOrBefore(a, b time.Time) bool {
	return !truncateDay(a).After(truncateDay(b))
}

func truncateDay(value time.Time) time.Time {
	year, month, day := value.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

func availabilityCacheKey(productIDs []uint, variantIDs map[string]bool, start, end time.Time) string {
	idParts := make([]string, len(productIDs))
	for i, id := range productIDs {
		idParts[i] = strconv.Itoa(int(id))
	}
	variants := availabilityVariantIDs(variantIDs)
	return strings.Join([]string{
		strings.Join(idParts, ","),
		strings.Join(variants, ","),
		start.Format("2006-01-02"),
		end.Format("2006-01-02"),
	}, "|")
}

func readAvailabilityCache(key string) *dto.AvailabilityResponse {
	availabilityCache.Lock()
	defer availabilityCache.Unlock()

	entry, ok := availabilityCache.items[key]
	if !ok {
		return nil
	}
	if time.Now().After(entry.expiresAt) {
		delete(availabilityCache.items, key)
		return nil
	}
	return entry.response
}

func writeAvailabilityCache(key string, response *dto.AvailabilityResponse) {
	availabilityCache.Lock()
	defer availabilityCache.Unlock()
	availabilityCache.items[key] = availabilityCacheEntry{
		expiresAt: time.Now().Add(availabilityCacheTTL),
		response:  response,
	}
}
