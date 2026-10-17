import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface RawParsedFile {
	fileName: string;
	fileSize: number;
	headers: string[];
	rows: Record<string, any>[];
	totalRows: number;
}

export type RequiredFieldKey =
	| 'sku'
	| 'productName'
	| 'destinationCountry'
	| 'zone'
	| 'weightG'
	| 'quantity'
	| 'sellingPrice'
	| 'productCost'
	| 'discount'
	| 'additionalSellerCost';

export interface ColumnMappingConfig {
	sku?: string;
	productName?: string;
	destinationCountry: string;
	zone?: string;
	weightG: string;
	quantity?: string;
	sellingPrice?: string;
	productCost?: string;
	discount?: string;
	additionalSellerCost?: string;
}

const FIELD_ALIASES: Record<RequiredFieldKey, string[]> = {
	sku: ['sku', 'kode', 'kode produk', 'item code', 'barcode', 'kode barang', 'part number'],
	productName: [
		'nama produk',
		'product name',
		'nama barang',
		'nama',
		'title',
		'item name',
		'deskripsi',
		'produk'
	],
	destinationCountry: [
		'negara tujuan',
		'negara',
		'country',
		'destination',
		'tujuan',
		'dest',
		'kode negara',
		'country code',
		'destination country'
	],
	zone: ['zona', 'zone', 'wilayah', 'area', 'region', 'kode zona', 'provinsi'],
	weightG: [
		'berat (gram)',
		'berat(gram)',
		'berat (g)',
		'berat(g)',
		'weight (g)',
		'weight(g)',
		'berat',
		'weight',
		'gram',
		'bobot',
		'gr',
		'weight in grams',
		'berat produk'
	],
	quantity: ['kuantitas', 'quantity', 'qty', 'jumlah', 'pcs', 'unit', 'total unit', 'banyaknya'],
	sellingPrice: [
		'harga jual',
		'selling price',
		'harga',
		'price',
		'harga satuan',
		'retail price',
		'harga ekspor'
	],
	productCost: [
		'hpp / modal',
		'hpp',
		'modal',
		'product cost',
		'cost',
		'biaya produk',
		'harga modal',
		'harga pokok',
		'cogs'
	],
	discount: ['diskon', 'discount', 'potongan', 'potongan harga', 'promo'],
	additionalSellerCost: [
		'biaya tambahan penjual',
		'biaya tambahan',
		'additional cost',
		'packaging',
		'biaya lain',
		'packing',
		'ongkir lokal',
		'kemasan'
	]
};

export async function parseFile(file: File): Promise<RawParsedFile> {
	const ext = file.name.split('.').pop()?.toLowerCase();

	if (ext === 'csv') {
		return parseCsvFile(file);
	} else if (ext === 'xlsx' || ext === 'xls') {
		return parseExcelFile(file);
	} else {
		throw new Error(`Format file .${ext} tidak didukung. Harap unggah file .xlsx atau .csv`);
	}
}

async function parseCsvFile(file: File): Promise<RawParsedFile> {
	const text = await file.text();
	return new Promise((resolve, reject) => {
		Papa.parse(text, {
			header: true,
			skipEmptyLines: 'greedy',
			complete: (results) => {
				const headers = results.meta.fields || [];
				const rows = results.data as Record<string, any>[];
				resolve({
					fileName: file.name,
					fileSize: file.size,
					headers,
					rows,
					totalRows: rows.length
				});
			},
			error: (error: any) => reject(new Error(`Gagal membaca file CSV: ${error.message}`))
		});
	});
}

async function parseExcelFile(file: File): Promise<RawParsedFile> {
	const arrayBuffer = await file.arrayBuffer();
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(arrayBuffer);

	const worksheet = workbook.worksheets[0];
	if (!worksheet) {
		throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
	}

	const headers: string[] = [];
	const rows: Record<string, any>[] = [];

	worksheet.eachRow((row, rowNumber) => {
		if (rowNumber === 1) {
			row.eachCell((cell) => {
				headers.push(String(cell.value || '').trim());
			});
		} else {
			const rowData: Record<string, any> = {};
			let hasAnyValue = false;
			row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
				const headerKey = headers[colNumber - 1];
				if (headerKey) {
					let val = cell.value;
					// Handle formulas or rich text
					if (val && typeof val === 'object') {
						if ('result' in val) val = (val as any).result;
						else if ('richText' in val) {
							val = (val as any).richText.map((t: any) => t.text).join('');
						} else if ('text' in val) {
							val = (val as any).text;
						}
					}
					if (val !== null && val !== undefined && val !== '') {
						hasAnyValue = true;
					}
					rowData[headerKey] = val;
				}
			});
			if (hasAnyValue) {
				rows.push(rowData);
			}
		}
	});

	return {
		fileName: file.name,
		fileSize: file.size,
		headers,
		rows,
		totalRows: rows.length
	};
}

export function autoDetectColumnMapping(headers: string[]): ColumnMappingConfig {
	const normalizedHeaders = headers.map((h) => ({
		raw: h,
		clean: h.toLowerCase().trim()
	}));

	const mapping: Partial<ColumnMappingConfig> = {};

	for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES) as [RequiredFieldKey, string[]][]) {
		// Exact match first
		const exact = normalizedHeaders.find((h) => aliases.includes(h.clean));
		if (exact) {
			(mapping as any)[fieldKey] = exact.raw;
			continue;
		}

		// Partial / contains match
		const partial = normalizedHeaders.find((h) => aliases.some((a) => h.clean.includes(a)));
		if (partial) {
			(mapping as any)[fieldKey] = partial.raw;
		}
	}

	return {
		destinationCountry: mapping.destinationCountry || '',
		weightG: mapping.weightG || '',
		sku: mapping.sku || '',
		productName: mapping.productName || '',
		zone: mapping.zone || '',
		quantity: mapping.quantity || '',
		sellingPrice: mapping.sellingPrice || '',
		productCost: mapping.productCost || '',
		discount: mapping.discount || '',
		additionalSellerCost: mapping.additionalSellerCost || ''
	};
}
