# BillPulse75

BillPulse75 scans Vietnamese bills and receipts with Google Gemini, then tracks item prices over time in VND.

## Tech stack

- Next.js 16 and React 19
- Payload CMS 3 with PostgreSQL (Neon)
- Tailwind CSS 4, Chart.js, and `lucide-react`
- Google Gemini via `@google/genai`

## Setup

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
cp .env.example .env
pnpm seed
pnpm dev
```

Set these environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Payload |
| `PAYLOAD_SECRET` | Yes | Secret used to sign Payload sessions |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model; defaults to `gemini-3.8-flash` |

On the first visit to the Payload admin screen, create the first admin account. Keep the admin screen URL in private team documentation.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js in development |
| `pnpm build` | Apply Payload migrations and build Next.js |
| `pnpm start` | Start the production Next.js server |
| `pnpm lint` | Type-check with TypeScript |
| `pnpm seed` | Seed categories, lookups, AI settings, and sample bills |
| `pnpm payload` | Run a Payload CLI command |
| `pnpm generate:types` | Generate Payload TypeScript types |
| `pnpm generate:importmap` | Generate the Payload admin import map |
| `pnpm migrate:create` | Create a Payload migration |
| `pnpm migrate:legacy` | Import legacy data from a configured non-production copy |

## Application behavior

Users can register, scan receipts, review extracted items, save bills, compare price history, inspect categories, export data, and request Vietnamese inflation insights. Bills are isolated by account. New accounts receive the seeded sample bills.

Receipt previews are kept only for the current browser session; uploaded files are not stored.
