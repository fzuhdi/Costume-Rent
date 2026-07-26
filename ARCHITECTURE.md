# Costume-Rent Architecture Document

This document outlines the technical design, database schema, API contracts, and engineering constraints of the Costume-Rent system.

## 1. Architecture Flow

```mermaid
sequenceDiagram
    participant S as Staff or Customer (Browser)
    participant F as Next.js Frontend
    participant B as Gin Backend (Go)
    participant D as SQLite DB

    S->>F: Access POS, select dates & costumes
    F->>B: POST /api/rents (Create Draft)
    B->>D: Verify availability & expire old drafts
    D-->>B: Confirmed Available
    B->>D: Save Draft Order & Items
    B-->>F: Return Draft ID (Inventory Locked)
    
    S->>F: Input Payment (DP/Full)
    F->>B: POST /api/rents/{id}/transactions
    B->>D: Save RentTransaction (CREDIT)
    B->>D: Update Order Status -> Booked/Rented
    B-->>F: Success Response
    F-->>S: Show Order Confirmation
```

## 2. Database Schema

```mermaid
erDiagram
    Client ||--o{ RentOrder : "places"
    User ||--o{ RentOrder : "creates"
    RentOrder ||--|{ RentOrderItem : "contains"
    Costume ||--o{ RentOrderItem : "included_in"
    RentOrder ||--o{ RentTransaction : "has_ledger"
    User ||--o{ RentTransaction : "logs"
    RentOrder ||--o{ ActivityLog : "audited_by"
    Region ||--o{ Costume : "has"
    Category ||--o{ Costume : "categorizes"
    Costume ||--o{ CostumeImage : "has_images"

    Client {
        uint ID PK
        string Name
        string Phone
        string Address
    }
    Costume {
        uint ID PK
        string Name
        string Description
        string Size
        uint RegionID FK
        uint CategoryID FK
        int RentalFee
        int TotalQuantity
        datetime AcquiredAt
        string CoverImage
    }
    Region {
        uint ID PK
        string Name
    }
    Category {
        uint ID PK
        string Name
    }
    CostumeImage {
        uint ID PK
        uint CostumeID FK
        string Path
    }
    RentOrder {
        uint ID PK
        uint ClientID FK
        string GuaranteeType
        datetime EventDate
        datetime PickupDate
        datetime ExpectedReturnDate
        datetime ActualReturnDate
        int TotalPaid
        string PaymentStatus
        bool HasSecurityItem
        string Status
        string Notes
        uint CreatedBy FK
    }
    RentOrderItem {
        uint ID PK
        uint RentOrderID FK
        uint CostumeID FK
        int Quantity
        int RentalFee
    }
    RentTransaction {
        uint ID PK
        uint RentOrderID FK
        string Type
        string Category
        int Amount
        string PaymentMethod
        string PaymentProof
        string Notes
        uint CreatedBy FK
    }
    User {
        uint ID PK
        string Name
        string Username
        string Email
        string Password
        string Role
    }
    ActivityLog {
        uint ID PK
        uint RentOrderID FK
        uint UserID FK
        string ActionType
        string OldValue
        string NewValue
        datetime Timestamp
    }
```

| Table | Purpose |
| :--- | :--- |
| `User` | Internal staff/admin accounts with authentication credentials and roles. |
| `Client` | Customer profiles (Name, Phone, Address). |
| `Costume` | Master inventory list detailing rental fee, size, quantity, region, category, and images. |
| `Region` / `Category` | Lookups for categorizing costumes by style or region. |
| `CostumeImage` | Stores multiple image paths for a single costume. |
| `RentOrder` | The core rental event tracking specific dates, statuses, guarantee types, and the creator/client. |
| `RentOrderItem` | The specific costumes and their quantities attached to a parent `RentOrder`. |
| `RentTransaction` | The accounting ledger tracking all financial exchanges (payments, fees) and methods/proofs. |
| `ActivityLog` | Immutable audit trail of status changes or modifications (old/new values) performed by users. |

## 3. API Endpoints

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/costumes` | Fetch catalogue, with optional date parameters to filter for availability. |
| `POST` | `/api/rents` | Create a new `draft` order (temporarily locking inventory). |
| `PUT` | `/api/rents/:id/status` | Advance the order state (`draft` -> `booked` -> `rented` -> `returned`). |
| `POST` | `/api/rents/:id/transactions` | Log a payment, late fee, or damage fee to the order's ledger. |
| `GET` | `/api/rents` | Fetch all orders for the Dashboard, POS, or Rent History views. |
| `GET` | `/api/stats/dashboard` | Fetch high-level KPIs and upcoming events for the calendar. |

## 4. Design & Technical Constraints
*   **High-Level Technology:** 
    *   **Frontend:** Next.js 16 App Router, React 19, and Tailwind CSS 4.
    *   **Customer component boundary:** shadcn/ui components and marketplace tokens are scoped to customer route layouts (`/`, `/catalogue`, `/costumes/*`, `/cart`, `/checkout`, `/orders/*`, and `/account/*`).
    *   **Admin component boundary:** HeroUI v3 providers and components remain scoped to `/admin` and the staff login. Marketplace components must not import HeroUI, and admin components must not import marketplace shadcn components.
    *   **Backend:** Go (1.25), Gin Web Framework, GORM, SQLite.
    *   **Why:** This stack provides extreme speed, compile-time safety, and minimal operational overhead on the backend via Go and SQLite. The frontend leverages modern component libraries (HeroUI) for rapid, beautiful UI development without re-inventing basic accessible components.
*   **Typography Rules:** 
    *   Sans: `Geist Mono, ui-monospace, monospace`
    *   Serif: `serif`
    *   Mono: `JetBrains Mono, monospace`
