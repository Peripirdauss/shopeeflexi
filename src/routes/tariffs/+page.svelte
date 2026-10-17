<script lang="ts">
	import type { PageProps } from './$types';
	import { COUNTRIES, formatCurrency, getRawRates } from '$lib/calculator/tariffs';
	import type { CountryCode } from '$lib/calculator/types';
	import {
		Database,
		Search,
		CheckCircle2,
		ExternalLink,
		UploadCloud,
		History,
		AlertCircle,
		FileSpreadsheet,
		ChevronLeft,
		ChevronRight,
		ShieldCheck,
		Filter
	} from 'lucide-svelte';

	let { data }: PageProps = $props();
	let tariffs = $derived(data.tariffs);
	let auditLogs = $derived(data.auditLogs);
	let countries = $derived(data.countries);

	let selectedCountry = $state<CountryCode>('SG');
	let searchWeight = $state('');
	let currentPage = $state(1);
	let pageSize = $state(20);

	let countryMeta = $derived(COUNTRIES[selectedCountry]);
	let countryTariffInfo = $derived(tariffs.find((t: any) => t.country_code === selectedCountry));

	// Load rates for selected country
	let rates = $derived.by(() => {
		return getRawRates(selectedCountry);
	});

	// Filtered rates by weight
	let filteredRates = $derived.by(() => {
		let list = rates;
		if (searchWeight.trim()) {
			const w = parseInt(searchWeight.replace(/[^0-9]/g, ''));
			if (!isNaN(w)) {
				list = list.filter((r) => r.weight === w || String(r.weight).startsWith(String(w)));
			}
		}
		return list;
	});

	let paginatedRates = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredRates.slice(start, start + pageSize);
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filteredRates.length / pageSize)));

	function selectCountry(code: CountryCode) {
		selectedCountry = code;
		searchWeight = '';
		currentPage = 1;
	}
</script>

<svelte:head>
	<title>Database & Manajemen Tarif Resmi - Shopee FLEXI Ekspor</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
				Database & Manajemen Tarif Resmi
			</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Jelajahi 15.000 baris tarif resmi Shopee FLEXI Ekspor, riwayat audit versi dokumen, dan tautan referensi langsung.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href={countryMeta.sourceUrl}
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
			>
				<ExternalLink class="w-3.5 h-3.5 text-blue-600" />
				<span>Unduh PDF Asli ({selectedCountry})</span>
			</a>
		</div>
	</div>

	<!-- Country Selector Tabs -->
	<div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
		{#each countries as c}
			<button
				onclick={() => selectCountry(c.countryCode)}
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors {selectedCountry === c.countryCode
					? 'bg-blue-600 text-white shadow-xs'
					: 'bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}"
			>
				<span class="px-1.5 py-0.5 rounded text-[10px] {selectedCountry === c.countryCode ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} font-bold">
					{c.countryCode}
				</span>
				<span>{c.countryName}</span>
				<span class="text-[10px] opacity-80">({c.currency})</span>
			</button>
		{/each}
	</div>

	<!-- Country Metadata & Verification Badge Card -->
	<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
			<div class="flex items-center gap-3">
				<div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold text-sm">
					{countryMeta.countryCode}
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h3 class="text-base font-bold text-slate-900 dark:text-white">
							{countryMeta.countryName}
						</h3>
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
							<ShieldCheck class="w-3 h-3 text-emerald-600" />
							<span>Terverifikasi Shopee Edukasi</span>
						</span>
					</div>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
						Versi Dokumen: <strong class="text-slate-700 dark:text-slate-300 font-mono">{countryMeta.version}</strong> • Berlaku Efektif: <strong class="text-slate-700 dark:text-slate-300">{countryMeta.effectiveDate}</strong>
					</p>
				</div>
			</div>

			<div class="text-xs text-slate-500 space-y-0.5 sm:text-right">
				<div>Mata Uang Resmi: <strong class="text-slate-800 dark:text-slate-200">{countryMeta.currency}</strong></div>
				<div>Total Baris Bracket: <strong class="text-blue-600 dark:text-blue-400 tabular-nums">3.000 Baris (10 g - 30.000 g)</strong></div>
			</div>
		</div>

		<div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200/50 dark:border-slate-800">
			<strong>Catatan Aturan Khusus:</strong> {countryMeta.notes}
		</div>
	</div>

	<!-- TARIFF RATES TABLE & SEARCH -->
	<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
					Tabel Tarif Resmi {countryMeta.countryName}
				</h4>
				<span class="text-xs text-slate-400">({filteredRates.length.toLocaleString('id-ID')} baris)</span>
			</div>

			<!-- Search by Weight -->
			<div class="relative min-w-[240px]">
				<Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
				<input
					type="text"
					bind:value={searchWeight}
					placeholder="Cari berat (misal: 250, 1500)..."
					class="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
				/>
			</div>
		</div>

		<!-- Table Rendering -->
		<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
			<table class="w-full text-xs text-left">
				<thead class="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
					{#if countryMeta.hasZones}
						{#if selectedCountry === 'MY'}
							<tr>
								<th rowspan="2" class="p-2.5 border-r border-slate-200 dark:border-slate-800">Berat (g)</th>
								<th colspan="3" class="p-2.5 text-center bg-blue-50/50 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-800">
									Malaysia Barat (Semenanjung)
								</th>
								<th colspan="3" class="p-2.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
									Malaysia Timur (Sabah & Sarawak)
								</th>
							</tr>
							<tr class="border-t border-slate-200 dark:border-slate-800 text-[11px]">
								<th class="p-2">Total (RM)</th>
								<th class="p-2">Pembeli (RM)</th>
								<th class="p-2 font-bold text-blue-600 border-r border-slate-200 dark:border-slate-800">Penjual (RM)</th>
								<th class="p-2">Total (RM)</th>
								<th class="p-2">Pembeli (RM)</th>
								<th class="p-2 font-bold text-blue-600">Penjual (RM)</th>
							</tr>
						{:else if selectedCountry === 'TH'}
							<tr>
								<th rowspan="2" class="p-2.5 border-r border-slate-200 dark:border-slate-800">Berat (g)</th>
								<th colspan="3" class="p-2.5 text-center bg-blue-50/50 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-800">
									Zona A (Bangkok & Sekitarnya)
								</th>
								<th colspan="3" class="p-2.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
									Zona B (Provinsi Lainnya)
								</th>
							</tr>
							<tr class="border-t border-slate-200 dark:border-slate-800 text-[11px]">
								<th class="p-2">Total (THB)</th>
								<th class="p-2">Pembeli (THB)</th>
								<th class="p-2 font-bold text-blue-600 border-r border-slate-200 dark:border-slate-800">Penjual (THB)</th>
								<th class="p-2">Total (THB)</th>
								<th class="p-2">Pembeli (THB)</th>
								<th class="p-2 font-bold text-blue-600">Penjual (THB)</th>
							</tr>
						{:else if selectedCountry === 'PH'}
							<tr>
								<th rowspan="2" class="p-2.5 border-r border-slate-200 dark:border-slate-800">Berat (g)</th>
								<th colspan="3" class="p-2.5 text-center bg-blue-50/50 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-800">
									Zona A (Metro Manila)
								</th>
								<th colspan="3" class="p-2.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
									Zona B, C, D (Luar Metro Manila)
								</th>
							</tr>
							<tr class="border-t border-slate-200 dark:border-slate-800 text-[11px]">
								<th class="p-2">Total (PHP)</th>
								<th class="p-2">Pembeli (PHP)</th>
								<th class="p-2 font-bold text-blue-600 border-r border-slate-200 dark:border-slate-800">Penjual (PHP)</th>
								<th class="p-2">Total (PHP)</th>
								<th class="p-2">Pembeli (PHP)</th>
								<th class="p-2 font-bold text-blue-600">Penjual (PHP)</th>
							</tr>
						{/if}
					{:else}
						<tr>
							<th class="p-2.5">Berat Produk (Gram)</th>
							<th class="p-2.5">Total Biaya Kirim ({countryMeta.currency})</th>
							<th class="p-2.5">Ditanggung Pembeli ({countryMeta.currency})</th>
							<th class="p-2.5 font-bold text-blue-600">Ditanggung Penjual ({countryMeta.currency})</th>
							<th class="p-2.5">Status Rumus</th>
						</tr>
					{/if}
				</thead>
				<tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
					{#each paginatedRates as r}
						<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
							<td class="p-2.5 font-semibold text-slate-900 dark:text-white tabular-nums border-r border-slate-100 dark:border-slate-800">
								{r.weight} g
							</td>

							{#if countryMeta.hasZones}
								{#if selectedCountry === 'MY'}
									<td class="p-2 tabular-nums">{r.west.total.toFixed(2)}</td>
									<td class="p-2 tabular-nums text-slate-500">{r.west.buyer.toFixed(2)}</td>
									<td class="p-2 tabular-nums font-bold text-blue-600 border-r border-slate-100 dark:border-slate-800">{r.west.seller.toFixed(2)}</td>
									<td class="p-2 tabular-nums">{r.east.total.toFixed(2)}</td>
									<td class="p-2 tabular-nums text-slate-500">{r.east.buyer.toFixed(2)}</td>
									<td class="p-2 tabular-nums font-bold text-blue-600">{r.east.seller.toFixed(2)}</td>
								{:else if selectedCountry === 'TH'}
									<td class="p-2 tabular-nums">{r.zoneA.total.toFixed(2)}</td>
									<td class="p-2 tabular-nums text-slate-500">{r.zoneA.buyer.toFixed(2)}</td>
									<td class="p-2 tabular-nums font-bold text-blue-600 border-r border-slate-100 dark:border-slate-800">{r.zoneA.seller.toFixed(2)}</td>
									<td class="p-2 tabular-nums">{r.zoneB.total.toFixed(2)}</td>
									<td class="p-2 tabular-nums text-slate-500">{r.zoneB.buyer.toFixed(2)}</td>
									<td class="p-2 tabular-nums font-bold text-blue-600">{r.zoneB.seller.toFixed(2)}</td>
								{:else if selectedCountry === 'PH'}
									<td class="p-2 tabular-nums">{r.zoneA.total.toFixed(2)}</td>
									<td class="p-2 tabular-nums text-slate-500">{r.zoneA.buyer.toFixed(2)}</td>
									<td class="p-2 tabular-nums font-bold text-blue-600 border-r border-slate-100 dark:border-slate-800">{r.zoneA.seller.toFixed(2)}</td>
									<td class="p-2 tabular-nums">{r.zoneBCD.total.toFixed(2)}</td>
									<td class="p-2 tabular-nums text-slate-500">{r.zoneBCD.buyer.toFixed(2)}</td>
									<td class="p-2 tabular-nums font-bold text-blue-600">{r.zoneBCD.seller.toFixed(2)}</td>
								{/if}
							{:else}
								<td class="p-2.5 tabular-nums text-slate-700 dark:text-slate-300 font-medium">
									{r.total.toFixed(2)}
								</td>
								<td class="p-2.5 tabular-nums text-slate-500">
									{r.buyer.toFixed(2)}
								</td>
								<td class="p-2.5 tabular-nums font-bold text-blue-600 dark:text-blue-400">
									{r.seller.toFixed(2)}
								</td>
								<td class="p-2.5 text-[11px] text-emerald-600 font-medium">
									Total = Pembeli + Penjual
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination Controls -->
		<div class="flex items-center justify-between text-xs text-slate-500 pt-2">
			<div>
				Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRates.length)} dari {filteredRates.length.toLocaleString('id-ID')} baris
			</div>
			<div class="flex items-center gap-2">
				<button
					disabled={currentPage <= 1}
					onclick={() => currentPage--}
					class="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>
				<span class="tabular-nums">Hal {currentPage} dari {totalPages}</span>
				<button
					disabled={currentPage >= totalPages}
					onclick={() => currentPage++}
					class="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- AUDIT LOGS SECTION -->
	<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
		<div class="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
			<History class="w-4 h-4 text-blue-600" />
			<span>Riwayat Audit & Versi Database Tarif</span>
		</div>

		<div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
			{#each auditLogs as log}
				<div class="py-2.5 flex items-start justify-between gap-4">
					<div class="space-y-0.5">
						<div class="flex items-center gap-2">
							<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
								{log.country_code}
							</span>
							<strong class="text-slate-900 dark:text-white font-medium">{log.action}</strong>
							<span class="text-slate-400 font-mono text-[11px]">{log.version_to}</span>
						</div>
						<p class="text-slate-500 dark:text-slate-400">{log.notes}</p>
					</div>
					<div class="text-[11px] text-slate-400 shrink-0 tabular-nums">
						{new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
