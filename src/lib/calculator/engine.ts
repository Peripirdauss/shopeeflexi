import {
	COUNTRIES,
	getCountryMetadata,
	getApplicableBracketWeight,
	getTariffRate,
	formatCurrency
} from './tariffs';
import type {
	CountryCode,
	SingleCalculationInput,
	CalculationResult,
	CalculationBreakdownStep,
	ProfitSimulatorInput,
	ProfitSimulatorResult
} from './types';

export function calculateShippingFee(input: SingleCalculationInput): CalculationResult {
	const countryCode = input.countryCode?.toUpperCase() as CountryCode;
	const meta = getCountryMetadata(countryCode);

	if (!meta) {
		return createErrorResult(
			countryCode,
			input.weightG,
			`Negara tujuan "${input.countryCode}" tidak didukung dalam tarif resmi Shopee FLEXI Ekspor. Pilihan: BN, PH, MY, SG, TH.`
		);
	}

	const weight = Number(input.weightG);
	if (isNaN(weight) || weight <= 0) {
		return createErrorResult(
			countryCode,
			weight,
			'Berat produk harus berupa angka positif lebih besar dari 0 gram.'
		);
	}

	const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
	const warnings: string[] = [];

	// Max tariff limit check (30kg)
	const maxTariffG = meta.maxTariffWeightG || meta.maxOrderWeightG;
	if (weight > maxTariffG) {
		return createErrorResult(
			countryCode,
			weight,
			`Berat produk (${weight.toLocaleString('id-ID')} g) melebihi batas tarif maksimum resmi Shopee FLEXI (${maxTariffG.toLocaleString('id-ID')} g / ${(maxTariffG / 1000)} kg). Paket tidak dapat diproses.`
		);
	}

	// Singapore special rule check: 25kg checkout limit
	if (countryCode === 'SG' && weight > meta.maxOrderWeightG) {
		warnings.push(
			`Perhatian: Shopee menetapkan batas berat maksimum pesanan untuk Singapura sebesar 25 kg (25.000 g) per checkout. Berat ${weight.toLocaleString('id-ID')} g dapat dikenakan kendala logistik.`
		);
	}

	// Compute bracket weight (rounded up to nearest 10g)
	const bracketWeight = getApplicableBracketWeight(weight);
	const tariffRow = getTariffRate(countryCode, bracketWeight);

	if (!tariffRow) {
		return createErrorResult(
			countryCode,
			weight,
			`Tarif tidak ditemukan untuk berat bracket ${bracketWeight} g pada negara ${meta.countryName}.`
		);
	}

	// Resolve Zone
	let resolvedZoneCode = 'ALL';
	let resolvedZoneName = meta.zones[0]?.name || 'Standar';
	let unitTotal = 0;
	let unitBuyer = 0;
	let unitSeller = 0;

	if (meta.hasZones) {
		const reqZone = (input.zoneCode || '').toUpperCase().trim();
		if (countryCode === 'PH') {
			if (reqZone === 'A' || reqZone.includes('METRO') || reqZone.includes('MANILA')) {
				resolvedZoneCode = 'A';
				resolvedZoneName = 'Zona A (Metro Manila)';
				unitTotal = tariffRow.zoneA.total;
				unitBuyer = tariffRow.zoneA.buyer;
				unitSeller = tariffRow.zoneA.seller;
			} else {
				// Default to BCD
				resolvedZoneCode = 'BCD';
				resolvedZoneName = 'Zona B, C, D (Luar Metro Manila)';
				unitTotal = tariffRow.zoneBCD.total;
				unitBuyer = tariffRow.zoneBCD.buyer;
				unitSeller = tariffRow.zoneBCD.seller;
			}
		} else if (countryCode === 'MY') {
			if (reqZone === 'EAST' || reqZone.includes('TIMUR') || reqZone.includes('SABAH') || reqZone.includes('SARAWAK')) {
				resolvedZoneCode = 'EAST';
				resolvedZoneName = 'Malaysia Timur (Sabah & Sarawak)';
				unitTotal = tariffRow.east.total;
				unitBuyer = tariffRow.east.buyer;
				unitSeller = tariffRow.east.seller;
			} else {
				// Default to WEST
				resolvedZoneCode = 'WEST';
				resolvedZoneName = 'Malaysia Barat (Semenanjung)';
				unitTotal = tariffRow.west.total;
				unitBuyer = tariffRow.west.buyer;
				unitSeller = tariffRow.west.seller;
			}
		} else if (countryCode === 'TH') {
			if (reqZone === 'B' || reqZone.includes('LUAR') || reqZone.includes('PROVINSI LAIN')) {
				resolvedZoneCode = 'B';
				resolvedZoneName = 'Zona B (Provinsi Lainnya)';
				unitTotal = tariffRow.zoneB.total;
				unitBuyer = tariffRow.zoneB.buyer;
				unitSeller = tariffRow.zoneB.seller;
			} else {
				// Default to A
				resolvedZoneCode = 'A';
				resolvedZoneName = 'Zona A (Bangkok & Sekitarnya)';
				unitTotal = tariffRow.zoneA.total;
				unitBuyer = tariffRow.zoneA.buyer;
				unitSeller = tariffRow.zoneA.seller;
			}
		}
	} else {
		resolvedZoneCode = 'ALL';
		resolvedZoneName = meta.zones[0]?.name || 'Seluruh Negara';
		unitTotal = tariffRow.total;
		unitBuyer = tariffRow.buyer;
		unitSeller = tariffRow.seller;
	}

	// Mathematical consistency verification
	const calculatedTotal = +(unitBuyer + unitSeller).toFixed(2);
	if (Math.abs(calculatedTotal - unitTotal) > 0.01) {
		warnings.push(
			`Catatan: Terdapat selisih pembulatan resmi (${calculatedTotal} vs ${unitTotal}). Nilai resmi tabel diutamakan.`
		);
	}

	// Multiply by quantity
	const totalShipping = +(unitTotal * quantity).toFixed(2);
	const buyerPaidShipping = +(unitBuyer * quantity).toFixed(2);
	const sellerPaidShipping = +(unitSeller * quantity).toFixed(2);

	// Build Step-by-step Explanation
	const explanation: CalculationBreakdownStep[] = [
		{
			step: 1,
			title: 'Penentuan Bracket Berat Resmi',
			detail:
				weight < 10
					? `Berat input ${weight} g berada di bawah berat minimum tabel. Mengikuti aturan logistik Shopee FLEXI, diterapkan berat bracket minimum 10 g.`
					: weight === bracketWeight
					? `Berat input ${weight} g tepat pada bracket kelipatan 10 g resmi (${bracketWeight} g).`
					: `Berat input ${weight} g dibulatkan ke atas (ceiling) ke kelipatan 10 g terdekat, yaitu ${bracketWeight} g.`
		},
		{
			step: 2,
			title: 'Pencocokan Negara & Zona Tujuan',
			detail: `${meta.countryName} (${countryCode}) - ${resolvedZoneName}. Mata uang resmi yang berlaku: ${meta.currency}.`
		},
		{
			step: 3,
			title: 'Alokasi Biaya Pengiriman (Per Unit)',
			detail: `Berdasarkan tabel resmi tarif Shopee FLEXI berat ${bracketWeight} g: Total Ongkir = ${formatCurrency(unitTotal, meta.currency)}, Ditanggung Pembeli = ${formatCurrency(unitBuyer, meta.currency)}, Ditanggung Penjual = ${formatCurrency(unitSeller, meta.currency)}.`
		}
	];

	if (quantity > 1) {
		explanation.push({
			step: 4,
			title: `Perhitungan Kuantitas (${quantity} pcs)`,
			detail: `Total Ongkir = ${quantity} × ${formatCurrency(unitTotal, meta.currency)} = ${formatCurrency(totalShipping, meta.currency)}. Ongkir Penjual = ${quantity} × ${formatCurrency(unitSeller, meta.currency)} = ${formatCurrency(sellerPaidShipping, meta.currency)}.`
		});
	}

	// Optional profitability analysis
	let pricingResult = undefined;
	const sellingPrice = Number(input.sellingPrice);
	const productCost = Number(input.productCost);
	const discount = Number(input.discount) || 0;
	const additionalSellerCost = Number(input.additionalSellerCost) || 0;

	if (!isNaN(sellingPrice) && sellingPrice > 0) {
		const effectivePrice = Math.max(0, sellingPrice - discount);
		const grossRevenue = +(effectivePrice * quantity).toFixed(2);
		const totalProductCost = !isNaN(productCost) && productCost > 0 ? +(productCost * quantity).toFixed(2) : 0;
		const totalAdditional = +(additionalSellerCost * quantity).toFixed(2);
		
		// Note: sellerPaidShipping is in destination currency. If seller operates in IDR or local currency,
		// we calculate net profit directly when user provides consistent units or simulates locally.
		const totalExpenses = +(totalProductCost + totalAdditional + sellerPaidShipping).toFixed(2);
		const netProfit = +(grossRevenue - totalExpenses).toFixed(2);
		const profitMarginPercent = grossRevenue > 0 ? +((netProfit / grossRevenue) * 100).toFixed(2) : 0;

		pricingResult = {
			sellingPrice,
			productCost: isNaN(productCost) ? 0 : productCost,
			discount,
			additionalSellerCost,
			grossRevenue,
			totalExpenses,
			netProfit,
			profitMarginPercent
		};

		explanation.push({
			step: explanation.length + 1,
			title: 'Estimasi Profitabilitas Produk',
			detail: `Pendapatan Bersih = ${formatCurrency(grossRevenue, meta.currency)} - Total Biaya (HPP + Ongkir Penjual + Biaya Lain = ${formatCurrency(totalExpenses, meta.currency)}) = ${formatCurrency(netProfit, meta.currency)} (Margin ${profitMarginPercent}%).`
		});
	}

	return {
		success: true,
		countryCode,
		countryName: meta.countryName,
		zoneCode: resolvedZoneCode,
		zoneName: resolvedZoneName,
		inputWeightG: weight,
		chargedWeightG: bracketWeight,
		bracketWeightG: bracketWeight,
		quantity,
		currency: meta.currency,
		unitTotalShipping: unitTotal,
		unitBuyerPaid: unitBuyer,
		unitSellerPaid: unitSeller,
		totalShipping,
		buyerPaidShipping,
		sellerPaidShipping,
		pricing: pricingResult,
		tariffVersion: meta.version,
		effectiveDate: meta.effectiveDate,
		sourceUrl: meta.sourceUrl,
		calculatedAt: new Date().toISOString(),
		explanation,
		warnings: warnings.length > 0 ? warnings : undefined
	};
}

export function simulateProfitability(input: ProfitSimulatorInput): ProfitSimulatorResult {
	const price = Math.max(0, Number(input.sellingPrice) || 0);
	const cost = Math.max(0, Number(input.productCost) || 0);
	const shipping = Math.max(0, Number(input.sellerPaidShippingFee) || 0);
	const discount = Math.max(0, Number(input.discount) || 0);
	const commRate = Math.max(0, Number(input.marketplaceCommissionRatePercent) || 0);
	const paymentRate = Math.max(0, Number(input.paymentFeeRatePercent) || 0);
	const packaging = Math.max(0, Number(input.packagingCost) || 0);
	const other = Math.max(0, Number(input.otherExpenses) || 0);
	const targetMargin = Number(input.targetMarginPercent);

	const grossRevenue = Math.max(0, +(price - discount).toFixed(2));
	const marketplaceCommission = +((grossRevenue * (commRate / 100))).toFixed(2);
	const paymentFee = +((grossRevenue * (paymentRate / 100))).toFixed(2);

	const totalExpenses = +(cost + shipping + marketplaceCommission + paymentFee + packaging + other).toFixed(2);
	const netProfit = +(grossRevenue - totalExpenses).toFixed(2);
	const profitMarginPercent = grossRevenue > 0 ? +((netProfit / grossRevenue) * 100).toFixed(2) : 0;

	// Break-even price calculation:
	// Price - Discount - (Price - Discount) * (commRate + paymentRate) / 100 - (cost + shipping + packaging + other) = 0
	// Let NetPrice = Price - Discount.
	// NetPrice * (1 - (commRate + paymentRate)/100) = cost + shipping + packaging + other
	const fixedCosts = cost + shipping + packaging + other;
	const rateFactor = 1 - (commRate + paymentRate) / 100;

	let breakEvenSellingPrice = 0;
	if (rateFactor > 0) {
		breakEvenSellingPrice = +(fixedCosts / rateFactor + discount).toFixed(2);
	}

	// Suggested price for target margin:
	// Margin = NetProfit / NetPrice = 1 - totalExpenses / NetPrice = targetMargin / 100
	// NetPrice * (1 - (commRate + paymentRate)/100 - targetMargin/100) = fixedCosts
	let suggestedPriceForTargetMargin: number | undefined = undefined;
	if (!isNaN(targetMargin) && targetMargin > 0 && targetMargin < 100) {
		const targetFactor = 1 - (commRate + paymentRate) / 100 - targetMargin / 100;
		if (targetFactor > 0) {
			suggestedPriceForTargetMargin = +(fixedCosts / targetFactor + discount).toFixed(2);
		}
	}

	return {
		grossRevenue,
		marketplaceCommission,
		paymentFee,
		packagingCost: packaging,
		otherExpenses: other,
		productCost: cost,
		sellerPaidShippingFee: shipping,
		totalExpenses,
		netProfit,
		profitMarginPercent,
		breakEvenSellingPrice,
		suggestedPriceForTargetMargin,
		targetMarginPercent: !isNaN(targetMargin) ? targetMargin : undefined
	};
}

function createErrorResult(countryCode: CountryCode | any, weight: number, errorMsg: string): CalculationResult {
	const meta = getCountryMetadata(countryCode);
	return {
		success: false,
		countryCode: (countryCode || 'BN') as CountryCode,
		countryName: meta ? meta.countryName : 'Tidak Diketahui',
		zoneCode: 'NONE',
		zoneName: 'Tidak Diketahui',
		inputWeightG: weight,
		chargedWeightG: 0,
		bracketWeightG: 0,
		quantity: 1,
		currency: meta ? meta.currency : 'MYR',
		unitTotalShipping: 0,
		unitBuyerPaid: 0,
		unitSellerPaid: 0,
		totalShipping: 0,
		buyerPaidShipping: 0,
		sellerPaidShipping: 0,
		tariffVersion: meta ? meta.version : 'N/A',
		effectiveDate: meta ? meta.effectiveDate : 'N/A',
		sourceUrl: meta ? meta.sourceUrl : '',
		calculatedAt: new Date().toISOString(),
		explanation: [],
		error: errorMsg
	};
}
