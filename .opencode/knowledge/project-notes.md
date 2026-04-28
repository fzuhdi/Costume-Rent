# Costume Rental Management - Development Notes

## Project Overview
A fullstack costume rental management system using React + Go + SQLite + Docker.

## Tech Stack
- **Backend:** Go 1.22+ with Gin framework
- **Database:** SQLite (via glebarez/sqlite - pure Go, no CGO)
- **Frontend:** React 18 + Vite
- **DevOps:** Docker + Docker Compose + Nginx

## Key Fixes Applied

### 1. SQLite Driver Change (CGO Issues)
**Problem:** `mattn/go-sqlite3` requires CGO and failed with Alpine Linux compilation errors (`pread64` undeclared).

**Solution:** Switched to `github.com/glebarez/sqlite` - a pure Go SQLite implementation that doesn't require CGO.

**Files changed:**
- `backend/go.mod` - Changed driver from `gorm.io/driver/sqlite` to `github.com/glebarez/sqlite`
- `backend/config/database.go` - Updated import
- `backend/Dockerfile` - Removed CGO dependencies, simplified build

**Build command change:**
```dockerfile
# Before (CGO required)
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./main.go

# After (Pure Go)
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./main.go
```

### 2. Frontend Context Hooks
**Problem:** Components importing `useAuth`, `useNotification`, `useSettings` failed because these hooks weren't exported.

**Solution:** Added hook exports to each context file:
- `frontend/src/context/AuthContext.jsx` - Added `useAuth` hook
- `frontend/src/context/NotificationContext.jsx` - Added `useNotification` hook
- `frontend/src/context/SettingsContext.jsx` - Added `useSettings` hook

### 3. Notification Endpoint Auth Fix
**Problem:** Notification API was being called before login, causing infinite reload loops.

**Root cause:** The notifications endpoint was placed outside the authenticated routes group, making it public. When called without a token, it returned 401, but the frontend was still calling it in a loop.

**Solution:**
1. Moved `/api/notifications` inside the authenticated routes group in `backend/routes/routes.go`
2. Updated `NotificationContext.jsx` to only fetch when `isAuthenticated` is true
3. Removed polling/focus event listeners that triggered unauthenticated calls

**Route structure:**
```go
// Public endpoints
api.GET("/settings", ...)  // public
api.GET("/notifications", ...)  // NOW PROTECTED - moved to auth group

// Protected endpoints
auth := api.Group("")
auth.Use(middleware.AuthMiddleware())
{
    auth.GET("/notifications", notificationHandler.GetNotifications)  // ← here
    // ... other protected routes
}
```

### 4. Volume Path Fix
**Problem:** Database file path in volume mount was incorrect.

**Solution:** Changed docker-compose volume from file to directory:
```yaml
# Before (incorrect)
volumes:
  - busana_db:/app/busana_tari.db

# After (correct)
volumes:
  - busana_db:/app
```

### 5. Docker Cache Issues
**Problem:** Docker wasn't picking up code changes due to build caching.

**Solution:** Use `--no-cache` flag for fresh builds:
```bash
docker compose build --no-cache
# or full rebuild
docker compose down -v && docker compose build --no-cache && docker compose up -d
```

## Project Structure
```
Costume Rent/
├── backend/
│   ├── config/database.go
│   ├── middleware/auth.go, cors.go
│   ├── handlers/
│   ├── services/
│   ├── routes/routes.go
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── context/AuthContext.jsx, NotificationContext.jsx, SettingsContext.jsx
│   │   ├── components/
│   │   └── pages/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.production
├── .gitignore
└── README.md
```

## Default Credentials
- Email: admin@example.com
- Password: admin123

## Docker Commands
```bash
# Start development (rebuilds)
docker compose up --build -d

# Full rebuild (clear caches)
docker compose down -v && docker compose build --no-cache && docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop
docker compose down
```

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/settings | ❌ | App settings (public) |
| GET | /api/notifications | ✅ | Notifications (protected) |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/costumes | ❌ | List costumes |
| POST | /api/costumes | ✅ | Create costume |
| GET | /api/rents | ✅ | List rentals |
| POST | /api/rents | ✅ | Create rental |