---
name: costume-rental
description: Development and deployment guide for Costume Rental management system (React + Go + SQLite + Docker)
license: MIT
compatibility: opencode
metadata:
  audience: developers
  stack: react-go-docker
---

# Costume Rental - Development Skill

This skill provides guidance for working with the Costume Rental fullstack application.

## Quick Start

```bash
# Start application
docker compose up --build -d

# Full rebuild (when issues occur)
docker compose down -v && docker compose build --no-cache && docker compose up -d
```

## Default Credentials
- Email: admin@busana.com
- Password: admin123

## Common Issues & Fixes

### 1. Backend Build Fails - SQLite Errors
**Error:** `pread64 undeclared`, `off64_t` not found
**Cause:** Using mattn/go-sqlite3 with CGO on Alpine Linux
**Fix:** Use glebarez/sqlite (pure Go driver)
```go
// go.mod
github.com/glebarez/sqlite v1.10.0

// Dockerfile - use CGO_ENABLED=0
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./main.go
```

### 2. Frontend Import Errors
**Error:** `useAuth is not exported`, `useNotification is not exported`
**Fix:** Add hook exports to context files:
```jsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 3. Infinite Page Reload
**Cause:** Notification API called without auth token
**Fix:**
1. Put /api/notifications inside auth group in routes
2. Only fetch when isAuthenticated=true in frontend

### 4. Database "out of memory" Error
**Fix:** Check volume path in docker-compose.yml:
```yaml
# Wrong
- busana_db:/app/busana_tari.db
# Correct
- busana_db:/app
```

## API Endpoints

### Public (No Auth)
- GET /api/settings
- GET /api/costumes
- POST /api/auth/login
- POST /api/auth/register

### Protected (Requires Auth)
- GET /api/notifications
- GET/POST /api/rents
- GET/POST /api/clients
- PUT /api/settings
- All /api/users/* endpoints

## Testing

```bash
# Run all tests (requires docker compose up)
cd test && npx playwright test

# Run only API tests
cd test && npx playwright test api.test.js

# Run only frontend tests
cd test && npx playwright test frontend.test.js
```

## Test Framework

The `test/` folder uses Playwright for both API and frontend tests.

```
test/
├── playwright.config.js  # Playwright config
├── api.test.js           # API tests
├── frontend.test.js       # Frontend/e2e tests
└── package.json
```

### Adding Tests

Create a new `*.test.js` file:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Feature', () => {
  test('should do something', async ({ request }) => {
    const response = await request.get('/api/something');
    expect(response.status()).toBe(200);
  });
});
```

For frontend tests:

```javascript
test.describe('My Page', () => {
  test('should display content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Welcome');
  });
});
```

## Project Structure
```
Costume Rent/
├── backend/              # Go API
├── frontend/             # React app
├── docker-compose.yml
├── .env.production
├── test/                 # Test scripts
└── .opencode/          
    ├── skills/          # Agent definitions
    ├── knowledge/       # Project documentation
    ├── commands/        # Custom commands
    ├── plugins/         # Plugin configurations
    ├── state/           # Runtime state
    └── logs/            # Session logs
```

## Additional Files
- `test/api-test.sh` - API test script
- `test/test-log.txt` - Test execution log