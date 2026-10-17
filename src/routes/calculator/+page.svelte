<script lang="ts">
	import { COUNTRIES, formatCurrency, getCountryMetadata } from '$lib/calculator/tariffs';
	import { calculateShippingFee } from '$lib/calculator/engine';
	import type { CalculationResult, CountryCode } from '$lib/calculator/types';
	import {
		Calculator,
		RotateCcw,
		Copy,
		BookmarkPlus,
		Check,
		AlertCircle,
		Info,
		TrendingUp,
		Package,
		ExternalLink,
		ArrowRight
	} from 'lucide-svelte';

	// State
	let productName = $state('');
	let sku = $state('');
	let selectedCountry = $state<CountryCode>('SG');
	let selectedZone = $state('ALL');
	let weightG = $state<number | ''>(250);
	let quantity = $state<number>(1);
	let sellingPrice = $state<number | ''>('');
	let productCost = $state<number | ''>('');
	let discount = $state<number | ''>('');
	let additionalSellerCost = $state<number | ''>('');

	let copyStatus = $state(false);
	let saveStatus = $state(false);
	let saveMessage = $state('');

	// Current country metadata
	let countryMeta = $derived(getCountryMetadata(selectedCountry)!);

	// Reset zone when country changes
	$effect(() => {
		if (selectedCountry) {
			const meta = getCountryMetadata(selectedCountry);
			if (meta && meta.hasZones) {
				selectedZone = meta.zones[0].code;
			} else {
				selectedZone = 'ALL';
			}
		}
	});

	// Calculation result
	let result = $derived.by<CalculationResult | null>(() => {
		if (weightG === '' || isNaN(Number(weightG)) || Number(weightG) <= 0) {
			return null;
		}

		return calculateShippingFee({
			productName: productName.trim() || undefined,
			sku: sku.trim() || undefined,
			countryCode: selectedCountry,
			zoneCode: selectedZone,
			weightG: Number(weightG),
			quantity: Number(quantity) || 1,
			sellingPrice: sellingPrice !== '' ? Number(sellingPrice) : undefined,
			productCost: productCost !== '' ? Number(productCost) : undefined,
			discount: discount !== '' ? Number(discount) : undefined,
			additionalSellerCost: additionalSellerCost !== '' ? Number(additionalSellerCost) : undefined
		});
	});

	function handleReset() {
		productName = '';
		sku = '';
		selectedCountry = 'SG';
		selectedZone = 'ALL';
		weightG = 250;
		quantity = 1;
		sellingPrice = '';
		productCost = '';
		discount = '';
		additionalSellerCost = '';
		saveStatus = false;
		saveMessage = '';
	}

	async function copyToClipboard() {
		if (!result || !result.success) return;
		const text = `Perhitungan Ongkir Shopee FLEXI Ekspor:
Produk: ${productName || '-'} (SKU: ${sku || '-'})
Tujuan: ${result.countryName} - ${result.zoneName}
Berat: ${result.inputWeightG} g (Bracket: ${result.bracketWeightG} g)
Kuantitas: ${result.quantity} pcs
Total Ongkir: ${formatCurrency(result.totalShipping, result.currency)}
Ditanggung Pembeli: ${formatCurrency(result.buyerPaidShipping, result.currency)}
Ditanggung Penjual: ${formatCurrency(result.sellerPaidShipping, result.currency)}
Versi Tarif: ${result.tariffVersion} (${result.effectiveDate})`;

		try {
			await navigator.clipboard.writeText(text);
			copyStatus = true;
			setTimeout(() => (copyStatus = false), 2500);
		} catch (err) {
			console.error('Failed to copy', err);
		}
	}

	async function saveToHistory() {
		if (!result || !result.success) return;
		try {
			const res = await fetch('/api/history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...result,
					productName,
					sku
				})
			});
			if (res.ok) {
				saveStatus = true;
				saveMessage = 'Perhitungan berhasil disimpan ke riwayat!';
				setTimeout(() => {
					saveStatus = false;
					saveMessage = '';
				}, 3000);
			}
		} catch (err) {
			console.error('Failed to save', err);
		}
	}
</script>

<svelte:head>
	<title>Kalkulator Tunggal - Shopee FLEXI Ekspor</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
				Kalkulator Ongkir Tunggal
			</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Hitung tarif resmi Shopee FLEXI per produk dengan rincian biaya pembeli dan penjual secara transparan.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/bulk"
				class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
			>
				<span>Impor Massal (Excel/CSV)</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</a>
		</div>
	</div>

	<!-- Main Calculator Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- INPUT FORM (Left / 7 cols) -->
		<div class="lg:col-span-7 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
				<div class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
					<Calculator class="w-4 h-4 text-blue-600" />
					<span>Parameter Produk & Pengiriman</span>
				</div>
				<button
					type="button"
					onclick={handleReset}
					class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
				>
					<RotateCcw class="w-3 h-3" />
					<span>Reset Form</span>
				</button>
			</div>

			<!-- Form Fields -->
			<div class="space-y-4">
				<!-- Product Name & SKU -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div class="sm:col-span-2">
						<label for="productName" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
							Nama Produk (Opsional)
						</label>
						<input
							type="text"
							id="productName"
							bind:value={productName}
							placeholder="Contoh: Kemeja Batik Pria Slimfit"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
						/>
					</div>
					<div>
						<label for="sku" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
							SKU / Kode
						</label>
						<input
							type="text"
							id="sku"
							bind:value={sku}
							placeholder="BTK-001"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
						/>
					</div>
				</div>

				<!-- Destination Country & Zone -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
					<div>
						<label for="destinationCountry" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
							Negara Tujuan Ekspor <span class="text-rose-500">*</span>
						</label>
						<select
							id="destinationCountry"
							bind:value={selectedCountry}
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
						>
							{#each Object.values(COUNTRIES) as c}
								<option value={c.countryCode}>
									{c.countryName} ({c.countryCode}) • Mata Uang: {c.currency}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="zoneCode" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
							Wilayah / Zona Tujuan
						</label>
						{#if countryMeta.hasZones}
							<select
								id="zoneCode"
								bind:value={selectedZone}
								class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
							>
								{#each countryMeta.zones as z}
									<option value={z.code}>{z.name}</option>
								{/each}
							</select>
						{:else}
							<input
								type="text"
								id="zoneCode"
								disabled
								value="Seluruh Negara (Tanpa Zona Terpisah)"
								class="w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
							/>
						{/if}
					</div>
				</div>

				<!-- Country Info Banner -->
				<div class="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
					<Info class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
					<div class="leading-relaxed">
						<strong>{countryMeta.countryName}:</strong> {countryMeta.notes}
					</div>
				</div>

				<!-- Weight & Quantity -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
					<div>
						<div class="flex items-center justify-between mb-1">
							<label for="weightG" class="text-xs font-medium text-slate-700 dark:text-slate-300">
								Berat Produk (Gram) <span class="text-rose-500">*</span>
							</label>
							<span class="text-[11px] text-slate-500 dark:text-slate-400">Min 10 g • Max 30.000 g</span>
						</div>
						<div class="relative">
							<input
								type="number"
								id="weightG"
								bind:value={weightG}
								step="any"
								min="1"
								max="30000"
								placeholder="250"
								class="w-full pl-3 pr-10 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
							/>
							<span class="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">gram</span>
						</div>
					</div>

					<div>
						<label for="quantity" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
							Kuantitas Unit (Qty)
						</label>
						<input
							type="number"
							id="quantity"
							bind:value={quantity}
							min="1"
							class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
						/>
					</div>
				</div>

				<!-- OPTIONAL PROFITABILITY INPUTS -->
				<div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
					<div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
						<TrendingUp class="w-3.5 h-3.5 text-emerald-600" />
						<span>Simulasi Harga & Laba Produk (Opsional - Mata Uang {countryMeta.currency})</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="sellingPrice" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
								Harga Jual ({countryMeta.currency})
							</label>
							<input
								type="number"
								id="sellingPrice"
								bind:value={sellingPrice}
								step="any"
								placeholder="0.00"
								class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
							/>
						</div>

						<div>
							<label for="productCost" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
								HPP / Modal Produk ({countryMeta.currency})
							</label>
							<input
								type="number"
								id="productCost"
								bind:value={productCost}
								step="any"
								placeholder="0.00"
								class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
							/>
						</div>

						<div>
							<label for="discount" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
								Diskon Produk ({countryMeta.currency})
							</label>
							<input
								type="number"
								id="discount"
								bind:value={discount}
								step="any"
								placeholder="0.00"
								class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
							/>
						</div>

						<div>
							<label for="additionalCost" class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
								Biaya Kemasan / Lainnya ({countryMeta.currency})
							</label>
							<input
								type="number"
								id="additionalCost"
								bind:value={additionalSellerCost}
								step="any"
								placeholder="0.00"
								class="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- RESULTS PANEL (Right / 5 cols) -->
		<div class="lg:col-span-5 space-y-4">
			{#if result && result.success}
				<!-- Main Result Card -->
				<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
					<div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
						<div>
							<span class="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Hasil Perhitungan</span>
							<h3 class="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
								{result.countryName}
							</h3>
						</div>
						<div class="text-right">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
								{result.currency}
							</span>
							<p class="text-[11px] text-slate-400 mt-0.5">{result.zoneName}</p>
						</div>
					</div>

					<!-- Primary Shipping Metric Highlight -->
					<div class="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-blue-900 dark:text-blue-300">Ongkir Ditanggung Penjual</span>
							<span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900/60 font-semibold text-blue-800 dark:text-blue-200">
								Beban Seller
							</span>
						</div>
						<div class="text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-400 tabular-nums">
							{formatCurrency(result.sellerPaidShipping, result.currency)}
						</div>
						<div class="text-[11px] text-blue-800/80 dark:text-blue-300/80">
							{#if result.quantity > 1}
								{result.quantity} pcs × {formatCurrency(result.unitSellerPaid, result.currency)} per unit
							{:else}
								Biaya ekspor yang dipotong dari saldo penjual Shopee
							{/if}
						</div>
					</div>

					<!-- Cost Breakdown Breakdown Grid -->
					<div class="grid grid-cols-2 gap-3">
						<div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
							<div class="text-[11px] text-slate-500 dark:text-slate-400">Ongkir Ditanggung Pembeli</div>
							<div class="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
								{formatCurrency(result.buyerPaidShipping, result.currency)}
							</div>
							<div class="text-[10px] text-slate-400 mt-0.5">
								Dibayar pembeli saat checkout
							</div>
						</div>

						<div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
							<div class="text-[11px] text-slate-500 dark:text-slate-400">Total Biaya Kirim (Tabel)</div>
							<div class="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
								{formatCurrency(result.totalShipping, result.currency)}
							</div>
							<div class="text-[10px] text-slate-400 mt-0.5">
								Total = Pembeli + Penjual
							</div>
						</div>
					</div>

					<!-- Weight & Bracket Details -->
					<div class="py-2.5 px-3 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 text-xs space-y-1.5 border border-slate-200/50 dark:border-slate-800">
						<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
							<span>Berat Input:</span>
							<strong class="text-slate-800 dark:text-slate-200 tabular-nums">{result.inputWeightG} g</strong>
						</div>
						<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
							<span>Bracket Resmi Dikenakan:</span>
							<strong class="text-blue-600 dark:text-blue-400 tabular-nums">{result.bracketWeightG} g (Kelipatan 10 g)</strong>
						</div>
						<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
							<span>Versi Dokumen Tarif:</span>
							<span class="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{result.tariffVersion}</span>
						</div>
					</div>

					<!-- Profitability Preview if Provided -->
					{#if result.pricing}
						<div class="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Estimasi Laba Bersih</span>
								<span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
									Margin {result.pricing.profitMarginPercent}%
								</span>
							</div>
							<div class="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
								{formatCurrency(result.pricing.netProfit, result.currency)}
							</div>
							<div class="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
								Pendapatan Kotor: {formatCurrency(result.pricing.grossRevenue, result.currency)} • Total Biaya: {formatCurrency(result.pricing.totalExpenses, result.currency)}
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex items-center gap-2 pt-2">
						<button
							type="button"
							onclick={copyToClipboard}
							class="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
						>
							{#if copyStatus}
								<Check class="w-3.5 h-3.5" />
								<span>Tersalin!</span>
							{:else}
								<Copy class="w-3.5 h-3.5" />
								<span>Salin Ringkasan</span>
							{/if}
						</button>

						<button
							type="button"
							onclick={saveToHistory}
							class="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors"
							title="Simpan perhitungan ke riwayat"
						>
							{#if saveStatus}
								<Check class="w-3.5 h-3.5 text-emerald-600" />
							{:else}
								<BookmarkPlus class="w-3.5 h-3.5" />
							{/if}
							<span>Simpan</span>
						</button>
					</div>

					{#if saveMessage}
						<div class="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
							{saveMessage}
						</div>
					{/if}
				</div>

				<!-- Step-by-step Calculation Explanation -->
				<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
					<div class="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
						<Info class="w-3.5 h-3.5 text-blue-600" />
						<span>Penjelasan Perhitungan Langkah demi Langkah</span>
					</div>

					<div class="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
						{#each result.explanation as step}
							<div class="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
								<span class="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] shrink-0 mt-0.5">
									{step.step}
								</span>
								<div class="space-y-0.5">
									<strong class="text-slate-800 dark:text-slate-200">{step.title}</strong>
									<p class="text-slate-600 dark:text-slate-400 leading-relaxed">{step.detail}</p>
								</div>
							</div>
						{/each}
					</div>

					<div class="pt-2 text-right">
						<a
							href={result.sourceUrl}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
						>
							<span>Lihat Dokumen PDF Tarif Resmi</span>
							<ExternalLink class="w-3 h-3" />
						</a>
					</div>
				</div>
			{:else if result && !result.success}
				<!-- Error Card -->
				<div class="bg-white dark:bg-[#111827] rounded-xl border border-rose-200 dark:border-rose-900/40 p-5 shadow-xs space-y-3">
					<div class="flex items-center gap-2 text-rose-600 font-semibold text-sm">
						<AlertCircle class="w-4 h-4" />
						<span>Tidak Dapat Menghitung Tarif</span>
					</div>
					<p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
						{result.error}
					</p>
				</div>
			{:else}
				<!-- Empty State -->
				<div class="bg-white dark:bg-[#111827] rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
					<div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600">
						<Package class="w-6 h-6" />
					</div>
					<div class="space-y-1">
						<h4 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Menunggu Input Berat Produk</h4>
						<p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
							Masukkan berat produk dalam gram dan pilih negara tujuan untuk melihat rincian biaya kirim Shopee FLEXI Ekspor secara langsung.
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
