# BillPulse75

Scan Vietnamese bills and receipts (photos or PDFs) with Google Gemini, then track how the price of each item you buy changes over time, in VND.

Each person signs in with their own account, and their bills are stored in PostgreSQL. Upload a receipt from WinMart, Bách Hóa Xanh, Co.opmart, Highlands Coffee, EVN or anywhere else. Gemini extracts the merchant, date, payment method and every line item. You review and edit the result, then save it. Once saved, the app compares each item with your earlier purchases and flags which ones went up or down in price.

## Features

- **Accounts**: register with a username, email and password, then log in with your username. Usernames and emails are unique. Every account only sees its own bills, and new accounts start with a set of sample bills.
- **AI bill scanning**: upload an image or PDF, and Gemini extracts structured data. It handles Vietnamese number formats (`35.000`, `35 000`) and gives each product a standard name so the same product matches across bills.
- **Review before saving**: edit quantities and prices, or remove items, before a bill is saved. Each item shows its price change compared with your history.
- **Price tracking per item**: groups the same product across bills, even when names differ slightly, and tracks current and previous price, change in VND and %, min, max, average, last store and total spent.
- **Dashboard and watchlist**: shows spending and the biggest price increases and decreases.
- **Item deep dive**: shows the full price history of a single product.
- **AI price insights**: Gemini writes a short analysis of your price changes in Vietnamese, with shopping tips.
- **Data export**: download all your bills as JSON. You can also replace your bills with the sample set at any time.

The interface is in Vietnamese.

## Tech stack

| Layer    | Tools                                                       |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, `motion`, `lucide-react`    |
| Charts   | Chart.js 4 via `react-chartjs-2` (`src/components/charts/`) |
| Backend  | Express, run with `tsx`, Vite middleware in development     |
| Database | PostgreSQL (tested on Neon), `pg` driver                    |
| AI       | `@google/genai`, model set by `GEMINI_MODEL`                |

## Getting started

### Prerequisites

- Node.js 22+
- pnpm
- A [Gemini API key](https://aistudio.google.com/apikey)
- A PostgreSQL 13+ database (for example a free [Neon](https://neon.tech) project)

### Setup

```bash
pnpm install
cp .env.example .env   # then set GEMINI_API_KEY and DATABASE_URL
pnpm db:migrate        # creates the tables (safe to re-run)
pnpm dev
```

Open http://localhost:3000 and register an account.

### Environment variables

| Variable         | Required | Default            | Description                            |
| ---------------- | -------- | ------------------ | -------------------------------------- |
| `GEMINI_API_KEY` | Yes      | –                  | Used by the server to call Gemini      |
| `GEMINI_MODEL`   | No       | `gemini-3.8-flash` | Gemini model for scanning and analysis |
| `DATABASE_URL`   | Yes      | –                  | PostgreSQL connection string           |
| `PORT`           | No       | `3000`             | Port the Express server listens on     |
| `NODE_ENV`       | No       | –                  | Set to `production` to serve `dist/`   |

### Scripts

| Command           | What it does                                                   |
| ----------------- | -------------------------------------------------------------- |
| `pnpm dev`        | Starts Express with Vite middleware (hot reload)               |
| `pnpm build`      | Builds the frontend into `dist/`                               |
| `pnpm start`      | Starts the server (set `NODE_ENV=production` to serve `dist/`) |
| `pnpm lint`       | Type-checks with `tsc --noEmit`                                |
| `pnpm db:migrate` | Applies `db/schema.sql` to `DATABASE_URL`                      |
| `pnpm clean`      | Removes build output                                           |

For production, build first and then run the server:

```bash
pnpm build
NODE_ENV=production pnpm start
```

## How it works

```
Browser (React)                         Server (Express)              Gemini
──────────────                          ────────────────              ──────
BillScannerView ── POST /api/scan-bill ──▶ prompt + file ───────────▶ extract JSON
       ◀──────────── cleaned bill JSON ◀── fix prices ◀───────────────
       │
       ▼ save
POST /api/bills ──▶ PostgreSQL (bills, bill_items, products)
       │
       ▼
computePriceHistoryMap → Dashboard / Watchlist / Deep dive

AIInsightsModal ── POST /api/analyze-inflation ──▶ price changes ────▶ Vietnamese summary
```

1. **Scan**: the browser sends the file as base64 to `/api/scan-bill`. The server asks Gemini for strict JSON, then cleans it up: it fills in a missing unit price or total and rounds prices to whole VND.
   Every route except `/api/health` and login/register needs a session. Logging in sets an httpOnly cookie, and the database only stores a SHA-256 hash of its token. Passwords are hashed with scrypt.

2. **Review**: `enrichBillItemsWithTrends` compares the new items with earlier bills, so you see price changes before saving.
3. **Track**: on every change, `computePriceHistoryMap` replays all bills from oldest to newest and groups items by product. Two names count as the same product if they are equal after removing accents and casing, or if their words overlap by more than 80%.
4. **Analyze**: `/api/analyze-inflation` sends up to 20 price changes to Gemini and returns a summary, observations and recommendations.

### API

| Method | Route                     | Body                                          | Returns                            |
| ------ | ------------------------- | --------------------------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`      | `{ displayName?, username, email, password }` | `{ user }` + session cookie        |
| POST   | `/api/auth/login`         | `{ username, password }`                      | `{ user }` + session cookie        |
| POST   | `/api/auth/logout`        | –                                             | `{ success }`                      |
| GET    | `/api/auth/me`            | –                                             | `{ user }`                         |
| GET    | `/api/bills`              | –                                             | `{ bills }`                        |
| POST   | `/api/bills`              | `Bill`                                        | `{ bill }` (IDs set by the server) |
| DELETE | `/api/bills/:id`          | –                                             | `{ success }`                      |
| POST   | `/api/bills/reset-sample` | –                                             | `{ bills }`                        |
| POST   | `/api/scan-bill`          | `{ fileBase64, mimeType, fileName? }`         | `{ success, bill }`                |
| POST   | `/api/analyze-inflation`  | `{ itemsComparison: [...] }`                  | `{ success, analysis }`            |
| GET    | `/api/health`             | –                                             | `{ status, timestamp }`            |

Request bodies can be up to 50 MB, to allow image and PDF uploads.

## Project structure

```
server.ts                  Express server, Gemini endpoints, Vite/static serving
server/
  db.ts                    PostgreSQL connection pool
  auth.ts                  Register, login, logout, sessions, requireAuth
  bills.ts                 Bill storage and per-user sample data
db/schema.sql              Tables and price-trend views
scripts/db/migrate.ts      Applies the schema
src/
  App.tsx                  Root component: tabs, bill state, localStorage sync
  components/
    DashboardView.tsx      Spending overview and biggest price changes
    BillScannerView.tsx    Upload, demo bills, review and edit before saving
    PriceWatchlistView.tsx All tracked items and their price status
    BillsHistoryView.tsx   Saved bills, delete
    ItemDeepDiveView.tsx   Price history of one item
    BillDetailModal.tsx    Single bill details
    AIInsightsModal.tsx    Gemini price analysis
    AuthScreen.tsx         Login and register screen
    Navbar.tsx             Navigation, export and reset actions
  data/sampleBills.ts      Sample bills and quick demo bills
  types/bill.ts            Bill, BillItem, PriceTrendSummary and other types
  utils/
    priceTracker.ts        Product matching and price trend calculation
    currency.ts            VND and percent formatting
    api.ts                 Fetch helpers for the auth and bills API
```

## Limitations

- **Receipt images aren't saved.** The preview only lasts for the current session. The `bills.file_url` column is there for when uploads go to object storage.
- **No password reset or email verification yet**, and login attempts aren't rate-limited.
- **Product matching can be wrong.** The word-overlap rule can merge different sizes of the same product, for example a 1L carton and a 180ml carton.
- **Scanning isn't rate-limited per account.** Any registered user can use up your Gemini quota.
- **Matching gets slower as history grows.** Each item is compared against every product seen so far.
