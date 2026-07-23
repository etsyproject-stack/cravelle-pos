# 🍟 Cravelle POS — Fast Food Restaurant Point of Sale

A complete, production-ready POS system for fast food restaurants.
**Laravel 12 REST API + React (Vite) + Tailwind CSS + MySQL + Sanctum.**

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full architecture, folder
structure, domain model and API surface.

## Features

| Module | Highlights |
|---|---|
| **Dashboard** | Today's/monthly sales, orders, revenue, recent orders |
| **POS** | Touch-friendly grid, category sidebar, search, variants/sizes, add-ons, per-item notes, discounts (% / fixed), coupons, tax, hold & resume orders, split bill, multiple payment methods, cash change, printable receipt, auto KOT |
| **Products** | Categories, products, variants, add-ons, stock management with low-stock alerts |
| **Orders** | Full lifecycle: pending → preparing → ready → completed / cancelled, KOT & receipt reprint |
| **Kitchen (KDS)** | Three-column live display with elapsed-time badges, auto-refresh, one-tap advance |
| **Customers** | Walk-in + database, loyalty points with transaction history |
| **Staff** | Admin / Manager / Cashier / Kitchen roles |
| **Reports** | Daily sales (by hour, by payment method), monthly sales, product sales, profit (revenue − COGS − expenses) |
| **Expenses** | Categorised expense tracking per month |
| **Coupons** | Percent/fixed, min order, usage limits, expiry, POS validation |
| **Settings** | Restaurant details, tax, currency, timezone, receipt printer & footer, loyalty rate |
| **Roles & permissions** | Enforced server-side (middleware) and client-side (route guards) |

## Requirements

- PHP 8.2+ · Composer
- Node.js 20+ · npm
- MySQL 8 (SQLite also works out of the box for local dev)

## Getting started

### 1. Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env          # pre-configured for MySQL (cravelle_pos database)
php artisan key:generate

# create the database first: CREATE DATABASE cravelle_pos;
php artisan migrate --seed    # tables + dummy menu, users, customers, demo orders

php artisan serve             # http://localhost:8000
```

> Tip: for a zero-setup local run, set `DB_CONNECTION=sqlite` in `.env`
> and run `touch database/database.sqlite` before migrating.

### 2. Frontend (React SPA)

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api → :8000)
```

### 3. Login

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cravelle.test` | `password` |
| Manager | `manager@cravelle.test` | `password` |
| Cashier | `cashier@cravelle.test` | `password` |
| Kitchen | `kitchen@cravelle.test` | `password` |

## Production build

```bash
cd frontend && npm run build   # outputs frontend/dist
```

Serve `frontend/dist` from any static host / CDN / nginx and point it at the
Laravel API (same origin via reverse proxy, or configure CORS + an absolute
API base URL in `frontend/src/api/client.js`).

## Tech notes

- **Clean architecture**: thin controllers → services (business logic) →
  repositories (interfaces bound in `RepositoryServiceProvider`) → Eloquent.
- **Server-authoritative pricing**: order totals, discounts, coupons, tax and
  loyalty are always recomputed on the server from the catalog.
- **Snapshots**: order items store product/variant/add-on names and prices at
  the time of sale, so history survives menu edits.
- **Stock**: tracked products are decremented on sale and restored on
  cancellation, all inside DB transactions.
