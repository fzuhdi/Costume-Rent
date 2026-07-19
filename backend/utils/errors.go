package utils

import (
	"github.com/gin-gonic/gin"
)

type AppError struct {
	Code string
	Meta map[string]interface{}
}

func (e *AppError) Error() string {
	return e.Code
}

func NewAppError(code string, meta ...map[string]interface{}) *AppError {
	var m map[string]interface{}
	if len(meta) > 0 {
		m = meta[0]
	}
	return &AppError{
		Code: code,
		Meta: m,
	}
}

func RespondFailed(c *gin.Context, statusCode int, err error) {
	if appErr, ok := err.(*AppError); ok {
		c.JSON(statusCode, gin.H{
			"success": false,
			"data": gin.H{
				"error_code": appErr.Code,
				"meta":       appErr.Meta,
			},
		})
		return
	}
	c.JSON(statusCode, gin.H{
		"success": false,
		"data": gin.H{
			"error_code": "ERR_INTERNAL",
			"error":      err.Error(),
		},
	})
}
