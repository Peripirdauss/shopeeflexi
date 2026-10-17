import rawTariffsData from '$lib/data/official_tariffs.json';
import type { CountryCode, CountryMetadata, CurrencyCode } from './types';

export const COUNTRIES: Record<CountryCode, CountryMetadata> = {
	BN: {
		countryCode: 'BN',
		countryName: 'Brunei Darussalam',
		currency: 'MYR',
		sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/c6c56a498471443eb6535e199e43cfaa_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20BN.pdf',
		sourceFileName: 'c6c56a498471443eb6535e199e43cfaa_Rincian Biaya Pengiriman Ekspor Shopee FLEXI - BN.pdf',
		version: '2024.1-official',
		effectiveDate: '2024-01-01',
		maxOrderWeightG: 30000,
		maxTariffWeightG: 30000,
		hasZones: false,
		zones: [{ code: 'ALL', name: 'Seluruh Brunei Darussalam' }],
		verified: true,
		notes: 'Mata uang perhitungan tarif Shopee FLEXI Ekspor Brunei menggunakan MYR. Biaya kirim pembeli tetap 25.00 MYR.'
	},
	PH: {
		countryCode: 'PH',
		countryName: 'Filipina',
		currency: 'PHP',
		sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/c0a74d80a884495aa511fe0ff3fbf1e9_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20PH.pdf',
		sourceFileName: 'c0a74d80a884495aa511fe0ff3fbf1e9_Rincian Biaya Pengiriman Ekspor Shopee FLEXI - PH.pdf',
		version: '2024.1-official',
		effectiveDate: '2024-01-01',
		maxOrderWeightG: 30000,
		maxTariffWeightG: 30000,
		hasZones: true,
		zones: [
			{ code: 'A', name: 'Zona A (Metro Manila)', description: 'Wilayah ibukota Metro Manila' },
			{ code: 'BCD', name: 'Zona B, C, D (North/South Luzon, Visayas)', description: 'North Luzon, South Luzon, Visayas, dll' }
		],
		verified: true,
		notes: 'Zona A: Metro Manila (Ongkir pembeli 40.00 PHP). Zona B, C, D: Luar Metro Manila (Ongkir pembeli 60.00 PHP).'
	},
	MY: {
		countryCode: 'MY',
		countryName: 'Malaysia',
		currency: 'MYR',
		sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/6a2816ad11b94d3d8be6e970752529cf_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20MY.pdf',
		sourceFileName: '6a2816ad11b94d3d8be6e970752529cf_Rincian Biaya Pengiriman Ekspor Shopee FLEXI - MY.pdf',
		version: '2024.1-official',
		effectiveDate: '2024-01-01',
		maxOrderWeightG: 30000,
		maxTariffWeightG: 30000,
		hasZones: true,
		zones: [
			{ code: 'WEST', name: 'Malaysia Barat (Semenanjung)', description: 'Semenanjung Malaysia (West Malaysia)' },
			{ code: 'EAST', name: 'Malaysia Timur (Sabah & Sarawak)', description: 'Sabah, Sarawak, dan Wilayah Persekutuan Labuan' }
		],
		verified: true,
		notes: 'Malaysia Barat: Ongkir pembeli 4.90 RM. Malaysia Timur: Ongkir pembeli 8.00 RM.'
	},
	SG: {
		countryCode: 'SG',
		countryName: 'Singapura',
		currency: 'SGD',
		sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/2041b473607f403fae29e7c9eae2d7de_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20SG.pdf',
		sourceFileName: '2041b473607f403fae29e7c9eae2d7de_Rincian Biaya Pengiriman Ekspor Shopee FLEXI - SG.pdf',
		version: '2024.1-official',
		effectiveDate: '2024-01-01',
		maxOrderWeightG: 25000, // Batas resmi per pesanan di Shopee
		maxTariffWeightG: 30000,
		hasZones: false,
		zones: [{ code: 'ALL', name: 'Seluruh Singapura' }],
		verified: true,
		notes: 'Biaya kirim pembeli tetap 1.99 SGD. Batas berat maksimum pesanan per checkout di Shopee adalah 25 kg (25.000 g).'
	},
	TH: {
		countryCode: 'TH',
		countryName: 'Thailand',
		currency: 'THB',
		sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/86fc3c086a3c4eedb6a270ea6561e57c_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20TH.pdf',
		sourceFileName: '86fc3c086a3c4eedb6a270ea6561e57c_Rincian Biaya Pengiriman Ekspor Shopee FLEXI - TH.pdf',
		version: '2024.1-official',
		effectiveDate: '2024-01-01',
		maxOrderWeightG: 30000,
		maxTariffWeightG: 30000,
		hasZones: true,
		zones: [
			{ code: 'A', name: 'Zona A (Bangkok & Sekitarnya)', description: 'Provinsi Bangkok, Nonthaburi, Pathum Thani, Samut Prakan' },
			{ code: 'B', name: 'Zona B (Provinsi Lainnya)', description: 'Seluruh provinsi di luar Zona A' }
		],
		verified: true,
		notes: 'Zona A: Ongkir pembeli 27.00 THB. Zona B: Ongkir pembeli 30.00 THB.'
	}
};

// Fast lookup maps by weight (weight -> rate object)
const tariffLookupMaps: Record<CountryCode, Map<number, any>> = {
	BN: new Map(),
	PH: new Map(),
	MY: new Map(),
	SG: new Map(),
	TH: new Map()
};

// Initialize lookup maps
const rawTariffs = (rawTariffsData as any).tariffs;
for (const code of ['BN', 'PH', 'MY', 'SG', 'TH'] as CountryCode[]) {
	const rates = rawTariffs[code]?.rates || [];
	const map = tariffLookupMaps[code];
	for (const row of rates) {
		map.set(row.weight, row);
	}
}

export function getAllCountries(): CountryMetadata[] {
	return Object.values(COUNTRIES);
}

export function getCountryMetadata(countryCode: string): CountryMetadata | undefined {
	const code = countryCode.toUpperCase() as CountryCode;
	return COUNTRIES[code];
}

export function getApplicableBracketWeight(weightG: number): number {
	if (weightG <= 0) return 0;
	if (weightG < 10) return 10;
	// Official Shopee FLEXI brackets are rounded up to the nearest 10 grams
	return Math.ceil(weightG / 10) * 10;
}

export function getTariffRate(countryCode: CountryCode, bracketWeightG: number): any | undefined {
	const map = tariffLookupMaps[countryCode];
	if (!map) return undefined;
	return map.get(bracketWeightG);
}

export function getRawRates(countryCode: CountryCode): any[] {
	return rawTariffs[countryCode]?.rates || [];
}

export function formatCurrency(amount: number, currency: CurrencyCode | string): string {
	const formattedNum = amount.toLocaleString('id-ID', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	
	switch (currency) {
		case 'MYR':
			return `RM ${formattedNum}`;
		case 'PHP':
			return `₱ ${formattedNum}`;
		case 'SGD':
			return `S$ ${formattedNum}`;
		case 'THB':
			return `฿ ${formattedNum}`;
		default:
			return `${currency} ${formattedNum}`;
	}
}
