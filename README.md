# Ledger — Mini AI Business Intelligence Assistant

A small sales analytics application built for the AI-Assisted Development Challenge (GET selection). React frontend, Express API, and SQLite database. All five example analyses are implemented with supporting figures and visible SQL.

## Quick start

Requires **Node.js 22.13+ (Node 24 LTS recommended)** and npm. No Python or external database server is required.

```bash
npm ci
npm test
npm run build
npm start
```

Open **http://localhost:3000**. Keep the terminal running. The server binds to localhost by default. It serves both the production UI and API.

Development uses two terminals: `npm run dev:server` and `npm run dev`. Open the Vite URL (usually http://localhost:5173); `/api` requests are proxied to Express on port 3000.

## AI mode — read before submitting

Default mode is **Deterministic demo**: a deliberately narrow, AI-assisted-in-development rule interpreter. It is **not a running LLM**. This lets reviewers exercise the analytics without credentials or model downloads. To demonstrate actual runtime AI, enable the included **Ollama** adapter:

1. Install Ollama from https://ollama.com and start it.
2. Run `ollama pull llama3.2`.
3. Copy `.env.example` to `.env` and set `AI_PROVIDER=ollama` (uncomment the line).
4. Restart the backend with `npm start`.

The UI identifies the selected mode. The LLM returns a JSON intent, not SQL or numbers. Its output must pass schema checks and agree with the narrow semantic guard before a fixed query executes. A failed or unavailable model yields an explicit error, not a fabricated answer. The live model was not available in the development environment; adapter behavior is covered by mocked success, invalid-output, conflicting-output, and outage tests. **Enable and verify Ollama locally before presenting this as a live AI demo.**

## Try these questions

- What is the total revenue?
- Which product generated the highest revenue?
- What is the monthly revenue trend?
- Which region generated the highest sales?
- How did revenue change between January and June?

Comparisons accept named months (default year 2026) or `YYYY-MM`. Months are compared in the order mentioned. Other queries cover the whole dataset. Unsupported filters and ambiguous/out-of-scope questions return HTTP 422.

## Data and accounting policy

`data/sales.csv` is transcribed from the sales table on pages 4–6 of the problem statement, per the user's instruction to use that table as the reference. It preserves all 51 transaction rows, including anomalies. No additional reading of the separately uploaded CSV was used for this implementation.

- Dates: DD-MM-YYYY, converted to ISO dates after calendar validation.
- Money: integer minor units in SQLite; displayed in source currency units. No currency symbol is assumed.
- Net revenue: `quantity × unit_price − discount_amount`. Discount is treated as a **transaction-level** discount.
- Completed, valid transactions count toward revenue. Returned transactions are stored but excluded, not subtracted from other sales.
- Nonpositive quantities, missing/invalid prices, invalid dates, duplicate IDs, invalid discounts and missing required fields are rejected and reported. Missing values are never guessed.
- TXN0033: returned, excluded from revenue. TXN0034: zero quantity, rejected. TXN0051: missing unit price, rejected.
- 51 source rows = 48 included + 1 returned + 2 rejected.

SQLite is in memory and rebuilt from the CSV on each server start. This is intentional for a small immutable submission dataset; no persistence service is needed. The import switches the connection to `PRAGMA query_only=ON` after loading.

## Reference results

| Metric | Result |
|---|---:|
| Gross revenue of valid completed transactions | 1,443,700 |
| Discounts | 4,500 |
| Net revenue | 1,439,200 |
| Top product | Monitor: 473,000 |
| Top region | South: 411,200 |
| January | 210,250 |
| February | 234,600 |
| March | 223,900 |
| April | 240,700 |
| May | 318,500 |
| June | 211,250 |
| January → June change | +1,000 (+0.48%) |

## API

- `GET /api/health` → health status.
- `GET /api/overview` → totals, monthly trend, import audit and configured mode.
- `POST /api/ask` with `{"question":"What is the total revenue?"}` → `answer`, `rows`, `comparison`, `sql`, `parameters`, `intent`, `mode`, `assumptions`.

Errors: 400 invalid request/JSON; 413 oversized body; 422 unsupported question/plan or missing comparison data; 503 unavailable AI; 500 generic server failure. Question length is 1–500 characters; request size is limited to 4 KB. No endpoint accepts or executes user SQL.

## Tests and verification

`npm test` runs 18 automated tests: five analysis types, import audit, missing comparison months, invalid requests/JSON, unsupported questions, destructive input and SQLite write protection, model validation, mocked Ollama responses/outage, zero baseline, duplicates/invalid dates, empty dataset and revenue ties.

Verified during development: **18/18 passed**, production build passed. A separate Python Decimal calculation was used only as an independent development check of the six monthly totals (Python is not part of the application). Live Ollama and interactive browser QA were unavailable; see `docs/VALIDATION.md`.

## Submission contents

- `src/`: React UI, responsive layout, charts, supporting table and SQL disclosure.
- `server/`: Express API, CSV validation, SQLite, question interpretation, analytics.
- `tests/`: automated tests.
- `docs/ARCHITECTURE.md`: architecture and tradeoffs.
- `docs/AI_DEVELOPMENT.md`: AI use, debugging and improvements.
- `docs/DEMO.md`: short demonstration and interview walkthrough.
- `.github/workflows/ci.yml`: tests and build on push/PR.

## Known limitations

This is a bounded prototype, not an unrestricted text-to-SQL chatbot. Rule coverage is intentionally narrow and can reject valid paraphrases; no conversational memory, arbitrary filters, forecasting, profit or units-sold analytics are supported. The semantic guard also bounds LLM mode to supported questions. There is no authentication, rate limiting, file-upload API, multi-user tenancy, deployment, or large-data support. A model response matching the schema is not itself proof of correctness; agreement with the semantic guard and deterministic computation are the safeguards. The title 'sales' is interpreted as net revenue, not quantity. A missing month is distinct from zero revenue; percentage change from a zero baseline is undefined. The font is optional and falls back to system fonts offline.
