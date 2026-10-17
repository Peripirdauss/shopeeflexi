import { describe, it, expect } from 'vitest';
import { calculateShippingFee, simulateProfitability } from './engine';
import { getApplicableBracketWeight, getCountryMetadata, COUNTRIES } from './tariffs';

describe('Calculation Engine - Tariff Rules & Boundaries', () => {
	it('should support all 5 official destinations with correct currencies', () => {
		expect(COUNTRIES.BN.currency).toBe('MYR');
		expect(COUNTRIES.PH.currency).toBe('PHP');
		expect(COUNTRIES.MY.currency).toBe('MYR');
		expect(COUNTRIES.SG.currency).toBe('SGD');
		expect(COUNTRIES.TH.currency).toBe('THB');
	});

	it('should compute applicable bracket weights properly', () => {
		expect(getApplicableBracketWeight(5)).toBe(10); // <10g ceiling to 10g
		expect(getApplicableBracketWeight(10)).toBe(10); // exact 10g
		expect(getApplicableBracketWeight(10.1)).toBe(20); // 10.1g ceiling to 20g
		expect(getApplicableBracketWeight(19.9)).toBe(20);
		expect(getApplicableBracketWeight(250)).toBe(250);
		expect(getApplicableBracketWeight(250.01)).toBe(260);
		expect(getApplicableBracketWeight(30000)).toBe(30000);
	});

	describe('Brunei Darussalam (BN)', () => {
		it('minimum weight 10g calculation matches official table', () => {
			const res = calculateShippingFee({ countryCode: 'BN', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('MYR');
			expect(res.unitTotalShipping).toBe(27.10);
			expect(res.unitBuyerPaid).toBe(25.00);
			expect(res.unitSellerPaid).toBe(2.10);
			expect(res.totalShipping).toBe(res.buyerPaidShipping + res.sellerPaidShipping);
		});

		it('weight < 10g rounds up to 10g bracket', () => {
			const res = calculateShippingFee({ countryCode: 'BN', weightG: 4.5 });
			expect(res.success).toBe(true);
			expect(res.chargedWeightG).toBe(10);
			expect(res.unitTotalShipping).toBe(27.10);
		});

		it('250g bracket boundary check', () => {
			const res250 = calculateShippingFee({ countryCode: 'BN', weightG: 250 });
			expect(res250.unitTotalShipping).toBe(27.10);
			expect(res250.unitBuyerPaid).toBe(25.00);
			expect(res250.unitSellerPaid).toBe(2.10);

			// 251g rounds to 260g where rate increases to 27.15 (seller 2.15)
			const res251 = calculateShippingFee({ countryCode: 'BN', weightG: 251 });
			expect(res251.chargedWeightG).toBe(260);
			expect(res251.unitTotalShipping).toBe(27.15);
			expect(res251.unitBuyerPaid).toBe(25.00);
			expect(res251.unitSellerPaid).toBe(2.15);
		});

		it('maximum supported weight 30000g', () => {
			const res = calculateShippingFee({ countryCode: 'BN', weightG: 30000 });
			expect(res.success).toBe(true);
			expect(res.chargedWeightG).toBe(30000);
			expect(res.unitTotalShipping).toBe(160.97);
			expect(res.unitBuyerPaid).toBe(25.00);
			expect(res.unitSellerPaid).toBe(135.97);
		});

		it('weight exceeding 30000g returns descriptive error', () => {
			const res = calculateShippingFee({ countryCode: 'BN', weightG: 30001 });
			expect(res.success).toBe(false);
			expect(res.error).toContain('melebihi batas');
		});
	});

	describe('Singapore (SG)', () => {
		it('minimum weight 10g has buyer 1.99 and seller 1.06 SGD', () => {
			const res = calculateShippingFee({ countryCode: 'SG', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('SGD');
			expect(res.unitTotalShipping).toBe(3.05);
			expect(res.unitBuyerPaid).toBe(1.99);
			expect(res.unitSellerPaid).toBe(1.06);
		});

		it('Singapore checkout limit warning for weights > 25kg (25000g)', () => {
			const res = calculateShippingFee({ countryCode: 'SG', weightG: 26000 });
			expect(res.success).toBe(true);
			expect(res.warnings).toBeDefined();
			expect(res.warnings?.[0]).toContain('25 kg');
		});

		it('maximum 30000g has total 48.04, buyer 1.99, seller 46.05 SGD', () => {
			const res = calculateShippingFee({ countryCode: 'SG', weightG: 30000 });
			expect(res.success).toBe(true);
			expect(res.unitTotalShipping).toBe(48.04);
			expect(res.unitBuyerPaid).toBe(1.99);
			expect(res.unitSellerPaid).toBe(46.05);
		});
	});

	describe('Malaysia (MY) - Zones West & East', () => {
		it('Malaysia Barat (West) at 10g has total 7.00, buyer 4.90, seller 2.10', () => {
			const res = calculateShippingFee({ countryCode: 'MY', zoneCode: 'WEST', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('MYR');
			expect(res.unitTotalShipping).toBe(7.00);
			expect(res.unitBuyerPaid).toBe(4.90);
			expect(res.unitSellerPaid).toBe(2.10);
		});

		it('Malaysia Timur (East) at 10g has total 10.10, buyer 8.00, seller 2.10', () => {
			const res = calculateShippingFee({ countryCode: 'MY', zoneCode: 'EAST', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('MYR');
			expect(res.unitTotalShipping).toBe(10.10);
			expect(res.unitBuyerPaid).toBe(8.00);
			expect(res.unitSellerPaid).toBe(2.10);
		});

		it('Malaysia at 30000g has seller fee identical for West and East', () => {
			const resWest = calculateShippingFee({ countryCode: 'MY', zoneCode: 'WEST', weightG: 30000 });
			const resEast = calculateShippingFee({ countryCode: 'MY', zoneCode: 'EAST', weightG: 30000 });
			expect(resWest.unitSellerPaid).toBe(135.98);
			expect(resEast.unitSellerPaid).toBe(135.98);
			expect(resWest.unitTotalShipping).toBe(140.88);
			expect(resEast.unitTotalShipping).toBe(143.98);
		});
	});

	describe('Thailand (TH) - Zones A & B', () => {
		it('Thailand Zona A at 10g has total 41.00, buyer 27.00, seller 14.00', () => {
			const res = calculateShippingFee({ countryCode: 'TH', zoneCode: 'A', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('THB');
			expect(res.unitTotalShipping).toBe(41.00);
			expect(res.unitBuyerPaid).toBe(27.00);
			expect(res.unitSellerPaid).toBe(14.00);
		});

		it('Thailand Zona B at 10g has total 44.00, buyer 30.00, seller 14.00', () => {
			const res = calculateShippingFee({ countryCode: 'TH', zoneCode: 'B', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('THB');
			expect(res.unitTotalShipping).toBe(44.00);
			expect(res.unitBuyerPaid).toBe(30.00);
			expect(res.unitSellerPaid).toBe(14.00);
		});

		it('Thailand at 30000g', () => {
			const resA = calculateShippingFee({ countryCode: 'TH', zoneCode: 'A', weightG: 30000 });
			expect(resA.unitTotalShipping).toBe(1329.70);
			expect(resA.unitBuyerPaid).toBe(27.00);
			expect(resA.unitSellerPaid).toBe(1302.70);
		});
	});

	describe('Filipina (PH) - Zones A & BCD', () => {
		it('PH Zona A at 10g has total 60.00, buyer 40.00, seller 20.00', () => {
			const res = calculateShippingFee({ countryCode: 'PH', zoneCode: 'A', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('PHP');
			expect(res.unitTotalShipping).toBe(60.00);
			expect(res.unitBuyerPaid).toBe(40.00);
			expect(res.unitSellerPaid).toBe(20.00);
		});

		it('PH Zona BCD at 10g has total 80.00, buyer 60.00, seller 20.00', () => {
			const res = calculateShippingFee({ countryCode: 'PH', zoneCode: 'BCD', weightG: 10 });
			expect(res.success).toBe(true);
			expect(res.currency).toBe('PHP');
			expect(res.unitTotalShipping).toBe(80.00);
			expect(res.unitBuyerPaid).toBe(60.00);
			expect(res.unitSellerPaid).toBe(20.00);
		});

		it('PH at 30000g', () => {
			const res = calculateShippingFee({ countryCode: 'PH', zoneCode: 'A', weightG: 30000 });
			expect(res.unitTotalShipping).toBe(6657.80);
			expect(res.unitBuyerPaid).toBe(40.00);
			expect(res.unitSellerPaid).toBe(6617.80);
		});
	});

	describe('Quantity Multiplier and Profitability Integration', () => {
		it('multiplies total and seller shipping when quantity > 1', () => {
			const res = calculateShippingFee({ countryCode: 'BN', weightG: 100, quantity: 3 });
			expect(res.quantity).toBe(3);
			expect(res.unitTotalShipping).toBe(27.10);
			expect(res.totalShipping).toBe(81.30);
			expect(res.buyerPaidShipping).toBe(75.00);
			expect(res.sellerPaidShipping).toBe(6.30);
		});

		it('computes pricing analysis when prices are provided', () => {
			const res = calculateShippingFee({
				countryCode: 'SG',
				weightG: 100,
				quantity: 2,
				sellingPrice: 15.00,
				productCost: 6.00,
				discount: 1.00
			});
			expect(res.pricing).toBeDefined();
			// Effective price = 14 * 2 = 28
			expect(res.pricing?.grossRevenue).toBe(28.00);
			// Total product cost = 6 * 2 = 12
			// Seller shipping = 1.20 * 2 = 2.40
			// Total expenses = 12 + 2.40 = 14.40
			expect(res.pricing?.totalExpenses).toBe(14.40);
			// Net profit = 28 - 14.40 = 13.60
			expect(res.pricing?.netProfit).toBe(13.60);
			expect(res.pricing?.profitMarginPercent).toBeCloseTo(48.57, 1);
		});

		it('handles invalid inputs gracefully', () => {
			const resZero = calculateShippingFee({ countryCode: 'BN', weightG: 0 });
			expect(resZero.success).toBe(false);
			expect(resZero.error).toContain('positif');

			const resNeg = calculateShippingFee({ countryCode: 'BN', weightG: -10 });
			expect(resNeg.success).toBe(false);

			const resBadCountry = calculateShippingFee({ countryCode: 'US' as any, weightG: 100 });
			expect(resBadCountry.success).toBe(false);
			expect(resBadCountry.error).toContain('tidak didukung');
		});
	});
});

describe('Profitability Simulator', () => {
	it('calculates gross revenue, total expenses, net profit and profit margin', () => {
		const sim = simulateProfitability({
			sellingPrice: 100,
			productCost: 40,
			sellerPaidShippingFee: 10,
			marketplaceCommissionRatePercent: 5,
			paymentFeeRatePercent: 2,
			packagingCost: 3,
			otherExpenses: 2
		});
		// Gross revenue = 100
		expect(sim.grossRevenue).toBe(100);
		// Commission 5% = 5, Payment 2% = 2
		expect(sim.marketplaceCommission).toBe(5);
		expect(sim.paymentFee).toBe(2);
		// Total expenses = 40 + 10 + 5 + 2 + 3 + 2 = 62
		expect(sim.totalExpenses).toBe(62);
		// Net profit = 100 - 62 = 38
		expect(sim.netProfit).toBe(38);
		expect(sim.profitMarginPercent).toBe(38);
	});

	it('computes break-even selling price accurately', () => {
		const sim = simulateProfitability({
			sellingPrice: 100,
			productCost: 50,
			sellerPaidShippingFee: 10,
			marketplaceCommissionRatePercent: 10,
			paymentFeeRatePercent: 0
		});
		// Fixed costs = 50 + 10 = 60
		// Rate factor = 1 - 0.10 = 0.90
		// Break-even price = 60 / 0.9 = 66.67
		expect(sim.breakEvenSellingPrice).toBe(66.67);
	});

	it('computes suggested price for target margin', () => {
		const sim = simulateProfitability({
			sellingPrice: 100,
			productCost: 50,
			sellerPaidShippingFee: 10,
			marketplaceCommissionRatePercent: 5,
			paymentFeeRatePercent: 0,
			targetMarginPercent: 20
		});
		// Fixed costs = 60
		// Factor = 1 - 0.05 - 0.20 = 0.75
		// Suggested price = 60 / 0.75 = 80
		expect(sim.suggestedPriceForTargetMargin).toBe(80.00);
	});
});
