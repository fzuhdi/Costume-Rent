package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RespondSuccess wraps a successful response with standard metadata
func RespondSuccess(c *gin.Context, data interface{}) {
	// If the data is already a gin.H and we want to preserve it as is or nest it.
	// We'll nest it under "data" for consistency, except if data is nil.

	payload := gin.H{
		"success": true,
	}

	if data != nil {
		payload["data"] = data
	}

	c.JSON(http.StatusOK, payload)
}
