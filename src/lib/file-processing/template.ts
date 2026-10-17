import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export const TEMPLATE_COLUMNS = [
	{ key: 'sku', header: 'SKU', width: 14, example: 'BTK-001' },
	{ key: 'productName', header: 'Nama Produk', width: 28, example: 'Kemeja Batik Katun Premium' },
	{ key: 'destinationCountry', header: 'Negara Tujuan', width: 16, example: 'SG' },
	{ key: 'zone', header: 'Zona (Opsional)', width: 18, example: 'ALL' },
	{ key: 'weightG', header: 'Berat (gram)', width: 14, example: 250 },
	{ key: 'quantity', header: 'Kuantitas', width: 12, example: 1 },
	{ key: 'sellingPrice', header: 'Harga Jual', width: 14, example: 25.00 },
	{ key: 'productCost', header: 'HPP / Modal', width: 14, example: 10.00 },
	{ key: 'discount', header: 'Diskon', width: 12, example: 0 },
	{ key: 'additionalSellerCost', header: 'Biaya Tambahan Penjual', width: 22, example: 1.50 }
];

export const SAMPLE_ROWS = [
	{
		sku: 'HJB-001',
		productName: 'Hijab Segiempat Paris Voal',
		destinationCountry: 'BN',
		zone: 'ALL',
		weightG: 120,
		quantity: 2,
		sellingPrice: 35.00,
		productCost: 15.00,
		discount: 0,
		additionalSellerCost: 1.00
	},
	{
		sku: 'BTK-002',
		productName: 'Kemeja Batik Pria Slimfit',
		destinationCountry: 'SG',
		zone: 'ALL',
		weightG: 240,
		quantity: 1,
		sellingPrice: 22.00,
		productCost: 9.50,
		discount: 2.00,
		additionalSellerCost: 1.20
	},
	{
		sku: 'KUL-003',
		productName: 'Sambal Roa Khas Manado 150g',
		destinationCountry: 'MY',
		zone: 'WEST',
		weightG: 190,
		quantity: 3,
		sellingPrice: 28.00,
		productCost: 12.00,
		discount: 0,
		additionalSellerCost: 2.00
	},
	{
		sku: 'TNN-004',
		productName: 'Outer Tenun Troso Etnik',
		destinationCountry: 'MY',
		zone: 'EAST',
		weightG: 320,
		quantity: 1,
		sellingPrice: 45.00,
		productCost: 20.00,
		discount: 5.00,
		additionalSellerCost: 1.50
	},
	{
		sku: 'SPT-005',
		productName: 'Sepatu Sneakers Kanvas Putih',
		destinationCountry: 'TH',
		zone: 'A',
		weightG: 850,
		quantity: 1,
		sellingPrice: 380.00,
		productCost: 180.00,
		discount: 20.00,
		additionalSellerCost: 15.00
	},
	{
		sku: 'DSR-006',
		productName: 'Daster Rayon Motif Abstrak',
		destinationCountry: 'TH',
		zone: 'B',
		weightG: 220,
		quantity: 2,
		sellingPrice: 250.00,
		productCost: 90.00,
		discount: 0,
		additionalSellerCost: 10.00
	},
	{
		sku: 'TAS-007',
		productName: 'Tas Anyaman Rotan Bali',
		destinationCountry: 'PH',
		zone: 'A',
		weightG: 450,
		quantity: 1,
		sellingPrice: 650.00,
		productCost: 280.00,
		discount: 50.00,
		additionalSellerCost: 25.00
	},
	{
		sku: 'KPI-008',
		productName: 'Kopi Arabika Gayo Bubuk 250g',
		destinationCountry: 'PH',
		zone: 'BCD',
		weightG: 280,
		quantity: 2,
		sellingPrice: 450.00,
		productCost: 190.00,
		discount: 0,
		additionalSellerCost: 15.00
	}
];

export async function generateTemplateXlsx(): Promise<Uint8Array> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Shopee FLEXI Export Calculator';
	workbook.created = new Date();

	const worksheet = workbook.addWorksheet('Template Perhitungan', {
		views: [{ showGridLines: true }]
	});

	// Header row
	worksheet.columns = TEMPLATE_COLUMNS.map((col) => ({
		header: col.header,
		key: col.key,
		width: col.width
	}));

	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF2563EB' }
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
	headerRow.height = 28;

	// Add sample data
	SAMPLE_ROWS.forEach((row) => {
		worksheet.addRow(row);
	});

	// Border & format cells
	worksheet.eachRow((row, rowNumber) => {
		if (rowNumber > 1) {
			row.alignment = { vertical: 'middle' };
			row.height = 20;
		}
	});

	// Instructions sheet
	const guideSheet = workbook.addWorksheet('Petunjuk Pengisian');
	guideSheet.columns = [
		{ header: 'Kolom', width: 20 },
		{ header: 'Wajib / Opsional', width: 18 },
		{ header: 'Format / Keterangan', width: 50 }
	];

	const guideHeader = guideSheet.getRow(1);
	guideHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	guideHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF0D9488' }
	};
	guideHeader.height = 24;

	guideSheet.addRows([
		['SKU', 'Opsional', 'Kode identifikasi produk atau varian.'],
		['Nama Produk', 'Opsional', 'Nama produk yang mempermudah identifikasi.'],
		['Negara Tujuan', 'WAJIB', 'Kode negara tujuan: BN (Brunei), PH (Filipina), MY (Malaysia), SG (Singapura), TH (Thailand).'],
		['Zona', 'Kondisional', 'PH: A (Metro Manila) atau BCD (Luar Manila). MY: WEST (Barat) atau EAST (Timur). TH: A (Bangkok) atau B (Luar Bangkok). BN & SG: Kosongkan atau ALL.'],
		['Berat (gram)', 'WAJIB', 'Berat produk dalam satuan gram (angka positif, mendukung desimal). Maksimum 30.000 g.'],
		['Kuantitas', 'Opsional', 'Jumlah unit per pengiriman (angka bulat, default: 1).'],
		['Harga Jual', 'Opsional', 'Harga jual produk dalam mata uang negara tujuan untuk estimasi laba.'],
		['HPP / Modal', 'Opsional', 'Biaya pokok produksi atau harga beli modal.'],
		['Diskon', 'Opsional', 'Potongan harga per produk bila ada.'],
		['Biaya Tambahan Penjual', 'Opsional', 'Biaya kemasan, bubble wrap, atau operasional lain yang ditanggung penjual.']
	]);

	const buffer = await workbook.xlsx.writeBuffer();
	return new Uint8Array(buffer);
}

export function generateTemplateCsv(): string {
	const headers = TEMPLATE_COLUMNS.map((col) => col.header);
	const rows = SAMPLE_ROWS.map((row) => [
		row.sku,
		row.productName,
		row.destinationCountry,
		row.zone,
		row.weightG,
		row.quantity,
		row.sellingPrice,
		row.productCost,
		row.discount,
		row.additionalSellerCost
	]);

	return Papa.unparse([headers, ...rows]);
}
