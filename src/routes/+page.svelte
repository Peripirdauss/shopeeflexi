<script lang="ts">
	import type { PageProps } from './$types';
	import { formatCurrency } from '$lib/calculator/tariffs';
	import {
		Calculator,
		UploadCloud,
		CheckCircle2,
		TrendingUp,
		ArrowRight,
		FileSpreadsheet,
		History,
		Package,
		ExternalLink,
		ShieldCheck,
		Layers
	} from 'lucide-svelte';

	let { data }: PageProps = $props();
	let stats = $derived(data.stats);
	let countries = $derived(data.countries);
</script>

<svelte:head>
	<title>Dashboard - Kalkulator Shopee FLEXI Ekspor</title>
</svelte:head>

<div class="space-y-6">
	<!-- Hero Welcome & Quick Action Card -->
	<div class="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 sm:p-8 text-white shadow-sm shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
		<div class="space-y-2 max-w-xl">
			<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-blue-100">
				<ShieldCheck class="w-3.5 h-3.5 text-emerald-300" />
				<span>Tarif Resmi Shopee FLEXI Ekspor 2024 Terverifikasi</span>
			</div>
			<h2 class="text-xl sm:text-2xl font-bold tracking-tight">
				Kalkulator Ongkos Kirim Ekspor Shopee
			</h2>
			<p class="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
				Hitung biaya pengiriman ekspor mandiri secara transparan untuk produk tunggal maupun ribuan produk dalam hitungan detik.
			</p>
		</div>

		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
			<a
				href="/calculator"
				class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
			>
				<Calculator class="w-4 h-4" />
				<span>Hitung Produk Tunggal</span>
			</a>
			<a
				href="/bulk"
				class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/40 hover:bg-blue-500/50 border border-white/20 text-white font-semibold text-xs sm:text-sm transition-colors"
			>
				<UploadCloud class="w-4 h-4" />
				<span>Impor Massal (Excel/CSV)</span>
			</a>
		</div>
	</div>

	<!-- Metric Highlights Row -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-slate-500 dark:text-slate-400">Total Produk Dihitung</span>
				<div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
					<Package class="w-4 h-4" />
				</div>
			</div>
			<div class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-2">
				{stats.totalProductsCalculated.toLocaleString('id-ID')}
			</div>
			<p class="text-[11px] text-slate-400 mt-1">
				{stats.singleCalculationsCount} tunggal • {stats.bulkSessionsCount} sesi massal
			</p>
		</div>

		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-slate-500 dark:text-slate-400">Negara Tujuan Aktif</span>
				<div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
					<CheckCircle2 class="w-4 h-4" />
				</div>
			</div>
			<div class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-2">
				5 Negara
			</div>
			<p class="text-[11px] text-slate-400 mt-1">
				Brunei, Filipina, Malaysia, Singapura, Thailand
			</p>
		</div>

		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-slate-500 dark:text-slate-400">Status Database Tarif</span>
				<div class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
					<Layers class="w-4 h-4" />
				</div>
			</div>
			<div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
				100% Terverifikasi
			</div>
			<p class="text-[11px] text-slate-400 mt-1">
				15.000 baris tarif resmi dari Shopee Seller Hub
			</p>
		</div>
	</div>

	<!-- 5 OFFICIAL DESTINATIONS CARDS -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
				Daftar Negara Tujuan Resmi Shopee FLEXI Ekspor
			</h3>
			<a
				href="/tariffs"
				class="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
			>
				<span>Buka Database Lengkap</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</a>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
			{#each countries as c}
				<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
								{c.countryCode}
							</span>
							<span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
								{c.currency}
							</span>
						</div>

						<div>
							<h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">
								{c.countryName}
							</h4>
							<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
								{c.notes}
							</p>
						</div>
					</div>

					<div class="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
						<span class="text-slate-400">Batas Berat:</span>
						<strong class="text-slate-700 dark:text-slate-300 tabular-nums">
							{(c.maxOrderWeightG / 1000)} kg
						</strong>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- RECENT SESSIONS & CALCULATIONS -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Recent Single Calculations -->
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
				<div class="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
					<History class="w-4 h-4 text-blue-600" />
					<span>Perhitungan Terakhir</span>
				</div>
				<a href="/history" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					Lihat Semua
				</a>
			</div>

			{#if stats.recentCalculations.length === 0}
				<div class="py-8 text-center text-slate-400 text-xs space-y-2">
					<p>Belum ada perhitungan yang disimpan.</p>
					<a
						href="/calculator"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100"
					>
						<span>Mulai Hitung Pertama</span>
						<ArrowRight class="w-3 h-3" />
					</a>
				</div>
			{:else}
				<div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
					{#each stats.recentCalculations as calc}
						<div class="py-2.5 flex items-center justify-between">
							<div class="space-y-0.5">
								<div class="font-medium text-slate-900 dark:text-white">
									{calc.product_name || `Produk ${calc.country_code}`}
								</div>
								<div class="text-[11px] text-slate-400">
									{calc.country_name} • {calc.input_weight_g} g
								</div>
							</div>
							<div class="text-right">
								<div class="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
									{formatCurrency(calc.seller_paid_shipping, calc.currency)}
								</div>
								<div class="text-[10px] text-slate-400">
									Beban Penjual
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent Bulk Sessions -->
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
				<div class="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
					<FileSpreadsheet class="w-4 h-4 text-emerald-600" />
					<span>Sesi Impor Massal Terakhir</span>
				</div>
				<a href="/bulk" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					Impor Baru
				</a>
			</div>

			{#if stats.recentBulkSessions.length === 0}
				<div class="py-8 text-center text-slate-400 text-xs space-y-2">
					<p>Belum ada file Excel atau CSV yang diimpor.</p>
					<a
						href="/bulk"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
					>
						<span>Unggah File Spreadsheet</span>
						<ArrowRight class="w-3 h-3" />
					</a>
				</div>
			{:else}
				<div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
					{#each stats.recentBulkSessions as session}
						<div class="py-2.5 flex items-center justify-between">
							<div class="space-y-0.5">
								<div class="font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={session.file_name}>
									{session.file_name}
								</div>
								<div class="text-[11px] text-slate-400">
									{new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</div>
							</div>
							<div class="text-right">
								<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
									{session.successful_rows.toLocaleString('id-ID')} Produk
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
