import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import type { BulkRowResult, BulkSessionSummary } from '$lib/calculator/types';

export const EXPORT_COLUMNS = [
	{ key: 'rowNumber', header: 'No. Baris Asli', width: 14 },
	{ key: 'sku', header: 'SKU', width: 16 },
	{ key: 'productName', header: 'Nama Produk', width: 30 },
	{ key: 'destinationCountry', header: 'Negara', width: 10 },
	{ key: 'zone', header: 'Zona Tujuan', width: 25 },
	{ key: 'inputWeightG', header: 'Berat Input (g)', width: 15 },
	{ key: 'chargedWeightG', header: 'Bracket Resmi (g)', width: 16 },
	{ key: 'quantity', header: 'Qty', width: 8 },
	{ key: 'currency', header: 'Mata Uang', width: 12 },
	{ key: 'totalShippingFee', header: 'Total Ongkir', width: 14 },
	{ key: 'buyerPaidShipping', header: 'Ongkir Pembeli', width: 15 },
	{ key: 'sellerPaidShipping', header: 'Ongkir Penjual', width: 15 },
	{ key: 'sellingPrice', header: 'Harga Jual', width: 14 },
	{ key: 'productCost', header: 'HPP / Modal', width: 14 },
	{ key: 'netProfit', header: 'Laba Bersih', width: 14 },
	{ key: 'profitMarginPercent', header: 'Margin (%)', width: 12 },
	{ key: 'status', header: 'Status', width: 12 },
	{ key: 'errorExplanation', header: 'Keterangan Error / Catatan', width: 35 },
	{ key: 'tariffVersion', header: 'Versi Tarif', width: 15 }
];

export async function exportResultsToXlsx(
	results: BulkRowResult[],
	summary?: BulkSessionSummary,
	fileNamePrefix: string = 'Hasil_Perhitungan_Shopee_FLEXI'
): Promise<Uint8Array> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Shopee FLEXI Export Shipping Fee Calculator';
	workbook.created = new Date();

	// 1. Data Sheet
	const worksheet = workbook.addWorksheet('Hasil Perhitungan', {
		views: [{ showGridLines: true }]
	});

	worksheet.columns = EXPORT_COLUMNS.map((col) => ({
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
	headerRow.height = 26;

	results.forEach((r) => {
		const row = worksheet.addRow({
			rowNumber: r.rowNumber,
			sku: r.sku,
			productName: r.productName,
			destinationCountry: r.destinationCountry,
			zone: r.zone,
			inputWeightG: r.inputWeightG,
			chargedWeightG: r.chargedWeightG,
			quantity: r.quantity,
			currency: r.currency,
			totalShippingFee: r.status === 'SUCCESS' ? r.totalShippingFee : null,
			buyerPaidShipping: r.status === 'SUCCESS' ? r.buyerPaidShipping : null,
			sellerPaidShipping: r.status === 'SUCCESS' ? r.sellerPaidShipping : null,
			sellingPrice: r.sellingPrice !== undefined ? r.sellingPrice : null,
			productCost: r.productCost !== undefined ? r.productCost : null,
			netProfit: r.netProfit !== undefined ? r.netProfit : null,
			profitMarginPercent: r.profitMarginPercent !== undefined ? `${r.profitMarginPercent}%` : null,
			status: r.status,
			errorExplanation: r.errorExplanation || '',
			tariffVersion: r.tariffVersion
		});

		// Color code status
		const statusCell = row.getCell('status');
		if (r.status === 'SUCCESS') {
			statusCell.font = { color: { argb: 'FF0D9488' }, bold: true };
		} else {
			statusCell.font = { color: { argb: 'FFE11D48' }, bold: true };
			row.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFFFF1F2' }
			};
		}
	});

	// 2. Summary Sheet (if provided)
	if (summary) {
		const summarySheet = workbook.addWorksheet('Ringkasan Perhitungan');
		summarySheet.columns = [
			{ header: 'Kategori / Parameter', width: 32 },
			{ header: 'Nilai / Rincian', width: 28 },
			{ header: 'Mata Uang', width: 14 }
		];

		const sumHeader = summarySheet.getRow(1);
		sumHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		sumHeader.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF0D9488' }
		};

		summarySheet.addRow(['Total Baris Diproses', summary.processedRows, '-']);
		summarySheet.addRow(['Baris Sukses', summary.successfulRows, '-']);
		summarySheet.addRow(['Baris Gagal', summary.failedRows, '-']);
		summarySheet.addRow(['Waktu Ekspor', new Date().toLocaleString('id-ID'), '-']);
		summarySheet.addRow([]);

		summarySheet.addRow(['RINCIAN TOTAL PER MATA UANG', '(Pemisahan Sesuai Aturan Resmi)', '']);
		for (const [currKey, curr] of Object.entries(summary.currencies)) {
			summarySheet.addRow([`Total Produk (${currKey})`, curr.totalProducts, currKey]);
			summarySheet.addRow([`Total Seluruh Ongkir (${currKey})`, curr.totalShippingFee, currKey]);
			summarySheet.addRow([`Total Ongkir Dibayar Pembeli (${currKey})`, curr.totalBuyerPaid, currKey]);
			summarySheet.addRow([`Total Ongkir Dibayar Penjual (${currKey})`, curr.totalSellerPaid, currKey]);
			if (curr.totalRevenue) {
				summarySheet.addRow([`Total Pendapatan (${currKey})`, curr.totalRevenue, currKey]);
			}
			if (curr.totalProfit) {
				summarySheet.addRow([`Total Estimasi Laba (${currKey})`, curr.totalProfit, currKey]);
			}
			summarySheet.addRow([]);
		}
	}

	const buffer = await workbook.xlsx.writeBuffer();
	return new Uint8Array(buffer);
}

export function exportResultsToCsv(results: BulkRowResult[]): string {
	const headers = EXPORT_COLUMNS.map((c) => c.header);
	const rows = results.map((r) => [
		r.rowNumber,
		r.sku,
		r.productName,
		r.destinationCountry,
		r.zone,
		r.inputWeightG,
		r.chargedWeightG,
		r.quantity,
		r.currency,
		r.status === 'SUCCESS' ? r.totalShippingFee : '',
		r.status === 'SUCCESS' ? r.buyerPaidShipping : '',
		r.status === 'SUCCESS' ? r.sellerPaidShipping : '',
		r.sellingPrice !== undefined ? r.sellingPrice : '',
		r.productCost !== undefined ? r.productCost : '',
		r.netProfit !== undefined ? r.netProfit : '',
		r.profitMarginPercent !== undefined ? `${r.profitMarginPercent}%` : '',
		r.status,
		r.errorExplanation || '',
		r.tariffVersion
	]);

	return Papa.unparse([headers, ...rows]);
}
