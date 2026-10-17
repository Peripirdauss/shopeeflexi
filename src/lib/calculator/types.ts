export type CountryCode = 'BN' | 'PH' | 'MY' | 'SG' | 'TH';

export type CurrencyCode = 'MYR' | 'PHP' | 'SGD' | 'THB';

export interface ZoneDefinition {
	code: string;
	name: string;
	description?: string;
}

export interface CountryMetadata {
	countryCode: CountryCode;
	countryName: string;
	currency: CurrencyCode;
	sourceUrl: string;
	sourceFileName: string;
	version: string;
	effectiveDate: string;
	maxOrderWeightG: number;
	maxTariffWeightG?: number;
	hasZones: boolean;
	zones: ZoneDefinition[];
	verified: boolean;
	notes?: string;
}

export interface TariffRateRowSimple {
	weight: number;
	total: number;
	buyer: number;
	seller: number;
}

export interface TariffRateRowZoned {
	weight: number;
	[zoneKey: string]: {
		total: number;
		buyer: number;
		seller: number;
	} | number;
}

export interface SingleCalculationInput {
	productName?: string;
	sku?: string;
	countryCode: CountryCode;
	zoneCode?: string;
	weightG: number;
	quantity?: number;
	sellingPrice?: number;
	productCost?: number;
	discount?: number;
	additionalSellerCost?: number;
}

export interface CalculationBreakdownStep {
	step: number;
	title: string;
	detail: string;
	amount?: number;
	currency?: string;
}

export interface CalculationResult {
	success: boolean;
	countryCode: CountryCode;
	countryName: string;
	zoneCode: string;
	zoneName: string;
	inputWeightG: number;
	chargedWeightG: number;
	bracketWeightG: number;
	quantity: number;
	currency: CurrencyCode;
	
	// Per item amounts
	unitTotalShipping: number;
	unitBuyerPaid: number;
	unitSellerPaid: number;
	
	// Total order amounts
	totalShipping: number;
	buyerPaidShipping: number;
	sellerPaidShipping: number;
	
	// Profitability analysis (optional if prices provided)
	pricing?: {
		sellingPrice: number;
		productCost: number;
		discount: number;
		additionalSellerCost: number;
		grossRevenue: number;
		totalExpenses: number;
		netProfit: number;
		profitMarginPercent: number;
	};
	
	tariffVersion: string;
	effectiveDate: string;
	sourceUrl: string;
	calculatedAt: string;
	explanation: CalculationBreakdownStep[];
	warnings?: string[];
	error?: string;
}

export interface BulkRowInput {
	rowNumber: number;
	sku?: string;
	productName?: string;
	destinationCountry: string;
	zone?: string;
	weightG: number | string;
	quantity?: number | string;
	sellingPrice?: number | string;
	productCost?: number | string;
	discount?: number | string;
	additionalSellerCost?: number | string;
	rawValues: Record<string, any>;
}

export interface BulkRowValidation {
	rowNumber: number;
	isValid: boolean;
	errors: string[];
	warnings: string[];
	parsedInput?: SingleCalculationInput;
}

export interface BulkRowResult {
	rowNumber: number;
	sku: string;
	productName: string;
	destinationCountry: string;
	zone: string;
	inputWeightG: number;
	chargedWeightG: number;
	totalShippingFee: number;
	buyerPaidShipping: number;
	sellerPaidShipping: number;
	currency: string;
	quantity: number;
	sellingPrice?: number;
	productCost?: number;
	netProfit?: number;
	profitMarginPercent?: number;
	status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
	errorExplanation?: string;
	tariffVersion: string;
}

export interface BulkSummaryCurrencyBreakdown {
	currency: string;
	totalProducts: number;
	totalShippingFee: number;
	totalBuyerPaid: number;
	totalSellerPaid: number;
	totalRevenue?: number;
	totalProfit?: number;
}

export interface BulkSessionSummary {
	totalRows: number;
	validRows: number;
	invalidRows: number;
	processedRows: number;
	successfulRows: number;
	failedRows: number;
	currencies: Record<string, BulkSummaryCurrencyBreakdown>;
	countryBreakdown: Record<string, { count: number; currency: string; totalSellerPaid: number }>;
}

export interface ProfitSimulatorInput {
	sellingPrice: number;
	productCost: number;
	sellerPaidShippingFee: number;
	marketplaceCommissionRatePercent?: number;
	paymentFeeRatePercent?: number;
	discount?: number;
	packagingCost?: number;
	otherExpenses?: number;
	targetMarginPercent?: number;
}

export interface ProfitSimulatorResult {
	grossRevenue: number;
	marketplaceCommission: number;
	paymentFee: number;
	packagingCost: number;
	otherExpenses: number;
	productCost: number;
	sellerPaidShippingFee: number;
	totalExpenses: number;
	netProfit: number;
	profitMarginPercent: number;
	breakEvenSellingPrice: number;
	suggestedPriceForTargetMargin?: number;
	targetMarginPercent?: number;
}
