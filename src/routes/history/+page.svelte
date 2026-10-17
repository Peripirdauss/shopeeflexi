<script lang="ts">
	import type { PageProps } from './$types';
	import { formatCurrency } from '$lib/calculator/tariffs';
	import {
		History,
		Search,
		Trash2,
		Download,
		FileSpreadsheet,
		Layers,
		CheckCircle2,
		AlertCircle,
		ArrowRight,
		Calculator
	} from 'lucide-svelte';

	let { data }: PageProps = $props();
	let historyList = $state<any[]>([]);
	let bulkSessions = $state<any[]>([]);

	$effect(() => {
		historyList = data.history || [];
		bulkSessions = data.bulkSessions || [];
	});

	let activeTab = $state<'SINGLE' | 'BULK'>('SINGLE');
	let searchQuery = $state('');
	let filterCountry = $state('ALL');
	let deleteMessage = $state('');

	let filteredSingle = $derived.by(() => {
		let list = historyList;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter(
				(item: any) =>
					(item.product_name && item.product_name.toLowerCase().includes(q)) ||
					(item.sku && item.sku.toLowerCase().includes(q)) ||
					item.country_code.toLowerCase().includes(q)
			);
		}
		if (filterCountry !== 'ALL') {
			list = list.filter((item: any) => item.country_code === filterCountry);
		}
		return list;
	});

	async function deleteItem(id: string) {
		try {
			const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
			if (res.ok) {
				historyList = historyList.filter((item: any) => item.id !== id);
				deleteMessage = 'Catatan berhasil dihapus.';
				setTimeout(() => (deleteMessage = ''), 2500);
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function deleteSession(id: string) {
		try {
			const res = await fetch(`/api/bulk-sessions?id=${id}`, { method: 'DELETE' });
			if (res.ok) {
				bulkSessions = bulkSessions.filter((s: any) => s.id !== id);
				deleteMessage = 'Sesi massal berhasil dihapus.';
				setTimeout(() => (deleteMessage = ''), 2500);
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function clearAll() {
		if (!confirm('Apakah Anda yakin ingin menghapus seluruh riwayat perhitungan dan sesi impor?')) return;
		try {
			const res = await fetch('/api/history?all=true', { method: 'DELETE' });
			if (res.ok) {
				historyList = [];
				bulkSessions = [];
				deleteMessage = 'Seluruh riwayat berhasil dibersihkan.';
				setTimeout(() => (deleteMessage = ''), 2500);
			}
		} catch (err) {
			console.error(err);
		}
	}

	function exportHistoryCsv() {
		const headers = [
			'Waktu',
			'SKU',
			'Nama Produk',
			'Negara',
			'Zona',
			'Berat (g)',
			'Bracket (g)',
			'Qty',
			'Mata Uang',
			'Total Ongkir',
			'Ongkir Pembeli',
			'Ongkir Penjual',
			'Versi Tarif'
		];
		const rows = filteredSingle.map((r: any) => [
			r.created_at,
			r.sku || '',
			r.product_name || '',
			r.country_code,
			r.zone_name,
			r.input_weight_g,
			r.bracket_weight_g,
			r.quantity,
			r.currency,
			r.total_shipping,
			r.buyer_paid_shipping,
			r.seller_paid_shipping,
			r.tariff_version
		]);

		const csvContent = [headers.join(','), ...rows.map((e: any[]) => e.map((val: any) => `"${val}"`).join(','))].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `Riwayat_Perhitungan_${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Riwayat Hasil Perhitungan - Shopee FLEXI Ekspor</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
				Riwayat Hasil Perhitungan
			</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Akses perhitungan sebelumnya untuk produk tunggal maupun sesi impor massal file spreadsheet.
			</p>
		</div>

		<div class="flex items-center gap-2">
			{#if historyList.length > 0 || bulkSessions.length > 0}
				<button
					onclick={exportHistoryCsv}
					class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
				>
					<Download class="w-3.5 h-3.5 text-blue-600" />
					<span>Ekspor Riwayat (CSV)</span>
				</button>
				<button
					onclick={clearAll}
					class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
				>
					<Trash2 class="w-3.5 h-3.5" />
					<span>Bersihkan Semua</span>
				</button>
			{/if}
		</div>
	</div>

	{#if deleteMessage}
		<div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
			{deleteMessage}
		</div>
	{/if}

	<!-- Tab Switcher -->
	<div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
		<button
			onclick={() => (activeTab = 'SINGLE')}
			class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors {activeTab === 'SINGLE'
				? 'border-blue-600 text-blue-600 dark:text-blue-400'
				: 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<Calculator class="w-4 h-4" />
			<span>Perhitungan Tunggal ({historyList.length})</span>
		</button>

		<button
			onclick={() => (activeTab = 'BULK')}
			class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors {activeTab === 'BULK'
				? 'border-blue-600 text-blue-600 dark:text-blue-400'
				: 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<FileSpreadsheet class="w-4 h-4" />
			<span>Sesi Impor Massal ({bulkSessions.length})</span>
		</button>
	</div>

	<!-- TAB 1: SINGLE CALCULATIONS -->
	{#if activeTab === 'SINGLE'}
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
			<!-- Search & Filter Bar -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div class="relative min-w-[240px]">
					<Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari SKU, Nama Produk, Negara..."
						class="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
					/>
				</div>

				<select
					bind:value={filterCountry}
					class="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
				>
					<option value="ALL">Semua Negara</option>
					<option value="BN">Brunei (BN)</option>
					<option value="PH">Filipina (PH)</option>
					<option value="MY">Malaysia (MY)</option>
					<option value="SG">Singapura (SG)</option>
					<option value="TH">Thailand (TH)</option>
				</select>
			</div>

			<!-- History Table -->
			{#if filteredSingle.length === 0}
				<div class="p-8 text-center text-slate-400 text-xs space-y-2">
					<p>Tidak ada riwayat perhitungan yang ditemukan.</p>
					<a
						href="/calculator"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100"
					>
						<span>Hitung Produk Sekarang</span>
						<ArrowRight class="w-3 h-3" />
					</a>
				</div>
			{:else}
				<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
					<table class="w-full text-xs text-left">
						<thead class="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
							<tr>
								<th class="p-2.5">Waktu</th>
								<th class="p-2.5">SKU / Nama Produk</th>
								<th class="p-2.5">Tujuan</th>
								<th class="p-2.5">Berat</th>
								<th class="p-2.5">Ongkir Penjual</th>
								<th class="p-2.5">Ongkir Pembeli</th>
								<th class="p-2.5">Total Ongkir</th>
								<th class="p-2.5 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
							{#each filteredSingle as r}
								<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
									<td class="p-2.5 text-slate-400 text-[11px] tabular-nums whitespace-nowrap">
										{new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
									</td>
									<td class="p-2.5">
										<div class="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
											{r.product_name || r.sku || '-'}
										</div>
										{#if r.sku && r.product_name}
											<div class="text-[11px] text-slate-400">{r.sku}</div>
										{/if}
									</td>
									<td class="p-2.5">
										<div class="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
											<span>{r.country_code}</span>
										</div>
										<div class="text-[10px] text-slate-400">{r.zone_name}</div>
									</td>
									<td class="p-2.5 tabular-nums text-slate-700 dark:text-slate-300">
										{r.input_weight_g} g
									</td>
									<td class="p-2.5 font-bold text-blue-600 dark:text-blue-400 tabular-nums">
										{formatCurrency(r.seller_paid_shipping, r.currency)}
									</td>
									<td class="p-2.5 tabular-nums text-slate-500">
										{formatCurrency(r.buyer_paid_shipping, r.currency)}
									</td>
									<td class="p-2.5 tabular-nums font-medium text-slate-700 dark:text-slate-300">
										{formatCurrency(r.total_shipping, r.currency)}
									</td>
									<td class="p-2.5 text-right">
										<button
											onclick={() => deleteItem(r.id)}
											class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
											title="Hapus baris ini"
										>
											<Trash2 class="w-3.5 h-3.5" />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

	<!-- TAB 2: BULK SESSIONS -->
	{:else}
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
			{#if bulkSessions.length === 0}
				<div class="p-8 text-center text-slate-400 text-xs space-y-2">
					<p>Belum ada sesi impor massal yang tercatat.</p>
					<a
						href="/bulk"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100"
					>
						<span>Impor File Excel / CSV Sekarang</span>
						<ArrowRight class="w-3 h-3" />
					</a>
				</div>
			{:else}
				<div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
					{#each bulkSessions as session}
						<div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<FileSpreadsheet class="w-4 h-4 text-emerald-600" />
									<h4 class="font-bold text-slate-900 dark:text-white text-sm">
										{session.file_name}
									</h4>
									<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
										{session.successful_rows.toLocaleString('id-ID')} Sukses
									</span>
								</div>
								<p class="text-slate-400 text-[11px]">
									Diimpor pada {new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Total {session.total_rows.toLocaleString('id-ID')} baris
								</p>
							</div>

							<div class="flex items-center gap-2 shrink-0">
								<button
									onclick={() => deleteSession(session.id)}
									class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
								>
									<Trash2 class="w-3.5 h-3.5" />
									<span>Hapus Sesi</span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
