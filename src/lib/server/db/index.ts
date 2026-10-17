import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import rawTariffsData from '$lib/data/official_tariffs.json';
import { COUNTRIES } from '$lib/calculator/tariffs';
import type { CountryCode } from '$lib/calculator/types';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
	fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'shopee_flexi.db');
let db: Database.Database;

try {
	db = new Database(DB_PATH);
	db.pragma('journal_mode = WAL');
} catch (e) {
	console.warn('Failed to open disk SQLite, falling back to in-memory database:', e);
	db = new Database(':memory:');
}

// Initialize tables
db.exec(`
	CREATE TABLE IF NOT EXISTS tariffs (
		country_code TEXT PRIMARY KEY,
		country_name TEXT NOT NULL,
		currency TEXT NOT NULL,
		version TEXT NOT NULL,
		effective_date TEXT NOT NULL,
		source_url TEXT NOT NULL,
		source_filename TEXT NOT NULL,
		verified INTEGER NOT NULL DEFAULT 1,
		verified_at TEXT NOT NULL,
		raw_rates_json TEXT NOT NULL,
		notes TEXT,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS tariff_audit_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		country_code TEXT NOT NULL,
		action TEXT NOT NULL,
		version_from TEXT,
		version_to TEXT,
		notes TEXT,
		timestamp TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS calculation_history (
		id TEXT PRIMARY KEY,
		product_name TEXT,
		sku TEXT,
		country_code TEXT NOT NULL,
		country_name TEXT NOT NULL,
		zone_code TEXT,
		zone_name TEXT,
		input_weight_g REAL NOT NULL,
		bracket_weight_g INTEGER NOT NULL,
		quantity INTEGER NOT NULL DEFAULT 1,
		currency TEXT NOT NULL,
		total_shipping REAL NOT NULL,
		buyer_paid_shipping REAL NOT NULL,
		seller_paid_shipping REAL NOT NULL,
		selling_price REAL,
		product_cost REAL,
		net_profit REAL,
		profit_margin_percent REAL,
		tariff_version TEXT NOT NULL,
		created_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS bulk_sessions (
		id TEXT PRIMARY KEY,
		file_name TEXT NOT NULL,
		total_rows INTEGER NOT NULL,
		successful_rows INTEGER NOT NULL,
		failed_rows INTEGER NOT NULL,
		summary_json TEXT NOT NULL,
		results_json TEXT,
		created_at TEXT NOT NULL
	);
`);

// Seed tariffs if empty
const countTariffs = db.prepare('SELECT COUNT(*) as cnt FROM tariffs').get() as { cnt: number };
if (countTariffs.cnt === 0) {
	console.log('Seeding initial official tariffs into SQLite database...');
	const insertTariff = db.prepare(`
		INSERT INTO tariffs (
			country_code, country_name, currency, version, effective_date,
			source_url, source_filename, verified, verified_at, raw_rates_json, notes, updated_at
		) VALUES (
			@country_code, @country_name, @currency, @version, @effective_date,
			@source_url, @source_filename, @verified, @verified_at, @raw_rates_json, @notes, @updated_at
		)
	`);

	const insertAudit = db.prepare(`
		INSERT INTO tariff_audit_logs (country_code, action, version_from, version_to, notes, timestamp)
		VALUES (@country_code, @action, @version_from, @version_to, @notes, @timestamp)
	`);

	const seedTime = new Date().toISOString();
	const rawTariffs = (rawTariffsData as any).tariffs;

	for (const code of ['BN', 'PH', 'MY', 'SG', 'TH'] as CountryCode[]) {
		const meta = COUNTRIES[code];
		const rates = rawTariffs[code]?.rates || [];

		insertTariff.run({
			country_code: meta.countryCode,
			country_name: meta.countryName,
			currency: meta.currency,
			version: meta.version,
			effective_date: meta.effectiveDate,
			source_url: meta.sourceUrl,
			source_filename: meta.sourceFileName,
			verified: 1,
			verified_at: seedTime,
			raw_rates_json: JSON.stringify(rates),
			notes: meta.notes || '',
			updated_at: seedTime
		});

		insertAudit.run({
			country_code: meta.countryCode,
			action: 'INITIAL_SEED',
			version_from: null,
			version_to: meta.version,
			notes: 'Ekstraksi otomatis 3.000 baris tarif resmi dari dokumen Shopee FLEXI Ekspor.',
			timestamp: seedTime
		});
	}
	console.log('Initial official tariffs seeded successfully!');
}

// Repository functions
export const dbRepository = {
	getAllTariffs(): any[] {
		const rows = db.prepare('SELECT country_code, country_name, currency, version, effective_date, source_url, source_filename, verified, verified_at, notes, updated_at FROM tariffs ORDER BY country_name ASC').all() as any[];
		return rows;
	},

	getTariffByCountry(countryCode: string) {
		const row = db.prepare('SELECT * FROM tariffs WHERE country_code = ?').get(countryCode.toUpperCase()) as any;
		if (row && row.raw_rates_json) {
			row.rates = JSON.parse(row.raw_rates_json);
			delete row.raw_rates_json;
		}
		return row;
	},

	saveTariff(data: {
		countryCode: string;
		version: string;
		effectiveDate: string;
		sourceUrl: string;
		sourceFileName: string;
		rates: any[];
		notes?: string;
	}) {
		const now = new Date().toISOString();
		const current = db.prepare('SELECT version FROM tariffs WHERE country_code = ?').get(data.countryCode) as any;

		db.prepare(`
			UPDATE tariffs SET
				version = @version,
				effective_date = @effectiveDate,
				source_url = @sourceUrl,
				source_filename = @sourceFileName,
				verified = 1,
				verified_at = @now,
				raw_rates_json = @rawRatesJson,
				notes = @notes,
				updated_at = @now
			WHERE country_code = @countryCode
		`).run({
			countryCode: data.countryCode,
			version: data.version,
			effectiveDate: data.effectiveDate,
			sourceUrl: data.sourceUrl,
			sourceFileName: data.sourceFileName,
			rawRatesJson: JSON.stringify(data.rates),
			notes: data.notes || '',
			now
		});

		db.prepare(`
			INSERT INTO tariff_audit_logs (country_code, action, version_from, version_to, notes, timestamp)
			VALUES (?, 'PUBLISH', ?, ?, ?, ?)
		`).run(data.countryCode, current?.version || null, data.version, data.notes || 'Pembaruan tarif resmi.', now);

		return true;
	},

	getAuditLogs(countryCode?: string): any[] {
		if (countryCode) {
			return db.prepare('SELECT * FROM tariff_audit_logs WHERE country_code = ? ORDER BY id DESC LIMIT 50').all(countryCode) as any[];
		}
		return db.prepare('SELECT * FROM tariff_audit_logs ORDER BY id DESC LIMIT 50').all() as any[];
	},

	saveCalculationHistory(calc: any) {
		const id = calc.id || `calc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		db.prepare(`
			INSERT INTO calculation_history (
				id, product_name, sku, country_code, country_name, zone_code, zone_name,
				input_weight_g, bracket_weight_g, quantity, currency, total_shipping,
				buyer_paid_shipping, seller_paid_shipping, selling_price, product_cost,
				net_profit, profit_margin_percent, tariff_version, created_at
			) VALUES (
				@id, @product_name, @sku, @country_code, @country_name, @zone_code, @zone_name,
				@input_weight_g, @bracket_weight_g, @quantity, @currency, @total_shipping,
				@buyer_paid_shipping, @seller_paid_shipping, @selling_price, @product_cost,
				@net_profit, @profit_margin_percent, @tariff_version, @created_at
			)
		`).run({
			id,
			product_name: calc.productName || '',
			sku: calc.sku || '',
			country_code: calc.countryCode,
			country_name: calc.countryName,
			zone_code: calc.zoneCode || 'ALL',
			zone_name: calc.zoneName || 'Standar',
			input_weight_g: calc.inputWeightG,
			bracket_weight_g: calc.bracketWeightG,
			quantity: calc.quantity || 1,
			currency: calc.currency,
			total_shipping: calc.totalShipping,
			buyer_paid_shipping: calc.buyerPaidShipping,
			seller_paid_shipping: calc.sellerPaidShipping,
			selling_price: calc.pricing?.sellingPrice || null,
			product_cost: calc.pricing?.productCost || null,
			net_profit: calc.pricing?.netProfit || null,
			profit_margin_percent: calc.pricing?.profitMarginPercent || null,
			tariff_version: calc.tariffVersion,
			created_at: calc.calculatedAt || new Date().toISOString()
		});
		return id;
	},

	getCalculationHistory(limit: number = 50, offset: number = 0): any[] {
		return db.prepare(`
			SELECT * FROM calculation_history
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?
		`).all(limit, offset) as any[];
	},

	deleteCalculationHistory(id: string) {
		return db.prepare('DELETE FROM calculation_history WHERE id = ?').run(id);
	},

	clearAllHistory() {
		db.prepare('DELETE FROM calculation_history').run();
		db.prepare('DELETE FROM bulk_sessions').run();
		return true;
	},

	saveBulkSession(session: {
		id: string;
		fileName: string;
		totalRows: number;
		successfulRows: number;
		failedRows: number;
		summary: any;
		results?: any[];
	}) {
		db.prepare(`
			INSERT INTO bulk_sessions (
				id, file_name, total_rows, successful_rows, failed_rows, summary_json, results_json, created_at
			) VALUES (
				@id, @fileName, @totalRows, @successfulRows, @failedRows, @summaryJson, @resultsJson, @createdAt
			)
		`).run({
			id: session.id,
			fileName: session.fileName,
			totalRows: session.totalRows,
			successfulRows: session.successfulRows,
			failedRows: session.failedRows,
			summaryJson: JSON.stringify(session.summary),
			resultsJson: session.results ? JSON.stringify(session.results) : null,
			createdAt: new Date().toISOString()
		});
		return session.id;
	},

	getBulkSessions(limit: number = 20) {
		const rows = db.prepare(`
			SELECT id, file_name, total_rows, successful_rows, failed_rows, summary_json, created_at
			FROM bulk_sessions
			ORDER BY created_at DESC
			LIMIT ?
		`).all(limit) as any[];

		return rows.map((r) => ({
			...r,
			summary: JSON.parse(r.summary_json)
		}));
	},

	getBulkSessionById(id: string) {
		const row = db.prepare('SELECT * FROM bulk_sessions WHERE id = ?').get(id) as any;
		if (row) {
			row.summary = JSON.parse(row.summary_json);
			if (row.results_json) {
				row.results = JSON.parse(row.results_json);
			}
		}
		return row;
	},

	deleteBulkSession(id: string) {
		return db.prepare('DELETE FROM bulk_sessions WHERE id = ?').run(id);
	},

	getDashboardStats() {
		const singleCount = (db.prepare('SELECT COUNT(*) as count FROM calculation_history').get() as any).count;
		const bulkSessionsCount = (db.prepare('SELECT COUNT(*) as count FROM bulk_sessions').get() as any).count;
		const bulkRowsCount = (db.prepare('SELECT SUM(successful_rows) as count FROM bulk_sessions').get() as any).count || 0;
		const totalProductsCalculated = singleCount + bulkRowsCount;

		const recentCalculations = db.prepare(`
			SELECT id, product_name, sku, country_code, country_name, input_weight_g, total_shipping, seller_paid_shipping, currency, created_at
			FROM calculation_history
			ORDER BY created_at DESC
			LIMIT 5
		`).all() as any[];

		const recentBulkSessions = this.getBulkSessions(5);

		return {
			totalProductsCalculated,
			singleCalculationsCount: singleCount,
			bulkSessionsCount,
			recentCalculations,
			recentBulkSessions
		};
	}
};

export default db;
