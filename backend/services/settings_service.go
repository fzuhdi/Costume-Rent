package services

import (
	"github.com/busana/backend/config"
	"github.com/busana/backend/models"
)

type SettingsService struct{}

func NewSettingsService() *SettingsService {
	return &SettingsService{}
}

func (s *SettingsService) GetAll() (map[string]string, error) {
	settings := make(map[string]string)

	var appSettings []models.AppSetting
	if err := config.DB.Find(&appSettings).Error; err != nil {
		return nil, err
	}

	for _, setting := range appSettings {
		settings[setting.Key] = setting.Value
	}

	return settings, nil
}

func (s *SettingsService) Update(key, value string) error {
	setting := models.AppSetting{
		Key:   key,
		Value: value,
	}

	opts := map[string]interface{}{
		"value":      value,
		"updated_at": config.DB.NowFunc(),
	}

	return config.DB.Where("key = ?", key).Assign(opts).FirstOrCreate(&setting).Error
}

func (s *SettingsService) BulkUpdate(settings map[string]string) error {
	for key, value := range settings {
		if err := s.Update(key, value); err != nil {
			return err
		}
	}
	return nil
}

func (s *SettingsService) GetLogo() (string, error) {
	var setting models.AppSetting
	if err := config.DB.Where("key = ?", "app_logo").First(&setting).Error; err != nil {
		return "", nil
	}
	return setting.Value, nil
}

func (s *SettingsService) SetLogo(path string) error {
	return s.Update("app_logo", path)
}