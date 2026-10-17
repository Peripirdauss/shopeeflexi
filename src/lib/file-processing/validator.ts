import type { ColumnMappingConfig } from './parser';
import type { BulkRowValidation, CountryCode, SingleCalculationInput } from '$lib/calculator/types';
import { getCountryMetadata } from '$lib/calculator/tariffs';

const COUNTRY_NAME_MAP: Record<string, CountryCode> = {
	BN: 'BN',
	BRUNEI: 'BN',
	'BRUNEI DARUSSALAM': 'BN',
	SG: 'SG',
	SINGAPURA: 'SG',
	SINGAPORE: 'SG',
	MY: 'MY',
	MALAYSIA: 'MY',
	TH: 'TH',
	THAILAND: 'TH',
	THAI: 'TH',
	PH: 'PH',
	FILIPINA: 'PH',
	PHILIPPINES: 'PH'
};

export function cleanNumber(val: any): number {
	if (typeof val === 'number') return val;
	if (val === null || val === undefined) return NaN;
	const s = String(val)
		.trim()
		.replace(/[^0-9.,-]/g, '')
		.replace(/,/g, '.');
	return parseFloat(s);
}

export function standardizeCountryCode(raw: any): CountryCode | null {
	if (!raw) return null;
	const clean = String(raw).toUpperCase().trim();
	return COUNTRY_NAME_MAP[clean] || null;
}

export function validateBulkRow(
	rawRow: Record<string, any>,
	rowNumber: number,
	mapping: ColumnMappingConfig
): BulkRowValidation {
	const errors: string[] = [];
	const warnings: string[] = [];

	// 1. Destination Country (Mandatory)
	if (!mapping.destinationCountry) {
		errors.push('Kolom "Negara Tujuan" belum dipetakan.');
	}
	const rawCountry = mapping.destinationCountry ? rawRow[mapping.destinationCountry] : '';
	const countryCode = standardizeCountryCode(rawCountry);

	if (!countryCode) {
		errors.push(
			`Negara tujuan "${rawCountry || '(kosong)'}" tidak valid. Pilihan resmi: BN, PH, MY, SG, TH.`
		);
	}

	// 2. Weight (Mandatory)
	if (!mapping.weightG) {
		errors.push('Kolom "Berat (gram)" belum dipetakan.');
	}
	const rawWeight = mapping.weightG ? rawRow[mapping.weightG] : '';
	const weight = cleanNumber(rawWeight);

	if (isNaN(weight) || weight <= 0) {
		errors.push(`Berat produk "${rawWeight || '(kosong)'}" harus berupa angka positif lebih besar dari 0 g.`);
	} else if (weight > 30000) {
		errors.push(`Berat produk (${weight.toLocaleString('id-ID')} g) melebihi batas maksimum 30.000 g (30 kg).`);
	} else if (countryCode === 'SG' && weight > 25000) {
		warnings.push('Batas maksimum Shopee untuk Singapura adalah 25 kg per checkout.');
	}

	// 3. Optional Fields
	const sku = mapping.sku ? String(rawRow[mapping.sku] || '').trim() : '';
	const productName = mapping.productName ? String(rawRow[mapping.productName] || '').trim() : '';
	const zone = mapping.zone ? String(rawRow[mapping.zone] || '').trim() : '';

	let quantity = 1;
	if (mapping.quantity && rawRow[mapping.quantity] !== undefined && rawRow[mapping.quantity] !== '') {
		const parsedQty = cleanNumber(rawRow[mapping.quantity]);
		if (!isNaN(parsedQty) && parsedQty >= 1) {
			quantity = Math.floor(parsedQty);
		} else {
			warnings.push(`Kuantitas "${rawRow[mapping.quantity]}" tidak valid, digunakan default 1.`);
		}
	}

	let sellingPrice: number | undefined = undefined;
	if (mapping.sellingPrice && rawRow[mapping.sellingPrice] !== undefined && rawRow[mapping.sellingPrice] !== '') {
		const p = cleanNumber(rawRow[mapping.sellingPrice]);
		if (!isNaN(p)) sellingPrice = Math.max(0, p);
	}

	let productCost: number | undefined = undefined;
	if (mapping.productCost && rawRow[mapping.productCost] !== undefined && rawRow[mapping.productCost] !== '') {
		const c = cleanNumber(rawRow[mapping.productCost]);
		if (!isNaN(c)) productCost = Math.max(0, c);
	}

	let discount: number | undefined = undefined;
	if (mapping.discount && rawRow[mapping.discount] !== undefined && rawRow[mapping.discount] !== '') {
		const d = cleanNumber(rawRow[mapping.discount]);
		if (!isNaN(d)) discount = Math.max(0, d);
	}

	let additionalSellerCost: number | undefined = undefined;
	if (
		mapping.additionalSellerCost &&
		rawRow[mapping.additionalSellerCost] !== undefined &&
		rawRow[mapping.additionalSellerCost] !== ''
	) {
		const a = cleanNumber(rawRow[mapping.additionalSellerCost]);
		if (!isNaN(a)) additionalSellerCost = Math.max(0, a);
	}

	const isValid = errors.length === 0;

	const parsedInput: SingleCalculationInput | undefined = isValid && countryCode
		? {
				productName: productName || `Produk Baris ${rowNumber}`,
				sku: sku || `SKU-${rowNumber}`,
				countryCode,
				zoneCode: zone,
				weightG: weight,
				quantity,
				sellingPrice,
				productCost,
				discount,
				additionalSellerCost
		  }
		: undefined;

	return {
		rowNumber,
		isValid,
		errors,
		warnings,
		parsedInput
	};
}

export function validateAllRows(
	rawRows: Record<string, any>[],
	mapping: ColumnMappingConfig
): {
	validations: BulkRowValidation[];
	validCount: number;
	invalidCount: number;
} {
	let validCount = 0;
	let invalidCount = 0;

	const validations = rawRows.map((row, index) => {
		const res = validateBulkRow(row, index + 2, mapping); // Row 1 is header
		if (res.isValid) validCount++;
		else invalidCount++;
		return res;
	});

	return {
		validations,
		validCount,
		invalidCount
	};
}
