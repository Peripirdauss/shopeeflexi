# Shopee FLEXI Ekspor Shipping Fee Calculator 🚀🇮🇩

A high-performance, production-ready web application designed for Indonesian Shopee sellers to independently calculate, analyze, simulate, and bulk-process **Shopee FLEXI Export Shipping Fees** across all 5 official Southeast Asian destination countries: **Singapore (SG)**, **Malaysia (MY)**, **Thailand (TH)**, **Philippines (PH)**, and **Brunei Darussalam (BN)**.

Built with **SvelteKit 2 + Svelte 5 (Runes)**, **TypeScript**, **Tailwind CSS**, and **SQLite (better-sqlite3)**.

---

## 🌟 Key Capabilities & Features

### 1. 100% Official Tariff Fidelity
- Extracted and verified from official Shopee Seller Education PDF documentation.
- Covers **15,000 weight brackets** (10g to 30,000g in 10g intervals) with zero synthetic or mock rates.
- Strict multi-currency segregation:
  - **Singapore (SG)**: SGD (S$)
  - **Malaysia (MY)**: MYR (RM)
  - **Thailand (TH)**: THB (฿)
  - **Philippines (PH)**: PHP (₱)
  - **Brunei (BN)**: MYR (Shopee FLEXI standard)
- Destination-specific logistics rules:
  - **Singapore**: Logistics parcel limit notice for checkout exceeding 25kg (25,000g).
  - **Malaysia**: Multi-zone support (West Malaysia vs. East Malaysia).
  - **Thailand**: Multi-zone support (Zone A vs. Zone B).
  - **Philippines**: Multi-zone support (Zone A Metro Manila vs. Zone B/C/D Provincial).
  - **Brunei**: Fixed buyer-paid rate of 25.00 MYR.

### 2. Single-Product Shipping Calculator (`/calculator`)
- Real-time calculation with O(1) weight-bracket lookup.
- Immediate visual fee breakdown:
  - **Ongkos Kirim Dibayar Pembeli** (Buyer-Paid Shipping Fee)
  - **Ongkos Kirim Dibayar Penjual** (Seller-Paid Shipping Fee)
  - **Total Biaya Pengiriman** (Total Shipping Cost)
- Quantity multiplier, bracket ceiling transparency (`Math.ceil(w/10)*10`), and direct persistence to SQLite calculation history.

### 3. Bulk Excel & CSV Engine (`/bulk`)
- Supports `.xlsx`, `.xls`, and `.csv` files up to **10,000 rows**.
- **Auto-Header Detection**: Tolerant heuristic mapping for Indonesian (`Nama Produk`, `SKU`, `Berat (g)`, `Negara`, `Zona`, `Harga Jual`) and English columns (`Product Name`, `Weight`, `Country`, `Zone`, `Price`).
- **Interactive Column Mapping**: Manual re-mapping dropdown with live preview of the first 3 rows.
- **Strict Pre-Calculation Validation**: Catches missing country, negative weights, out-of-bounds (>30kg), invalid zones, and unparsable numeric values while preserving original spreadsheet row numbers.
- **Chunked Processing**: Non-blocking asynchronous calculation that keeps the UI responsive.
- **Segregated Multi-Currency Summaries**: Displays separate financial totals per currency (never summing different currencies together).
- **Multi-Sheet Export**: Generates `.xlsx` workbooks with dedicated sheets (`Hasil Perhitungan`, `Ringkasan per Mata Uang`, `Baris Gagal`) and clean UTF-8 CSV exports.
- **Sample Template Generator**: One-click download of ready-to-use Excel/CSV templates with realistic multi-country sample data.

### 4. Profitability & Pricing Simulator (`/simulator`)
- Real-time margin and break-even analysis:
  - Target margin % solver.
  - Recommended minimum selling price calculation.
  - Net profit after product COGS, seller-paid shipping, and platform commissions.
  - Color-coded profit margin indicators (profitable vs break-even vs loss-making).

### 5. Tariff Database & Audit Log Viewer (`/tariffs`)
- Searchable database of all 15,000 weight brackets across all 5 countries.
- Filter by weight, country, and zone with instant pagination.
- Official PDF source links and version audit trail tracking changes and verification timestamps.

### 6. Calculation History & Data Privacy (`/history` & `/settings`)
- Filter and search past single calculations and bulk import sessions.
- Export calculation history to CSV.
- Fully local SQLite storage (`data/calculator.db`) with zero external analytics or data exfiltration.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | SvelteKit 2.16 + Svelte 5 | Svelte 5 Runes (`$state`, `$derived`, `$props`, `$effect`) |
| **Language** | TypeScript 5 | Strict typing, zero any in domain logic |
| **Styling** | Tailwind CSS 3.4 | Custom theme tokens, dark mode with `class` strategy |
| **Database** | SQLite + `better-sqlite3` | WAL mode, auto-migration, automatic tariff seeding |
| **Spreadsheets** | `exceljs` & `papaparse` | Memory-efficient streaming, multi-sheet workbook generation |
| **Testing** | Vitest 2.1 | 29 passing unit and integration tests |

---

## 📁 Project Structure

```
export/
├── data/
│   └── calculator.db           # SQLite database (WAL mode, auto-seeded)
├── src/
│   ├── lib/
│   │   ├── calculator/
│   │   │   ├── types.ts        # TypeScript domain interfaces & country metadata
│   │   │   ├── tariffs.ts      # O(1) tariff bracket lookup tables & formatters
│   │   │   ├── engine.ts       # Deterministic calculation engine & simulator
│   │   │   └── engine.test.ts  # 25 Vitest tests for engine & edge cases
│   │   ├── data/
│   │   │   └── official_tariffs.json  # 15,000 official rows extracted from Shopee PDFs
│   │   ├── file-processing/
│   │   │   ├── parser.ts       # XLSX/CSV parsing & heuristic column mapping
│   │   │   ├── validator.ts    # Strict row validation preserving row numbers
│   │   │   ├── processor.ts    # Chunked batch processing & segregated currency aggregations
│   │   │   ├── exporter.ts     # Multi-sheet XLSX & CSV generator
│   │   │   ├── template.ts     # Downloadable import templates
│   │   │   └── processing.test.ts # Vitest tests for parser, validator & exporter
│   │   └── server/
│   │       └── db/             # SQLite repository & schema migrations
│   └── routes/
│       ├── +layout.svelte      # Responsive sidebar, mobile drawer, theme switcher
│       ├── +page.svelte        # Dashboard with quick actions & metric summaries
│       ├── calculator/         # Single calculation page
│       ├── bulk/               # 5-step bulk import wizard
│       ├── simulator/          # Pricing & profit simulator
│       ├── tariffs/            # Searchable tariff database
│       ├── history/            # Calculation log & bulk session history
│       ├── settings/           # Theme preferences & local database controls
│       └── api/                # REST endpoints for history, bulk sessions & tariffs
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher

### Installation & Run

1. **Clone or navigate to the directory**:
   ```bash
   cd /Users/mac/Documents/export
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. **Run TypeScript Check & Tests**:
   ```bash
   npm run check    # 0 errors, 0 warnings
   npm run test     # 29 passed
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🧪 Test Coverage Summary

- **29 Automated Vitest Tests** across two test suites:
  - `src/lib/calculator/engine.test.ts` (25 tests):
    - Exact bracket rounding (`Math.ceil(weight / 10) * 10`).
    - Lower boundary conditions (minimum weight 10g).
    - Upper boundary conditions (30,000g max weight, >30kg throws validation error).
    - Multi-zone pricing (Malaysia East/West, Thailand Zone A/B, Philippines Zone A/B/C/D).
    - Buyer vs. seller fee decomposition.
    - Singapore parcel limit warning (>25kg).
    - Multi-quantity calculations.
    - Profitability, margin, and break-even pricing analysis.
  - `src/lib/file-processing/processing.test.ts` (4 tests):
    - Heuristic column header detection (Indonesian & English).
    - Input row validation & error reporting.
    - Chunked bulk execution with currency segregation.
    - XLSX and CSV multi-sheet export generation.

---

## 🔒 Privacy & Compliance
- **100% Client/Self-Hosted**: All calculations occur locally; no product data, pricing, or sales volumes are transmitted to any third party.
- **Zero Account Linkage**: Does not require Shopee login credentials or API keys.
- **Auditability**: Every calculation records the exact tariff version and timestamp used.
