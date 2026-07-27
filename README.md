# 🍟 Cravelle POS — Fast Food Restaurant Point of Sale

Point of sale for **Cravelle 2.0** — Shop # 18, Emirates Mall, Model Town, Multan.
**Laravel 12 REST API + React (Vite) + Tailwind CSS + MySQL + Sanctum.**
Prices in **PKR**. Works **online and offline**.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the design, domain model and API surface.

## Features

| Module | Highlights |
|---|---|
| **Dashboard** | Today's/monthly sales, orders, revenue, recent orders |
| **POS** | Touch grid, category sidebar, search, sizes/variants, add-ons, per-item notes, discounts, coupons, hold & resume, split bill, multiple payment methods, cash change, printable receipt, auto KOT |
| **Offline mode** | Keeps selling with no internet — menu cached on the till, sales queued locally and uploaded automatically on reconnect |
| **Products** | Categories, products, variants, add-ons, stock with low-stock alerts |
| **Orders** | pending → preparing → ready → completed / cancelled, KOT & receipt reprint |
| **Kitchen (KDS)** | Live three-column display, elapsed-time badges, one-tap advance |
| **Customers** | Walk-in + database, loyalty points (1 point per Rs 100 by default) |
| **Staff** | Admin / Manager / Cashier / Kitchen roles |
| **Reports** | Daily (by hour & payment method), monthly, product sales, profit |
| **Expenses** | Categorised expense tracking per month |
| **Coupons** | Percent/fixed, min order, usage limits, expiry — validated online *and* offline |
| **Settings** | Restaurant details, tax, currency & decimals, timezone, receipt printer & footer |

## Requirements

PHP 8.2+ · Composer · Node.js 20+ · MySQL 8 (Laragon on Windows bundles all of these).

## Setup (once)

```bash
git clone -b claude/fast-food-pos-system-0qwsnu https://github.com/etsyproject-stack/cravelle-pos.git
cd cravelle-pos

# Backend
cd backend
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed    # creates the database, staff logins and the live menu

# Frontend
cd ../frontend
npm install
```

`migrate --seed` loads **only real data**: staff logins, shop settings, the
Cravelle menu and the walk-in customer. Your sales figures start from your
first real order. For a populated demo (fake customers, coupons, expenses and
a month of orders — for training only) run:

```bash
php artisan db:seed --class=DemoDataSeeder
```

## Running it

**Windows:** double-click `start-pos.bat` — it starts both servers and opens
the POS. (Make sure Laragon is running first: *Menu → Preferences* → tick
*Run Laragon when Windows starts* and *Auto start all*.)

**Manually / other systems:** two terminals —

```bash
cd backend  && php artisan serve   # http://localhost:8000
cd frontend && npm run dev         # http://localhost:5173
```

## Logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cravelle.test` | `password` |
| Manager | `manager@cravelle.test` | `password` |
| Cashier | `cashier@cravelle.test` | `password` |
| Kitchen | `kitchen@cravelle.test` | `password` |

> Change these in **Staff** before going live.

## Offline mode — how it works

The POS is an installable app (PWA). In Chrome, open it and click the
**install** icon in the address bar to run it in its own window; on a tablet
use *Add to Home screen*.

- A **green "Online" / amber "Offline"** pill sits in the top bar. It reflects
  whether the server is genuinely reachable, not just whether wifi exists.
- While online the till quietly downloads the menu, customers, coupons and
  settings so it can run without a connection.
- **If the internet drops, keep selling.** The POS screen works, receipts
  print, and each sale is stored on the till marked *OFFLINE SALE — AWAITING
  UPLOAD*.
- When the connection returns, queued sales upload **automatically** (the pill
  shows how many are waiting; tap it to force a sync). Each carries a unique
  id, so a retry can never charge a customer twice, and each order keeps the
  time it was actually rung up — your daily report stays accurate.
- Dashboard, Orders, Reports and KDS need a connection and say so plainly.
  Only the till keeps trading.

**First sign-in must be online** (that is when the menu gets cached). After
that the same browser can sell offline.

## Menu & pricing notes

- Prices are taken from the printed menu and are **tax-inclusive**, so tax is
  set to **0%** in Settings. If you start billing GST separately, set the rate
  there and it will show on receipts.
- **Cost prices are 0.** Fill each product's *Cost* on the Products screen to
  make the **Profit report** meaningful — until then it treats all revenue as
  profit.
- Pizza extra toppings are separate add-ons per size (Small/Medium/Large)
  because the menu prices them differently per size.

## Production build

```bash
cd frontend && npm run build   # outputs frontend/dist (service worker included)
```

Serve `frontend/dist` behind the same origin as the API (or set an absolute
API base URL in `frontend/src/api/client.js` and enable CORS).
