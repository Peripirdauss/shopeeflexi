import { calculateShippingFee } from '$lib/calculator/engine';
import type {
	BulkRowValidation,
	BulkRowResult,
	BulkSessionSummary,
	BulkSummaryCurrencyBreakdown
} from '$lib/calculator/types';

export interface ProcessingOptions {
	chunkSize?: number;
	onProgress?: (processed: number, total: number) => void;
	shouldCancel?: () => boolean;
}

export async function processBulkCalculations(
	validations: BulkRowValidation[],
	options: ProcessingOptions = {}
): Promise<{
	results: BulkRowResult[];
	summary: BulkSessionSummary;
	cancelled: boolean;
}> {
	const chunkSize = options.chunkSize || 200;
	const total = validations.length;
	const results: BulkRowResult[] = [];

	let processed = 0;
	let successfulCount = 0;
	let failedCount = 0;

	// Loop through rows in chunks with async yield so UI thread remains responsive
	for (let i = 0; i < total; i += chunkSize) {
		if (options.shouldCancel && options.shouldCancel()) {
			return {
				results,
				summary: generateSummary(validations, results, successfulCount, failedCount),
				cancelled: true
			};
		}

		const chunk = validations.slice(i, i + chunkSize);

		for (const val of chunk) {
			if (!val.isValid || !val.parsedInput) {
				failedCount++;
				results.push({
					rowNumber: val.rowNumber,
					sku: '',
					productName: '',
					destinationCountry: '',
					zone: '',
					inputWeightG: 0,
					chargedWeightG: 0,
					totalShippingFee: 0,
					buyerPaidShipping: 0,
					sellerPaidShipping: 0,
					currency: '',
					quantity: 1,
					status: 'ERROR',
					errorExplanation: val.errors.join('; '),
					tariffVersion: 'N/A'
				});
			} else {
				const calc = calculateShippingFee(val.parsedInput);
				if (calc.success) {
					successfulCount++;
					results.push({
						rowNumber: val.rowNumber,
						sku: val.parsedInput.sku || '',
						productName: val.parsedInput.productName || '',
						destinationCountry: calc.countryCode,
						zone: calc.zoneName,
						inputWeightG: calc.inputWeightG,
						chargedWeightG: calc.chargedWeightG,
						totalShippingFee: calc.totalShipping,
						buyerPaidShipping: calc.buyerPaidShipping,
						sellerPaidShipping: calc.sellerPaidShipping,
						currency: calc.currency,
						quantity: calc.quantity,
						sellingPrice: calc.pricing?.sellingPrice,
						productCost: calc.pricing?.productCost,
						netProfit: calc.pricing?.netProfit,
						profitMarginPercent: calc.pricing?.profitMarginPercent,
						status: 'SUCCESS',
						tariffVersion: calc.tariffVersion
					});
				} else {
					failedCount++;
					results.push({
						rowNumber: val.rowNumber,
						sku: val.parsedInput.sku || '',
						productName: val.parsedInput.productName || '',
						destinationCountry: val.parsedInput.countryCode,
						zone: val.parsedInput.zoneCode || '',
						inputWeightG: val.parsedInput.weightG,
						chargedWeightG: 0,
						totalShippingFee: 0,
						buyerPaidShipping: 0,
						sellerPaidShipping: 0,
						currency: '',
						quantity: val.parsedInput.quantity || 1,
						status: 'ERROR',
						errorExplanation: calc.error || 'Gagal menghitung tarif.',
						tariffVersion: 'N/A'
					});
				}
			}
			processed++;
		}

		if (options.onProgress) {
			options.onProgress(processed, total);
		}

		// Yield control to browser microtask/timer queue
		await new Promise((resolve) => setTimeout(resolve, 0));
	}

	const summary = generateSummary(validations, results, successfulCount, failedCount);

	return {
		results,
		summary,
		cancelled: false
	};
}

function generateSummary(
	validations: BulkRowValidation[],
	results: BulkRowResult[],
	successfulCount: number,
	failedCount: number
): BulkSessionSummary {
	const currencies: Record<string, BulkSummaryCurrencyBreakdown> = {};
	const countryBreakdown: Record<string, { count: number; currency: string; totalSellerPaid: number }> = {};

	for (const r of results) {
		if (r.status === 'SUCCESS' && r.currency) {
			// Aggregate by currency
			if (!currencies[r.currency]) {
				currencies[r.currency] = {
					currency: r.currency,
					totalProducts: 0,
					totalShippingFee: 0,
					totalBuyerPaid: 0,
					totalSellerPaid: 0,
					totalRevenue: 0,
					totalProfit: 0
				};
			}

			const curr = currencies[r.currency];
			curr.totalProducts += r.quantity;
			curr.totalShippingFee = +(curr.totalShippingFee + r.totalShippingFee).toFixed(2);
			curr.totalBuyerPaid = +(curr.totalBuyerPaid + r.buyerPaidShipping).toFixed(2);
			curr.totalSellerPaid = +(curr.totalSellerPaid + r.sellerPaidShipping).toFixed(2);

			if (r.sellingPrice) {
				curr.totalRevenue = +((curr.totalRevenue || 0) + r.sellingPrice * r.quantity).toFixed(2);
			}
			if (r.netProfit) {
				curr.totalProfit = +((curr.totalProfit || 0) + r.netProfit).toFixed(2);
			}

			// Aggregate by country
			if (!countryBreakdown[r.destinationCountry]) {
				countryBreakdown[r.destinationCountry] = {
					count: 0,
					currency: r.currency,
					totalSellerPaid: 0
				};
			}
			const c = countryBreakdown[r.destinationCountry];
			c.count++;
			c.totalSellerPaid = +(c.totalSellerPaid + r.sellerPaidShipping).toFixed(2);
		}
	}

	return {
		totalRows: validations.length,
		validRows: validations.filter((v) => v.isValid).length,
		invalidRows: validations.filter((v) => !v.isValid).length,
		processedRows: results.length,
		successfulRows: successfulCount,
		failedRows: failedCount,
		currencies,
		countryBreakdown
	};
}
