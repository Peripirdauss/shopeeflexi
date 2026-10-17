<script lang="ts">
	import { simulateProfitability } from '$lib/calculator/engine';
	import { COUNTRIES, formatCurrency } from '$lib/calculator/tariffs';
	import type { CountryCode, ProfitSimulatorResult } from '$lib/calculator/types';
	import {
		TrendingUp,
		RotateCcw,
		DollarSign,
		ShieldAlert,
		Percent,
		Target,
		ArrowRight,
		Calculator
	} from 'lucide-svelte';

	let selectedCountry = $state<CountryCode>('SG');
	let sellingPrice = $state<number>(30);
	let productCost = $state<number>(12);
	let sellerPaidShippingFee = $state<number>(2.50);
	let commissionRate = $state<number>(6.5);
	let paymentFeeRate = $state<number>(2.0);
	let discount = $state<number>(0);
	let packagingCost = $state<number>(0.80);
	let otherExpenses = $state<number>(0.50);
	let targetMarginPercent = $state<number>(25);

	let countryMeta = $derived(COUNTRIES[selectedCountry]);

	let simResult = $derived.by<ProfitSimulatorResult>(() => {
		return simulateProfitability({
			sellingPrice,
			productCost,
			sellerPaidShippingFee,
			marketplaceCommissionRatePercent: commissionRate,
			paymentFeeRatePercent: paymentFeeRate,
			discount,
			packagingCost,
			otherExpenses,
			targetMarginPercent
		});
	});

	function handleReset() {
		sellingPrice = 30;
		productCost = 12;
		sellerPaidShippingFee = 2.50;
		commissionRate = 6.5;
		paymentFeeRate = 2.0;
		discount = 0;
		packagingCost = 0.80;
		otherExpenses = 0.50;
		targetMarginPercent = 25;
	}
</script>

<svelte:head>
	<title>Simulator Harga & Profitabilitas Produk - Shopee FLEXI Ekspor</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
				Simulator Harga & Profitabilitas Produk
			</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Simulasikan margin laba, titik impas (break-even), dan rekomendasi harga jual ekspor setelah memperhitungkan beban ongkir seller.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/calculator"
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
			>
				<Calculator class="w-3.5 h-3.5 text-blue-600" />
				<span>Cek Tarif Ongkir Produk</span>
			</a>
		</div>
	</div>

	<!-- Main Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- INPUT PARAMETERS (7 Cols) -->
		<div class="lg:col-span-7 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
				<div class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
					<TrendingUp class="w-4 h-4 text-emerald-600" />
					<span>Komponen Biaya & Harga Produk</span>
				</div>
				<button
					type="button"
					onclick={handleReset}
					class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
				>
					<RotateCcw class="w-3 h-3" />
					<span>Reset Default</span>
				</button>
			</div>

			<div class="space-y-4 text-xs">
				<!-- Destination Country / Currency selection -->
				<div>
					<label for="currencyCountry" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
						Negara Tujuan / Mata Uang Perhitungan
					</label>
					<select
						id="currencyCountry"
						bind:value={selectedCountry}
						class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
					>
						{#each Object.values(COUNTRIES) as c}
							<option value={c.countryCode}>
								{c.countryName} ({c.countryCode}) • Mata Uang: {c.currency}
							</option>
						{/each}
					</select>
				</div>

				<!-- Selling Price & Product Cost -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="sellingPrice" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
							Harga Jual Produk ({countryMeta.currency}) <span class="text-rose-500">*</span>
						</label>
						<input
							type="number"
							id="sellingPrice"
							bind:value={sellingPrice}
							step="any"
							min="0"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums font-semibold"
						/>
					</div>

					<div>
						<label for="productCost" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
							HPP / Biaya Modal Produk ({countryMeta.currency}) <span class="text-rose-500">*</span>
						</label>
						<input
							type="number"
							id="productCost"
							bind:value={productCost}
							step="any"
							min="0"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums font-semibold"
						/>
					</div>
				</div>

				<!-- Shipping Fee Paid by Seller -->
				<div class="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1.5">
					<div class="flex items-center justify-between">
						<label for="sellerShipping" class="block font-bold text-blue-900 dark:text-blue-300">
							Beban Ongkir Ditanggung Penjual ({countryMeta.currency})
						</label>
						<span class="text-[11px] text-blue-700/80 dark:text-blue-400">Dari Tabel Tarif FLEXI</span>
					</div>
					<input
						type="number"
						id="sellerShipping"
						bind:value={sellerPaidShippingFee}
						step="any"
						min="0"
						class="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-850 border border-blue-300 dark:border-blue-800 text-slate-900 dark:text-white tabular-nums font-bold"
					/>
					<p class="text-[11px] text-slate-500 dark:text-slate-400">
						Masukkan nilai ongkir seller hasil perhitungan kalkulator Shopee FLEXI Ekspor untuk berat produk Anda.
					</p>
				</div>

				<!-- Marketplace Fees & Commissions -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
					<div>
						<label for="commissionRate" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
							Komisi Marketplace (%)
						</label>
						<div class="relative">
							<input
								type="number"
								id="commissionRate"
								bind:value={commissionRate}
								step="0.1"
								min="0"
								max="100"
								class="w-full pl-3 pr-8 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
							/>
							<span class="absolute right-3 top-2 text-slate-400 font-semibold">%</span>
						</div>
					</div>

					<div>
						<label for="paymentFee" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
							Biaya Layanan / Transaksi (%)
						</label>
						<div class="relative">
							<input
								type="number"
								id="paymentFee"
								bind:value={paymentFeeRate}
								step="0.1"
								min="0"
								max="100"
								class="w-full pl-3 pr-8 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
							/>
							<span class="absolute right-3 top-2 text-slate-400 font-semibold">%</span>
						</div>
					</div>
				</div>

				<!-- Operational Costs -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div>
						<label for="discount" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
							Diskon ({countryMeta.currency})
						</label>
						<input
							type="number"
							id="discount"
							bind:value={discount}
							step="any"
							min="0"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
						/>
					</div>

					<div>
						<label for="packaging" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
							Kemasan ({countryMeta.currency})
						</label>
						<input
							type="number"
							id="packaging"
							bind:value={packagingCost}
							step="any"
							min="0"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
						/>
					</div>

					<div>
						<label for="other" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
							Lainnya ({countryMeta.currency})
						</label>
						<input
							type="number"
							id="other"
							bind:value={otherExpenses}
							step="any"
							min="0"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
						/>
					</div>
				</div>

				<!-- Target Profit Margin -->
				<div class="pt-2">
					<label for="targetMargin" class="block font-medium text-slate-700 dark:text-slate-300 mb-1">
						Target Margin Keuntungan Bersih yang Diinginkan (%)
					</label>
					<div class="relative max-w-xs">
						<input
							type="number"
							id="targetMargin"
							bind:value={targetMarginPercent}
							step="1"
							min="1"
							max="90"
							class="w-full pl-3 pr-8 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums font-semibold"
						/>
						<span class="absolute right-3 top-2 text-slate-400 font-semibold">%</span>
					</div>
				</div>
			</div>
		</div>

		<!-- OUTPUT METRICS (5 Cols) -->
		<div class="lg:col-span-5 space-y-4">
			<!-- Net Profit Summary Card -->
			<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
				<div class="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
					<div>
						<span class="text-xs uppercase tracking-wider font-semibold text-slate-400">Hasil Simulasi Laba</span>
						<h3 class="text-base font-bold text-slate-900 dark:text-white mt-0.5">
							{countryMeta.countryName} ({countryMeta.currency})
						</h3>
					</div>
					<div class="text-right">
						<span class="px-2 py-0.5 rounded text-xs font-bold {simResult.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}">
							Margin: {simResult.profitMarginPercent}%
						</span>
					</div>
				</div>

				<!-- Net Profit Hero -->
				<div class="p-4 rounded-xl {simResult.netProfit >= 0 ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'} space-y-1">
					<div class="text-xs font-semibold">Estimasi Laba Bersih Per Produk</div>
					<div class="text-3xl font-extrabold tracking-tight tabular-nums {simResult.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">
						{formatCurrency(simResult.netProfit, countryMeta.currency)}
					</div>
					<div class="text-[11px] text-slate-500 dark:text-slate-400">
						Pendapatan Bersih: {formatCurrency(simResult.grossRevenue, countryMeta.currency)} • Beban Total: {formatCurrency(simResult.totalExpenses, countryMeta.currency)}
					</div>
				</div>

				<!-- Pricing Recommendations -->
				<div class="grid grid-cols-2 gap-3 pt-1">
					<div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-1">
						<div class="text-[11px] text-slate-500 dark:text-slate-400">Harga Jual Impas (BEP)</div>
						<div class="text-base font-bold text-slate-900 dark:text-white tabular-nums">
							{formatCurrency(simResult.breakEvenSellingPrice, countryMeta.currency)}
						</div>
						<div class="text-[10px] text-slate-400">Laba = 0 ({countryMeta.currency})</div>
					</div>

					<div class="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
						<div class="text-[11px] text-blue-900 dark:text-blue-300 font-semibold">Harga Target {targetMarginPercent}% Margin</div>
						<div class="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums">
							{simResult.suggestedPriceForTargetMargin ? formatCurrency(simResult.suggestedPriceForTargetMargin, countryMeta.currency) : '-'}
						</div>
						<div class="text-[10px] text-blue-800/80 dark:text-blue-400/80">Rekomendasi jual</div>
					</div>
				</div>

				<!-- Expenses Itemized Breakdown -->
				<div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
					<div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
						<span>HPP / Biaya Modal Produk:</span>
						<strong class="tabular-nums text-slate-800 dark:text-slate-200">{formatCurrency(simResult.productCost, countryMeta.currency)}</strong>
					</div>
					<div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
						<span>Beban Ongkir Penjual (FLEXI):</span>
						<strong class="tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(simResult.sellerPaidShippingFee, countryMeta.currency)}</strong>
					</div>
					<div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
						<span>Komisi Marketplace ({commissionRate}%):</span>
						<strong class="tabular-nums text-slate-800 dark:text-slate-200">{formatCurrency(simResult.marketplaceCommission, countryMeta.currency)}</strong>
					</div>
					<div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
						<span>Biaya Layanan/Transaksi ({paymentFeeRate}%):</span>
						<strong class="tabular-nums text-slate-800 dark:text-slate-200">{formatCurrency(simResult.paymentFee, countryMeta.currency)}</strong>
					</div>
					<div class="flex justify-between py-1">
						<span>Biaya Kemasan & Operasional Lain:</span>
						<strong class="tabular-nums text-slate-800 dark:text-slate-200">{formatCurrency(simResult.packagingCost + simResult.otherExpenses, countryMeta.currency)}</strong>
					</div>
				</div>

				<!-- Disclaimer Banner -->
				<div class="p-3 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-200/50 dark:border-slate-800 flex items-start gap-2">
					<ShieldAlert class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
					<p>
						Perhitungan simulator ini adalah estimasi perencanaan penjual independen dan bukan jaminan pembayaran atau settlement resmi dari pihak Shopee.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
