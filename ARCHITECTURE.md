# Cravelle POS — Architecture & Folder Structure

A production-ready Fast Food Restaurant POS system.

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Backend   | Laravel 12 (PHP 8.4), RESTful JSON API      |
| Auth      | Laravel Sanctum (token-based, SPA-friendly) |
| Database  | MySQL 8 (SQLite for local testing)          |
| Frontend  | React 18 + Vite + Tailwind CSS              |
| State     | React Context + hooks (cart, auth, settings)|
| Routing   | react-router-dom v6                         |

## Monorepo Layout

```
cravelle-pos/
├── ARCHITECTURE.md
├── README.md
├── backend/                        # Laravel 12 API
│   ├── app/
│   │   ├── Enums/                  # OrderStatus, PaymentMethod, PaymentStatus, ...
│   │   ├── Http/
│   │   │   ├── Controllers/Api/    # Thin controllers → delegate to Services
│   │   │   ├── Middleware/         # EnsureRole (role-based access)
│   │   │   ├── Requests/           # FormRequest validation classes
│   │   │   └── Resources/          # API Resources (JSON transformers)
│   │   ├── Models/                 # Eloquent models
│   │   ├── Repositories/
│   │   │   ├── Contracts/          # Repository interfaces (DIP)
│   │   │   └── Eloquent/           # Eloquent implementations
│   │   ├── Services/               # Business logic (order totals, KOT, loyalty…)
│   │   └── Providers/              # RepositoryServiceProvider bindings
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/                # Dummy categories, products, users, settings
│   └── routes/api.php              # Versioned API routes (/api/v1)
└── frontend/                       # React + Vite + Tailwind SPA
    ├── src/
    │   ├── api/                    # Axios client + typed endpoint modules
    │   ├── components/
    │   │   ├── ui/                 # Button, Card, Modal, Table, Badge, Input…
    │   │   ├── layout/             # AppLayout, Sidebar, Topbar
    │   │   └── pos/                # POS-specific widgets (ProductGrid, Cart…)
    │   ├── context/                # AuthContext, CartContext, SettingsContext
    │   ├── hooks/                  # useApi, useDebounce, usePrinter
    │   ├── pages/                  # One folder per module
    │   │   ├── auth/  dashboard/  pos/  products/  orders/
    │   │   ├── customers/  staff/  kitchen/  reports/
    │   │   ├── expenses/  coupons/  settings/
    │   └── utils/                  # money, date, receipt formatting
    └── index.html
```

## Backend: Clean Architecture Layers

```
Request → Route → Middleware(auth:sanctum, role) → FormRequest (validation)
        → Controller (thin) → Service (business rules, transactions)
        → Repository (interface → Eloquent impl) → Model → MySQL
        → API Resource (response shaping) → JSON
```

- **Controllers** never touch Eloquent directly; they call Services.
- **Services** own business logic: order totals, tax/discount math, stock
  deduction, loyalty accrual, KOT generation, hold/resume, split bill.
- **Repositories** abstract persistence behind interfaces, bound in
  `RepositoryServiceProvider` — swap implementations without touching logic.
- **Enums** give type-safe order/payment statuses.
- **SOLID**: single-purpose classes, interface-driven dependencies,
  constructor injection everywhere.

## Domain Model (ERD summary)

```
users (role: admin|manager|cashier|kitchen)
categories 1─* products 1─* product_variants
products *─* addons (product_addon pivot)
customers 1─* orders 1─* order_items 1─* order_item_addons
orders 1─* payments          (split-bill = multiple payments)
orders 1─1 kot (kitchen ticket)   orders *─1 coupons
held_orders (parked carts)   expenses   settings (key/value)
loyalty_transactions (earn/redeem history)
```

## Order Lifecycle

`pending → preparing → ready → completed` (or `cancelled` at any point
before completion). KDS consumes `pending|preparing|ready` and advances
status; POS/Orders pages see everything.

## API Surface (all under /api/v1, Sanctum-protected except /login)

| Area      | Endpoints                                                        |
|-----------|------------------------------------------------------------------|
| Auth      | POST /login, POST /logout, GET /me                               |
| Dashboard | GET /dashboard/stats                                             |
| Catalog   | CRUD /categories, /products, /addons; POST /products/{id}/stock  |
| POS       | POST /orders, POST /orders/{id}/payments, /hold-orders CRUD      |
| Orders    | GET /orders?status=…, PATCH /orders/{id}/status, KOT print data  |
| Kitchen   | GET /kitchen/orders, PATCH /kitchen/orders/{id}/advance          |
| Customers | CRUD /customers, loyalty balance + transactions                  |
| Staff     | CRUD /users (admin/manager only)                                 |
| Reports   | GET /reports/daily, /monthly, /products, /profit                 |
| Expenses  | CRUD /expenses                                                   |
| Coupons   | CRUD /coupons, POST /coupons/validate                            |
| Settings  | GET/PUT /settings                                                |

## Roles & Permissions

| Role    | Access                                                          |
|---------|-----------------------------------------------------------------|
| admin   | Everything                                                      |
| manager | Everything except user-role management                          |
| cashier | Dashboard, POS, Orders, Customers, Coupons (read)               |
| kitchen | Kitchen Display System only                                     |

Enforced server-side by `EnsureRole` middleware on route groups, and
client-side by role-aware navigation/route guards.
