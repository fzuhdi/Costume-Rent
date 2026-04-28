---
name: costume-rental-knowledge
description: Development guide for the Costume Rental project
---

# Costume Rental - Development Guide

## Quick Reference

### Starting the Application
```bash
docker compose up --build -d
```

### Full Rebuild (when issues occur)
```bash
docker compose down -v && docker compose build --no-cache && docker compose up -d
```

### Default Credentials
- Email: admin@busana.com
- Password: admin123

---

## Common Issues & Fixes

### 1. Backend Build Fails with SQLite Errors
**Error:** `pread64 undeclared`, `off64_t` not found

**Cause:** Using mattn/go-sqlite3 with CGO on Alpine Linux

**Fix:** Use glebarez/sqlite (pure Go)
```go
// backend/go.mod
github.com/glebarez/sqlite v1.10.0

// backend/config/database.go
import "github.com/glebarez/sqlite"

// backend/Dockerfile
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./main.go
```

### 2. Frontend Component Import Errors
**Error:** `useAuth is not exported`, `useNotification is not exported`

**Fix:** Add hook exports to context files
```jsx
// In AuthContext.jsx, NotificationContext.jsx, SettingsContext.jsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 3. Infinite Page Reload on Frontend
**Cause:** Notification API called without auth token

**Fix:** Two parts
1. Backend: Put /api/notifications inside auth group
2. Frontend: Only fetch when authenticated
```jsx
// NotificationContext.jsx
const fetchNotifications = useCallback(async () => {
  if (!isAuthenticated) return;  // Add this check
  // ... rest of fetch
}, [isAuthenticated]);

useEffect(() => {
  if (isAuthenticated) {
    fetchNotifications();
  }
}, [isAuthenticated, fetchNotifications]);
```

### 4. Docker Not Picking Up Changes
**Fix:** Use --no-cache flag
```bash
docker compose build --no-cache
```

### 5. Database File Not Found
**Error:** `unable to open database file: out of memory`

**Fix:** Check volume mount path in docker-compose.yml
```yaml
# Wrong
volumes:
  - busana_db:/app/busana_tari.db

# Correct
volumes:
  - busana_db:/app
```

---

## API Endpoint Access

### Public (No Auth)
- GET /api/settings
- GET /api/costumes
- POST /api/auth/login
- POST /api/auth/register

### Protected (Requires Auth)
- GET /api/notifications
- GET /api/rents
- POST /api/rents
- GET /api/clients
- POST /api/clients
- PUT /api/settings
- All /api/users/* endpoints

---

## Testing

Run the test script:
```bash
bash test/api-test.sh
```

Manual test:
```bash
# Test public endpoint
curl http://localhost/api/settings

# Test protected (should fail)
curl http://localhost/api/notifications

# Login and test
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@busana.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl http://localhost/api/notifications -H "Authorization: Bearer $TOKEN"
```

---

## File Locations
- Backend: backend/
- Frontend: frontend/
- Docker: docker-compose.yml, backend/Dockerfile, frontend/Dockerfile
- Config: .env.production
- Tests: test/
- Notes: .context/project-notes.md