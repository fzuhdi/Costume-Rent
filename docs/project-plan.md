# 🎭 Costume Rental Management — Web App Template
### Project Plan · Fullstack (React + Go + SQLite + Docker)
### v4 — generalized, app name configurable from admin panel

---

## 1. Database Decision: SQLite ✅

**Recommendation: SQLite** (over PostgreSQL / MongoDB)

| Factor | SQLite | PostgreSQL | MongoDB |
|---|---|---|---|
| Setup | Zero-config, file-based | Requires server process | Requires server process |
| Weight | ~300 KB library | ~50 MB+ | ~100 MB+ |
| Schema fit | ✅ Relational fits costume inventory + rental perfectly | ✅ | ❌ Schema-less is overkill |
| Concurrency | Fine for single-admin write load | Better for high concurrency | Better for high write throughput |
| ORM support in Go | GORM (full support) | GORM (full support) | mongo-driver |
| Best for | ✅ This use case | Scale-out apps | Flexible/document stores |

**Why SQLite wins here:** costume inventory + rental is strongly relational
(rent_order → client, rent_order_items → costume, guarantee → rent_order).
Write load remains low (admin only), zero server to maintain.

---

## 2. Notification Strategy Decision

> ❓ "Not sure if I need a specific table or just query history which rent is near or past due date"

**Recommendation: Query-based — no separate notifications table.**

### Why
A dedicated `notifications` table requires either a cron job or background goroutine to populate it, adds a write on every check, and can go stale. For this use case:

- **Overdue**: `rent_end < TODAY AND status != 'returned'`
- **Due soon** (within 3 days): `rent_end BETWEEN TODAY AND TODAY+3 AND status != 'returned'`

These are a single lightweight SQL query. The backend exposes a `/api/notifications` endpoint that runs this query on demand. The frontend polls it every 60 seconds (or on page focus) and updates the badge count.

### When you WOULD need a notifications table
- You want "dismiss/mark as read" per notification
- You want push notifications (email/WhatsApp) triggered by a background job
- You want to log notification history

For now: **query-based is correct**. The `notifications` endpoint is just a filtered view of `rent_orders`.

---

## 3. Technology Stack

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Language | **Go 1.22+** | Fast, statically typed, small binary |
| Framework | **Gin** | Lightweight, fast router, middleware ecosystem |
| ORM | **GORM** | SQLite-compatible, auto-migrate, easy relations |
| Database | **SQLite** (via `gorm.io/driver/sqlite`) | Zero-config, file-based |
| Auth | **JWT** (golang-jwt/jwt/v5) + bcrypt | Stateless, role embedded in claims |
| File Storage | Local filesystem (`/uploads`) | Simple for MVP; swap to S3 later |
| Config | `godotenv` + `.env` | 12-factor app friendly |
| Validation | `go-playground/validator` | Struct tag-based validation |

### Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **React 18** | Per requirement |
| Component Style | **Pure class/function components** | Per requirement |
| Routing | **React Router v6** | Standard SPA routing |
| HTTP Client | **Axios** | Interceptors for JWT injection |
| State | **React class component state + Context API** | No Redux overhead |
| Styling | **CSS Modules** | Scoped styles, no runtime overhead |
| Build Tool | **Vite** | Fastest dev experience |
| Icons | **Lucide React** | Clean, lightweight |

---

## 4. Project Structure

```
Costume Rent/
│
├── backend/
│   ├── main.go
│   ├── .env
│   ├── go.mod
│   ├── go.sum
│   │
│   ├── config/
│   │   └── database.go
│   │
│   ├── middleware/
│   │   ├── auth.go
│   │   └── cors.go
│   │
│   ├── models/
│   │   ├── user.go
│   │   ├── costume.go
│   │   ├── category.go
│   │   ├── region.go
│   │   ├── client.go             ← NEW
│   │   ├── rent_order.go         ← NEW
│   │   └── rent_order_item.go    ← NEW
│   │
│   ├── handlers/
│   │   ├── auth_handler.go
│   │   ├── costume_handler.go
│   │   ├── category_handler.go
│   │   ├── user_handler.go
│   │   ├── client_handler.go         ← NEW
│   │   ├── rent_handler.go           ← NEW
│   │   └── notification_handler.go   ← NEW
│   │
│   ├── services/
│   │   ├── auth_service.go
│   │   ├── costume_service.go
│   │   ├── client_service.go         ← NEW
│   │   ├── rent_service.go           ← NEW
│   │   └── notification_service.go   ← NEW
│   │
│   ├── dto/
│   │   ├── auth_dto.go
│   │   ├── costume_dto.go
│   │   ├── client_dto.go             ← NEW
│   │   └── rent_dto.go               ← NEW
│   │
│   ├── routes/
│   │   └── routes.go
│   │
│   └── uploads/
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        │
        ├── api/
        │   ├── axios.js
        │   ├── authApi.js
        │   ├── costumeApi.js
        │   ├── clientApi.js           ← NEW
        │   ├── rentApi.js             ← NEW
        │   ├── notificationApi.js     ← NEW
        │   └── settingsApi.js         ← NEW
        │
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── NotificationContext.jsx  ← NEW (polls /api/notifications)
        │   └── SettingsContext.jsx      ← NEW (app name, tagline, logo)
        │
        ├── components/
        │   ├── Navbar.jsx              ← updated: notification bell icon
        │   ├── Sidebar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── CostumeCard.jsx
        │   ├── CostumeTable.jsx
        │   ├── ImageUpload.jsx
        │   ├── Modal.jsx
        │   ├── Badge.jsx
        │   ├── NotificationBell.jsx    ← NEW
        │   ├── ClientSelect.jsx        ← NEW (searchable + create inline)
        │   └── CostumeMultiSelect.jsx  ← NEW (multi-select for rent form)
        │
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── CataloguePage.jsx
        │   ├── CatalogueDetailPage.jsx
        │   ├── CatalogueFormPage.jsx
        │   ├── RentFormPage.jsx        ← NEW
        │   ├── RentHistoryPage.jsx     ← NEW
        │   ├── RentDetailPage.jsx      ← NEW
        │   ├── ClientListPage.jsx      ← NEW
        │   ├── ClientDetailPage.jsx    ← NEW
        │   └── NotFoundPage.jsx
        │
        └── styles/
            ├── global.css
            ├── LoginPage.module.css
            ├── CataloguePage.module.css
            ├── CatalogueDetailPage.module.css
            ├── CatalogueFormPage.module.css
            ├── RentFormPage.module.css
            ├── RentHistoryPage.module.css
            ├── ClientListPage.module.css
            └── ClientDetailPage.module.css
```

---

## 5. Database Schema

```sql
-- ─────────────────────────────────────────────
-- EXISTING TABLES (unchanged)
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,
  role       TEXT    NOT NULL DEFAULT 'admin',
  created_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME
);

CREATE TABLE regions (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE costumes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  description   TEXT,
  region_id     INTEGER REFERENCES regions(id),
  category_id   INTEGER REFERENCES categories(id),
  condition     TEXT    DEFAULT 'good',
  quantity      INTEGER DEFAULT 1,
  acquired_at   DATE,
  cover_image   TEXT,
  created_at    DATETIME,
  updated_at    DATETIME,
  deleted_at    DATETIME
);

CREATE TABLE costume_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  costume_id INTEGER NOT NULL REFERENCES costumes(id),
  path       TEXT    NOT NULL,
  created_at DATETIME
);

-- ─────────────────────────────────────────────
-- NEW TABLES
-- ─────────────────────────────────────────────

-- clients (renters)
CREATE TABLE clients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  phone       TEXT,
  address     TEXT,
  created_at  DATETIME,
  updated_at  DATETIME,
  deleted_at  DATETIME
);

-- rent_orders (one order = one rental transaction)
CREATE TABLE rent_orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id        INTEGER NOT NULL REFERENCES clients(id),
  guarantee_type   TEXT    NOT NULL,  -- 'KTP' | 'SIM' | 'KK' | 'Paspor' | 'Lainnya'
  guarantee_number TEXT,              -- document ID number
  rent_start       DATE    NOT NULL,
  rent_end         DATE    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'active',
                                      -- 'active' | 'returned' | 'overdue'
  notes            TEXT,
  created_by       INTEGER REFERENCES users(id),
  created_at       DATETIME,
  updated_at       DATETIME,
  deleted_at       DATETIME
);

-- rent_order_items (multiple costumes per order)
CREATE TABLE rent_order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  rent_order_id INTEGER NOT NULL REFERENCES rent_orders(id),
  costume_id    INTEGER NOT NULL REFERENCES costumes(id),
  quantity      INTEGER NOT NULL DEFAULT 1,
  created_at    DATETIME
);

-- app_settings (key-value store for all admin-configurable branding)
CREATE TABLE app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at DATETIME
);

-- Seeded defaults (auto-inserted on first run via GORM AfterMigrate hook)
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('app_name',    'Costume Rental'),
  ('app_tagline', 'Inventory & Rental Management'),
  ('app_logo',    '');    -- relative upload path; empty = display text only
```

### Entity Relationships

```
users ──────────────────────────────────────┐
                                            │ created_by
clients ──────────── rent_orders ───────────┘
           1              │    1
                          │
                   rent_order_items
                          │    N
                       costumes
```

### Key Design Decisions

- **`rent_order_items.quantity`**: Each costume can be rented in multiple units per order (e.g. 3× "Kebaya Bali"). Validated against `costumes.quantity` at booking time.
- **`SettingsContext`**: Fetched once on app mount via `GET /api/settings` (public, no auth). Provides `appName`, `appTagline`, `appLogo` to every component. Used in:
  - `document.title` (set in `App.jsx` on route change)
  - `Navbar` brand slot (logo image or text fallback)
  - `LoginPage` header
  - `<meta og:site_name>` for social sharing
- **`status` on `rent_orders`**: Stored as a field to allow manual override. The notification query reads it live.
- **No `notifications` table**: Notifications are a live SQL query — see §2.

---

## 6. Go Data Models (GORM)

```go
// models/app_setting.go
type AppSetting struct {
    Key       string    `gorm:"primaryKey" json:"key"`
    Value     string    `json:"value"`
    UpdatedAt time.Time `json:"updated_at"`
}

// models/client.go
type Client struct {
    gorm.Model
    Name       string      `json:"name" validate:"required"`
    Phone      string      `json:"phone"`
    Address    string      `json:"address"`
    RentOrders []RentOrder `json:"rent_orders,omitempty"`
}

// models/rent_order.go
type RentOrder struct {
    gorm.Model
    ClientID        uint            `json:"client_id" validate:"required"`
    Client          Client          `json:"client"`
    GuaranteeType   string          `json:"guarantee_type" validate:"required"`
    GuaranteeNumber string          `json:"guarantee_number"`
    RentStart       time.Time       `json:"rent_start" validate:"required"`
    RentEnd         time.Time       `json:"rent_end" validate:"required"`
    Status          string          `json:"status"`  // active | returned | overdue
    Notes           string          `json:"notes"`
    CreatedBy       uint            `json:"created_by"`
    Items           []RentOrderItem `json:"items"`
}

// models/rent_order_item.go
type RentOrderItem struct {
    gorm.Model
    RentOrderID uint    `json:"rent_order_id"`
    CostumeID   uint    `json:"costume_id"`
    Costume     Costume `json:"costume"`
    Quantity    int     `json:"quantity" validate:"required,min=1"`
}
```

---

## 7. API Endpoints (Complete)

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user |
| `POST` | `/api/auth/logout` | ✅ | Client-side token clear |

### Costumes
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/costumes` | ❌ | List (pagination + filter) |
| `GET` | `/api/costumes/:id` | ❌ | Detail |
| `POST` | `/api/costumes` | ✅ | Create |
| `PUT` | `/api/costumes/:id` | ✅ | Update |
| `DELETE` | `/api/costumes/:id` | ✅ | Soft-delete |
| `POST` | `/api/costumes/:id/images` | ✅ | Upload images |
| `DELETE` | `/api/costumes/:id/images/:imgId` | ✅ | Remove image |

### Clients ← NEW
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/clients` | ✅ | List clients (search by name) |
| `GET` | `/api/clients/:id` | ✅ | Client detail |
| `POST` | `/api/clients` | ✅ | Create client |
| `PUT` | `/api/clients/:id` | ✅ | Update client |
| `DELETE` | `/api/clients/:id` | ✅ | Soft-delete client |
| `GET` | `/api/clients/:id/rents` | ✅ | Rent history for a client |

### Rent Orders ← NEW
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rents` | ✅ | List all rent orders (filter: status, client, date range) |
| `GET` | `/api/rents/:id` | ✅ | Rent order detail with items |
| `POST` | `/api/rents` | ✅ | Create rent order (+ create client inline if needed) |
| `PUT` | `/api/rents/:id` | ✅ | Update rent order |
| `PUT` | `/api/rents/:id/return` | ✅ | Mark as returned |
| `DELETE` | `/api/rents/:id` | ✅ | Soft-delete |

### Notifications ← NEW
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | Query-based: overdue + due-soon rent orders |

Notification response shape:
```json
{
  "count": 4,
  "items": [
    {
      "rent_order_id": 12,
      "client_name": "Budi Santoso",
      "rent_end": "2025-04-28",
      "type": "overdue"
    },
    {
      "rent_order_id": 17,
      "client_name": "Siti Rahayu",
      "rent_end": "2025-04-29",
      "type": "due_soon"
    }
  ]
}
```

### Reference Data
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/regions` | ❌ | List regions |
| `POST` | `/api/regions` | ✅ | Add region |
| `GET` | `/api/categories` | ❌ | List categories |
| `POST` | `/api/categories` | ✅ | Add category |

### App Settings ← NEW
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/settings` | ❌ | Get all settings (public — used by frontend on load) |
| `PUT` | `/api/settings` | ✅ | Bulk update settings (admin only) |
| `POST` | `/api/settings/logo` | ✅ | Upload logo image |

### Users (Optional)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users` | ✅ | List users |
| `POST` | `/api/users` | ✅ | Create user |
| `PUT` | `/api/users/:id` | ✅ | Update role |
| `DELETE` | `/api/users/:id` | ✅ | Deactivate |

### Static Files
| Method | Path | Description |
|---|---|---|
| `GET` | `/uploads/*` | Serve uploaded costume images |

---

## 8. Frontend Pages & Components

### `LoginPage`
- Email + password form → JWT stored in `localStorage`
- Redirect to `/catalogue` on success

### `CataloguePage`
- Toggle: **Table View** ↔ **Gallery View**
- Filter: Region, Category, Condition — Search by name — Pagination
- Admin: **+ Add Costume** button

### `CatalogueDetailPage`
- Full detail, image gallery, admin Edit/Delete buttons

### `CatalogueFormPage`
- Add/Edit costume with single cover image + multi-image upload

---

### `RentFormPage` ← NEW
**Used for both creating and editing a rent order.**

| Field | Type | Notes |
|---|---|---|
| Client Name | `ClientSelect` component | Search existing; "Buat klien baru" option if no match |
| Phone | Text | Auto-filled if existing client; editable for new |
| Address | Text | Same as phone |
| Guarantee Type | Select | KTP / SIM / KK / Paspor / Lainnya |
| Guarantee Number | Text | Document ID number |
| Rent Start | Date picker | |
| Rent End | Date picker | Must be ≥ Rent Start |
| Costumes | `CostumeMultiSelect` | Searchable; qty input per item; shows available stock |
| Notes | Textarea | Optional |

**Submit logic:**
1. If client is new (typed name, no ID) → backend receives `client_name` + optional phone/address
2. Backend service: `client_id` absent → `INSERT INTO clients`, get new ID → bind to order
3. Backend validates: each `item.quantity ≤ costume.quantity - active_rented_qty`

---

### `RentHistoryPage` ← NEW
- Tabular: Order #, Client, Costumes count, Rent Start, Rent End, Status badge, Actions
- Status badges: `active` = blue · `overdue` = red · `returned` = green
- Filter: Status, Client (search), Date range
- Quick action: **Mark Returned** inline
- **+ New Rent** button top-right

---

### `RentDetailPage` ← NEW
- Rent summary card: client info, guarantee type + number, dates, status
- Costume table: cover thumbnail, name, qty
- Timestamps: Created At, Returned At
- Admin actions: **Edit**, **Mark Returned**, **Delete**

---

### `ClientListPage` ← NEW
- Table: Name, Phone, Address, Total Rents, Last Rent, Actions
- Search by name
- **+ Add Client** button

---

### `ClientDetailPage` ← NEW
- Client info card with inline Edit
- Full rent history table (same as `RentHistoryPage` filtered by this client)
- Summary stats: Total Rents · Active Rents · Overdue badge if any

---

### `SettingsPage` ← NEW
**Admin-only page to configure all branding from the browser — no code changes needed.**

| Field | Type | Notes |
|---|---|---|
| App Name | Text input | Shown in browser `<title>`, Navbar, Login page header |
| Tagline | Text input | Subtitle shown on Login page and footer |
| Logo | Image upload | Replaces text name in Navbar if set; leave empty to show text |

- On load: pre-fills from `GET /api/settings`
- On save: `PUT /api/settings` with `{ app_name, app_tagline, app_logo }`
- Logo upload: `POST /api/settings/logo` (multipart), returns path stored in `app_logo`
- Changes reflect instantly app-wide via `SettingsContext` re-fetch

---

### `NotificationBell` Component ← NEW
- Lives in `Navbar`, beside user profile avatar
- Shows count badge from `NotificationContext`
- Dropdown on click: lists overdue (red) + due-soon (orange) orders
- Each item: client name · rent-end date · type tag
- Click → navigates to `RentDetailPage`
- `NotificationContext` polls `/api/notifications` every 60s

---

### `ClientSelect` Component ← NEW
Searchable dropdown with inline-create:

```
[ Cari atau ketik nama klien...          ▼ ]

  ● Budi Santoso
  ● Siti Rahayu
  ─────────────────────────────────────────
  ✚ Buat klien baru: "Dewi Putri"
```

- Debounced search (300ms) → `GET /api/clients?search=xxx`
- Selecting "create" option → passes `{ newClientName }` up to form state

---

### `CostumeMultiSelect` Component ← NEW
Multi-picker with per-item quantity input:

```
[ Cari kostum...                          ]

✓ Kebaya Bali    Qty: [ 2 ]  / 5 tersedia
  Baju Topeng    Qty: [ 1 ]  / 3 tersedia
```

- Shows available stock hint per costume
- Validates qty ≤ available before form submit

---

## 9. Notification Flow

```
[NotificationContext]           [Go Backend]
  mounts on app load                 │
        │── GET /api/notifications ──►│
        │                             │  SELECT ro.id, c.name, ro.rent_end,
        │                             │    CASE
        │                             │      WHEN ro.rent_end < DATE('now')
        │                             │        THEN 'overdue'
        │                             │      ELSE 'due_soon'
        │                             │    END AS type
        │                             │  FROM rent_orders ro
        │                             │  JOIN clients c ON c.id = ro.client_id
        │                             │  WHERE ro.status = 'active'
        │                             │    AND ro.rent_end <= DATE('now','+3 days')
        │                             │    AND ro.deleted_at IS NULL
        │◄── { count: 2, items:[...]} │
        │                             │
  setState({ count, items })          │
  bell badge renders                  │
        │                             │
  setInterval(60s) → repeat ──────────┘
```

---

## 10. Rent Creation Flow

```
[RentFormPage]                          [Go Backend / rent_service.go]
      │                                           │
      │── POST /api/rents ───────────────────────►│
      │  {                                        │
      │    client_id: 3,           (existing)     │  → skip client creation
      │    // OR                                  │
      │    client_name: "Dewi",    (new)          │  → INSERT clients → get ID
      │    client_phone: "081234", (new optional) │
      │    guarantee_type: "KTP",                 │
      │    guarantee_number: "327100001",         │
      │    rent_start: "2025-05-01",              │
      │    rent_end: "2025-05-03",                │
      │    items: [                               │  → validate qty available
      │      { costume_id: 1, quantity: 2 },      │  → INSERT rent_order_items
      │      { costume_id: 5, quantity: 1 }       │
      │    ],                                     │
      │    notes: "Untuk pentas Sabtu"            │
      │  }                                        │
      │◄── { rent_order_id: 42, status: "active"} │
      │                                           │
  navigate to /rents/42                           │
```

---

## 11. Authentication Flow

```
[Client]                            [Go Backend]
   │── POST /api/auth/login ────────►│
   │   { email, password }           │  verify bcrypt
   │                                 │  sign JWT { userId, role, exp }
   │◄── { token, user } ────────────│
   │  store in localStorage          │
   │── Any protected request ────────►│
   │  Authorization: Bearer <token>  │  verify JWT → inject user ctx
   │◄── response ────────────────────│
```

JWT payload:
```json
{
  "sub": "1",
  "name": "Admin Tari",
  "role": "admin",
  "exp": 1234567890
}
```

---

## 12. Development Phases (Updated)

### Phase 1 — Backend Foundation *(~3 days)*
- [ ] Init Go module, Gin + GORM + SQLite
- [ ] Auto-migrate all models (incl. Client, RentOrder, RentOrderItem)
- [ ] Seed: default admin, sample regions, categories, clients, costumes
- [ ] Auth: login → JWT, JWT middleware

### Phase 2 — Costume CRUD API *(~2 days)*
- [ ] Costume handlers: list (filter/pagination), detail, create, update, soft-delete
- [ ] File upload → `/uploads`
- [ ] Region & category endpoints

### Phase 3 — Client & Rent API *(~3 days)*
- [ ] Client handlers: CRUD + name search
- [ ] Rent handlers: create (inline client if needed), list, detail, update, mark-returned, delete
- [ ] Quantity availability validation
- [ ] Notification endpoint (query-based)

### Phase 4 — Frontend Shell *(~2 days)*
- [ ] Vite + React, Axios + JWT interceptor
- [ ] `AuthContext`, `NotificationContext` (60s polling)
- [ ] React Router: all routes
- [ ] Navbar with `NotificationBell`, Sidebar

### Phase 5 — Catalogue Pages *(~3 days)*
- [ ] `LoginPage`
- [ ] `CataloguePage` (table + gallery, filter, search)
- [ ] `CatalogueDetailPage`
- [ ] `CatalogueFormPage` (add + edit, image upload)

### Phase 6 — Rent Pages *(~4 days)*
- [ ] `ClientSelect` component
- [ ] `CostumeMultiSelect` component
- [ ] `RentFormPage` (create + edit)
- [ ] `RentHistoryPage` (tabular, filter, pagination)
- [ ] `RentDetailPage`

### Phase 7 — Client Pages *(~2 days)*
- [ ] `ClientListPage`
- [ ] `ClientDetailPage` with embedded rent history

### Phase 7.5 — Settings Page *(~1 day)*
- [ ] `SettingsContext` — fetch on app mount, expose to all components
- [ ] `SettingsPage` — app name, tagline, logo upload
- [ ] `Settings` API handler + logo upload endpoint
- [ ] Wire `appName` into `<title>`, Navbar, LoginPage
- [ ] Sidebar link: ⚙️ Pengaturan (Settings)

### Phase 8 — Polish *(~2 days)*
- [ ] Responsive design
- [ ] Loading states, error handling, empty states
- [ ] Role management page (optional)
- [ ] 404 page
- [ ] Production build & deployment notes

---

## 13. Environment Variables

### Backend `.env`
```env
PORT=8080
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_HOURS=24
DB_PATH=./busana_tari.db
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=http://localhost:5173
NOTIFICATION_DUE_DAYS=3
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_UPLOADS_URL=http://localhost:8080/uploads
VITE_NOTIFICATION_POLL_MS=60000
```

---

## 14. Go Dependencies

```bash
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/sqlite
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto
go get github.com/joho/godotenv
go get github.com/go-playground/validator/v10
```

## Frontend Dependencies

```bash
npm install react-router-dom axios lucide-react
```

---

## 15. Notes & Recommendations

- **Quantity availability check**: `requested_qty ≤ costume.quantity - SUM(active rent_order_items for that costume)`. Do this in `rent_service.go` before inserting.
- **Soft Delete everywhere**: Clients + RentOrders use `deleted_at`. Rent history is never truly lost, even if a client is "removed" from the list.
- **Status field**: Set manually by admin (Mark Returned). Optionally add a nightly Go goroutine that auto-flips `status = 'overdue'` for past-due active orders — but the notification query handles the UI regardless.
- **Guarantee types**: Stored as string enum. Seeded list: `KTP, SIM, KK, Paspor, Lainnya`. Extensible without schema change.
- **Client deduplication**: `ClientSelect` searches before offering "create new". Reduces duplicates. Future: phone-based dedup.
- **Rent list filtering**: `GET /api/rents?page=1&limit=20&status=active&client_id=3&from=2025-04-01&to=2025-04-30`
- **Future scaling**: PostgreSQL swap = one `.env` line change. Notifications table = add only if "mark as read" is needed later.

---

## 16. Containerization Strategy ← NEW

### Recommendation: Docker + Docker Compose ✅

| Option | Verdict | Reason |
|---|---|---|
| **Docker + Docker Compose** | ✅ Best fit | Simple, portable, one command to run everything |
| Kubernetes (K8s) | ❌ Overkill | Designed for multi-service, high-availability clusters. Too much overhead for a single-admin app |
| Podman | ⚠️ Alternative | Docker-compatible but smaller ecosystem; no advantage here |
| Bare metal / systemd | ❌ Not portable | Manual setup per server, no reproducibility |

**Why Docker Compose wins:** The entire app (frontend + backend + volumes) starts with one command — `docker compose up`. No database server to manage separately (SQLite is a file). The same compose file works on any developer machine and any Linux VPS.

---

### Container Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Docker Compose Network               │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │           nginx (frontend container)         │   │
│   │                                              │   │
│   │  :80 ──► /              → serves React SPA   │   │
│   │         /api/*          → proxy_pass backend │   │
│   │         /uploads/*      → proxy_pass backend │   │
│   └─────────────────────────────────────────────┘   │
│                        │ proxy                       │
│   ┌─────────────────────────────────────────────┐   │
│   │         backend (Go/Gin container)           │   │
│   │                                              │   │
│   │  :8080 ──► /api/*   handles all API routes  │   │
│   │            /uploads/* serves static files   │   │
│   └─────────────────────────────────────────────┘   │
│                        │ mounts                      │
│   ┌─────────────────────────────────────────────┐   │
│   │             Named Docker Volumes             │   │
│   │                                              │   │
│   │  busana_db      → /app/busana_tari.db        │   │
│   │  busana_uploads → /app/uploads/              │   │
│   └─────────────────────────────────────────────┘   │
│                                                      │
│   Host port exposed: 80 (nginx only)                 │
└──────────────────────────────────────────────────────┘
```

**Key insight — Nginx as reverse proxy:**
In production, Nginx serves the React build (static files) AND proxies `/api/*` and `/uploads/*` to the Go backend. This means:
- Only **one port (80)** is exposed publicly
- **No CORS issues** — frontend and API are on the same origin
- The Go container is not directly reachable from outside

---

### Updated Project Structure (Docker files)

```
Costume Rent/
├── docker-compose.yml          ← orchestrates both services + volumes
├── docker-compose.override.yml ← dev overrides (optional)
├── .env.production             ← production secrets (gitignored)
│
├── backend/
│   ├── Dockerfile              ← multi-stage Go build
│   ├── .dockerignore
│   └── ... (existing structure)
│
└── frontend/
    ├── Dockerfile              ← multi-stage Node build → Nginx
    ├── nginx.conf              ← Nginx config with API proxy
    ├── .dockerignore
    └── ... (existing structure)
```

---

### `backend/Dockerfile`

```dockerfile
# ── Stage 1: Build ──────────────────────────────────
FROM golang:1.22-alpine AS builder

# gcc needed for SQLite (cgo)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./main.go

# ── Stage 2: Run ────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/server .

# Persistent directories (mounted as volumes)
RUN mkdir -p uploads

EXPOSE 8080
CMD ["./server"]
```

> **Why alpine in stage 2?** The Go binary + SQLite (cgo) needs a libc. Alpine's musl libc keeps the final image under ~20 MB. A pure-Go stack could use `scratch`, but SQLite requires cgo.

---

### `frontend/Dockerfile`

```dockerfile
# ── Stage 1: Build React ─────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# API URL is proxied through Nginx — use relative path
RUN VITE_API_BASE_URL=/api VITE_UPLOADS_URL=/uploads npm run build

# ── Stage 2: Serve with Nginx ────────────────────────
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # React SPA — all unknown paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Go backend
    location /api/ {
        proxy_pass         http://backend:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy uploaded image files to Go backend
    location /uploads/ {
        proxy_pass         http://backend:8080;
        proxy_set_header   Host $host;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### `docker-compose.yml`

```yaml
version: "3.9"

services:

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: busana_backend
    restart: unless-stopped
    env_file: .env.production
    volumes:
      - busana_db:/app/busana_tari.db      # SQLite file persistence
      - busana_uploads:/app/uploads         # Uploaded images persistence
    networks:
      - busana_net
    # NOT exposed to host — only reachable via nginx proxy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: busana_frontend
    restart: unless-stopped
    ports:
      - "80:80"           # Only this port is public
    depends_on:
      - backend
    networks:
      - busana_net

volumes:
  busana_db:
    name: busana_db
  busana_uploads:
    name: busana_uploads

networks:
  busana_net:
    driver: bridge
```

---

### `.env.production` *(gitignored)*

```env
PORT=8080
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_HOURS=24
DB_PATH=/app/busana_tari.db
UPLOAD_DIR=/app/uploads
ALLOWED_ORIGINS=http://your-domain.com
NOTIFICATION_DUE_DAYS=3
```

---

### `.dockerignore` files

**`backend/.dockerignore`**
```
uploads/
busana_tari.db
*.db
.env*
```

**`frontend/.dockerignore`**
```
node_modules/
dist/
.env*
```

---

### Deployment Commands

**First-time setup or after code changes:**
```bash
docker compose up --build -d
```

**View logs:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Stop everything:**
```bash
docker compose down
```

**Backup SQLite database:**
```bash
docker run --rm \
  -v busana_db:/data \
  -v $(pwd)/backup:/backup \
  alpine sh -c "cp /data/busana_tari.db /backup/busana_$(date +%Y%m%d).db"
```

**Update to new version (zero-downtime approach):**
```bash
git pull
docker compose up --build -d
# Compose recreates only changed containers
```

---

### Where to Host

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **VPS (DigitalOcean / Vultr / Hetzner)** | ~$6–12/mo | Low | SSH in, install Docker, `docker compose up`. Done. |
| **Railway** | Free tier / pay-per-use | Very low | Supports Docker Compose natively |
| **Render** | Free tier / $7/mo | Very low | Docker support, but SQLite volume persistence needs paid tier |
| **Fly.io** | Free tier / pay-per-use | Low | Good Docker support, volume persistence available |
| Self-hosted (Raspberry Pi / NAS) | ~$0 ongoing | Medium | Fine for local business use |

**Recommended for a local Indonesian rental business: a cheap VPS (Hetzner CX11 ~€3.79/mo or DigitalOcean $6/mo) with Docker installed.** One `git pull && docker compose up --build -d` deploys updates.

---

### Development Workflow (local, without Docker)

For daily development, run services directly to keep the feedback loop fast:

```bash
# Terminal 1 — backend
cd backend && go run main.go

# Terminal 2 — frontend
cd frontend && npm run dev
```

Use Docker only to verify production builds and for actual deployment.

---

### Image Size Estimates

| Image | Base | Final size (approx) |
|---|---|---|
| `busana_backend` | alpine:3.19 | ~25 MB |
| `busana_frontend` | nginx:1.25-alpine | ~35 MB |

Combined: ~60 MB total. Lean enough to deploy on the smallest VPS tier.
