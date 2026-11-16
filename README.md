# Costume Rental Management

A web application for managing costume inventory and rental transactions.

## Quick Start

### Option 1: Run Locally (Recommended for Development)

**Backend:**
```bash
cd backend
cp .env.example .env   # Create environment file
go run main.go
```
Backend runs at: http://localhost:8080

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

### Option 2: Run with Docker

```bash
docker compose up --build -d
```
Access the app at: http://localhost

---

## Default Login

After first run, use this account:

| Field | Value |
|-------|-------|
| Username | admin |
| Password | admin123 |

---

## Features

### Costume Management
- Add, edit, and delete costumes
- Organize by region and category
- Upload multiple images per costume
- Track quantity available

### Rental System
- Create rental orders with client details
- Track guarantee documents (KTP, SIM, KK, etc.)
- Set rental start and end dates
- Mark rentals as returned

### Client Management
- Keep client database with contact info
- View rental history per client
- Quick client search

### Notifications
- Alerts for overdue rentals
- Reminders for rentals due within 3 days
- Badge count in navigation bar

### Settings
- Customize app name and tagline
- Upload your own logo
- Changes apply instantly

---

## Tech Stack

- **Backend:** Go + Gin
- **Database:** SQLite
- **Frontend:** React + Vite
- **Deployment:** Docker
- **Test:** Playwright

---

## Need Help?

1. Check the logs: `docker compose logs -f`
2. Stop everything: `docker compose down`
3. Restart: `docker compose up --build -d`
