import { describe, it, expect } from 'vitest';
import { autoDetectColumnMapping } from './parser';
import { validateBulkRow, validateAllRows } from './validator';
import { processBulkCalculations } from './processor';
import { exportResultsToCsv, exportResultsToXlsx } from './exporter';
import { SAMPLE_ROWS } from './template';

describe('File Processing & Bulk Workflow', () => {
	it('auto-detects Indonesian and English column headers correctly', () => {
		const headers = [
			'SKU',
			'Nama Barang',
			'Negara Tujuan',
			'Wilayah',
			'Berat (gram)',
			'Jumlah',
			'Harga Jual',
			'Harga Pokok'
		];
		const mapping = autoDetectColumnMapping(headers);
		expect(mapping.sku).toBe('SKU');
		expect(mapping.productName).toBe('Nama Barang');
		expect(mapping.destinationCountry).toBe('Negara Tujuan');
		expect(mapping.zone).toBe('Wilayah');
		expect(mapping.weightG).toBe('Berat (gram)');
		expect(mapping.quantity).toBe('Jumlah');
		expect(mapping.sellingPrice).toBe('Harga Jual');
		expect(mapping.productCost).toBe('Harga Pokok');
	});

	it('validates correct row and catches invalid rows', () => {
		const mapping = {
			destinationCountry: 'country',
			weightG: 'weight',
			sku: 'sku',
			productName: 'name'
		};

		// Valid row
		const validRow = { country: 'SG', weight: '250', sku: 'A1', name: 'Batik' };
		const vRes = validateBulkRow(validRow, 2, mapping);
		expect(vRes.isValid).toBe(true);
		expect(vRes.errors.length).toBe(0);
		expect(vRes.parsedInput?.countryCode).toBe('SG');
		expect(vRes.parsedInput?.weightG).toBe(250);

		// Invalid country
		const badCountryRow = { country: 'USA', weight: '100' };
		const badCountryRes = validateBulkRow(badCountryRow, 3, mapping);
		expect(badCountryRes.isValid).toBe(false);
		expect(badCountryRes.errors[0]).toContain('tidak valid');

		// Negative or zero weight
		const badWeightRow = { country: 'MY', weight: '-5' };
		const badWeightRes = validateBulkRow(badWeightRow, 4, mapping);
		expect(badWeightRes.isValid).toBe(false);
		expect(badWeightRes.errors[0]).toContain('positif');

		// Over limit weight (>30kg)
		const overLimitRow = { country: 'BN', weight: '35000' };
		const overLimitRes = validateBulkRow(overLimitRow, 5, mapping);
		expect(overLimitRes.isValid).toBe(false);
		expect(overLimitRes.errors[0]).toContain('melebihi batas');
	});

	it('processes sample rows in bulk and segregates currencies', async () => {
		const mapping = {
			destinationCountry: 'destinationCountry',
			weightG: 'weightG',
			zone: 'zone',
			sku: 'sku',
			productName: 'productName',
			quantity: 'quantity',
			sellingPrice: 'sellingPrice',
			productCost: 'productCost',
			discount: 'discount',
			additionalSellerCost: 'additionalSellerCost'
		};

		const { validations } = validateAllRows(SAMPLE_ROWS, mapping);
		expect(validations.length).toBe(SAMPLE_ROWS.length);
		expect(validations.every((v) => v.isValid)).toBe(true);

		const { results, summary } = await processBulkCalculations(validations);
		expect(results.length).toBe(SAMPLE_ROWS.length);
		expect(summary.successfulRows).toBe(SAMPLE_ROWS.length);
		expect(summary.failedRows).toBe(0);

		// Check currencies segregation
		const currencies = Object.keys(summary.currencies);
		expect(currencies).toContain('BN' in summary.countryBreakdown ? 'MYR' : 'MYR');
		expect(currencies).toContain('SGD');
		expect(currencies).toContain('THB');
		expect(currencies).toContain('PHP');

		// Currencies should not be mixed into a single number
		expect(summary.currencies.SGD.currency).toBe('SGD');
		expect(summary.currencies.THB.currency).toBe('THB');
		expect(summary.currencies.PHP.currency).toBe('PHP');
	});

	it('generates CSV and XLSX export output without errors', async () => {
		const mapping = {
			destinationCountry: 'destinationCountry',
			weightG: 'weightG',
			zone: 'zone',
			sku: 'sku',
			productName: 'productName',
			quantity: 'quantity',
			sellingPrice: 'sellingPrice',
			productCost: 'productCost'
		};
		const { validations } = validateAllRows(SAMPLE_ROWS, mapping);
		const { results, summary } = await processBulkCalculations(validations);

		const csv = exportResultsToCsv(results);
		expect(csv).toContain('HJB-001');
		expect(csv).toContain('BTK-002');
		expect(csv).toContain('SUCCESS');

		const xlsxBuffer = await exportResultsToXlsx(results, summary);
		expect(xlsxBuffer).toBeInstanceOf(Uint8Array);
		expect(xlsxBuffer.length).toBeGreaterThan(1000);
	});
});
