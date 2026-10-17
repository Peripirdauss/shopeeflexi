<script lang="ts">
	import { parseFile, autoDetectColumnMapping, type ColumnMappingConfig, type RawParsedFile } from '$lib/file-processing/parser';
	import { validateAllRows } from '$lib/file-processing/validator';
	import { processBulkCalculations } from '$lib/file-processing/processor';
	import { exportResultsToXlsx, exportResultsToCsv } from '$lib/file-processing/exporter';
	import { formatCurrency } from '$lib/calculator/tariffs';
	import type { BulkRowResult, BulkSessionSummary, BulkRowValidation } from '$lib/calculator/types';
	import {
		UploadCloud,
		FileSpreadsheet,
		Download,
		CheckCircle2,
		AlertCircle,
		Play,
		RefreshCw,
		Search,
		Filter,
		ArrowUpDown,
		Check,
		FileWarning,
		ChevronLeft,
		ChevronRight,
		FileText,
		Layers
	} from 'lucide-svelte';

	// Workflow steps: 'UPLOAD' -> 'MAP' -> 'VALIDATE' -> 'PROCESSING' -> 'RESULTS'
	type Step = 'UPLOAD' | 'MAP' | 'VALIDATE' | 'PROCESSING' | 'RESULTS';
	let currentStep = $state<Step>('UPLOAD');

	// File & Parsing state
	let selectedFile = $state<File | null>(null);
	let parsedFile = $state<RawParsedFile | null>(null);
	let parseError = $state<string | null>(null);
	let isParsing = $state(false);

	// Mapping state
	let mapping = $state<ColumnMappingConfig>({
		destinationCountry: '',
		weightG: '',
		sku: '',
		productName: '',
		zone: '',
		quantity: '',
		sellingPrice: '',
		productCost: '',
		discount: '',
		additionalSellerCost: ''
	});

	// Validation state
	let validations = $state<BulkRowValidation[]>([]);
	let validCount = $state(0);
	let invalidCount = $state(0);
	let onlyProcessValid = $state(true);

	// Processing state
	let isProcessing = $state(false);
	let progressCurrent = $state(0);
	let progressTotal = $state(0);
	let results = $state<BulkRowResult[]>([]);
	let sessionSummary = $state<BulkSessionSummary | null>(null);

	// Table search, filter, pagination
	let searchQuery = $state('');
	let filterCountry = $state('ALL');
	let filterStatus = $state('ALL');
	let sortField = $state<string>('rowNumber');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let currentPage = $state(1);
	let pageSize = $state(15);

	let saveStatus = $state(false);

	async function handleFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			await processSelectedFile(input.files[0]);
		}
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
			await processSelectedFile(event.dataTransfer.files[0]);
		}
	}

	async function processSelectedFile(file: File) {
		selectedFile = file;
		parseError = null;
		isParsing = true;

		try {
			const parsed = await parseFile(file);
			parsedFile = parsed;
			mapping = autoDetectColumnMapping(parsed.headers);
			currentStep = 'MAP';
		} catch (e: any) {
			parseError = e.message || 'Gagal membaca file.';
		} finally {
			isParsing = false;
		}
	}

	function confirmMapping() {
		if (!parsedFile) return;
		if (!mapping.destinationCountry || !mapping.weightG) {
			parseError = 'Kolom "Negara Tujuan" dan "Berat (gram)" wajib dipetakan!';
			return;
		}

		parseError = null;
		const valRes = validateAllRows(parsedFile.rows, mapping);
		validations = valRes.validations;
		validCount = valRes.validCount;
		invalidCount = valRes.invalidCount;
		currentStep = 'VALIDATE';
	}

	async function startProcessing() {
		currentStep = 'PROCESSING';
		isProcessing = true;
		progressCurrent = 0;
		progressTotal = validations.length;

		// Filter if user chooses only valid rows
		const rowsToProcess = onlyProcessValid
			? validations.filter((v) => v.isValid)
			: validations;

		progressTotal = rowsToProcess.length;

		const { results: procResults, summary } = await processBulkCalculations(rowsToProcess, {
			chunkSize: 100,
			onProgress: (curr, total) => {
				progressCurrent = curr;
				progressTotal = total;
			}
		});

		results = procResults;
		sessionSummary = summary;
		isProcessing = false;
		currentStep = 'RESULTS';
		currentPage = 1;

		// Auto save session to backend SQLite
		try {
			await fetch('/api/bulk-sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: `bulk_${Date.now()}`,
					fileName: selectedFile?.name || 'bulk_import',
					totalRows: summary.totalRows,
					successfulRows: summary.successfulRows,
					failedRows: summary.failedRows,
					summary,
					results: procResults.slice(0, 500) // save sample for quick preview
				})
			});
			saveStatus = true;
		} catch (err) {
			console.warn('Session save notice:', err);
		}
	}

	function resetBulkWorkflow() {
		selectedFile = null;
		parsedFile = null;
		parseError = null;
		validations = [];
		results = [];
		sessionSummary = null;
		currentStep = 'UPLOAD';
	}

	// Filtered & Sorted Results
	let filteredResults = $derived.by(() => {
		let list = results;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter(
				(r) =>
					r.sku.toLowerCase().includes(q) ||
					r.productName.toLowerCase().includes(q) ||
					r.destinationCountry.toLowerCase().includes(q) ||
					String(r.rowNumber).includes(q)
			);
		}

		if (filterCountry !== 'ALL') {
			list = list.filter((r) => r.destinationCountry === filterCountry);
		}

		if (filterStatus !== 'ALL') {
			list = list.filter((r) => r.status === filterStatus);
		}

		list = [...list].sort((a: any, b: any) => {
			let valA = a[sortField];
			let valB = b[sortField];
			if (typeof valA === 'string') valA = valA.toLowerCase();
			if (typeof valB === 'string') valB = valB.toLowerCase();
			if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
			if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});

		return list;
	});

	let paginatedResults = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredResults.slice(start, start + pageSize);
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filteredResults.length / pageSize)));

	function toggleSort(field: string) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}

	async function downloadXlsx(filterOnly: boolean = false) {
		const dataToExport = filterOnly ? filteredResults : results;
		const buffer = await exportResultsToXlsx(dataToExport, sessionSummary || undefined);
		triggerDownload(buffer, 'Hasil_Perhitungan_Shopee_FLEXI.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	}

	function downloadCsv(filterOnly: boolean = false) {
		const dataToExport = filterOnly ? filteredResults : results;
		const csv = exportResultsToCsv(dataToExport);
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		triggerDownload(blob, 'Hasil_Perhitungan_Shopee_FLEXI.csv', 'text/csv');
	}

	function downloadInvalidRows() {
		const invalidRows = results.filter((r) => r.status === 'ERROR');
		const csv = exportResultsToCsv(invalidRows);
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		triggerDownload(blob, 'Baris_Gagal_Koreksi.csv', 'text/csv');
	}

	function triggerDownload(content: Uint8Array | Blob, fileName: string, mime: string) {
		const blob = content instanceof Blob ? content : new Blob([content as any], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Kalkulator Massal Excel & CSV - Shopee FLEXI Ekspor</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
		<div>
			<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
				Kalkulator Massal (Bulk Excel & CSV)
			</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Unggah file produk Anda, petakan kolom secara fleksibel, dan hitung ongkir ribuan produk secara instan.
			</p>
		</div>

		<!-- Template Download Buttons -->
		<div class="flex items-center gap-2">
			<a
				href="/api/template?format=xlsx"
				download
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
			>
				<Download class="w-3.5 h-3.5 text-blue-600" />
				<span>Download Template XLSX</span>
			</a>
			<a
				href="/api/template?format=csv"
				download
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
			>
				<FileText class="w-3.5 h-3.5 text-emerald-600" />
				<span>Template CSV</span>
			</a>
		</div>
	</div>

	<!-- Workflow Step Progress Tracker -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs font-medium">
		<div class="flex items-center gap-2 p-2.5 rounded-lg border transition-colors {currentStep === 'UPLOAD' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300 font-semibold' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500'}">
			<span class="w-5 h-5 rounded-full flex items-center justify-center {currentStep === 'UPLOAD' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'} font-bold text-[10px]">1</span>
			<span>1. Unggah File</span>
		</div>

		<div class="flex items-center gap-2 p-2.5 rounded-lg border transition-colors {currentStep === 'MAP' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300 font-semibold' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500'}">
			<span class="w-5 h-5 rounded-full flex items-center justify-center {currentStep === 'MAP' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'} font-bold text-[10px]">2</span>
			<span>2. Petakan Kolom</span>
		</div>

		<div class="flex items-center gap-2 p-2.5 rounded-lg border transition-colors {currentStep === 'VALIDATE' || currentStep === 'PROCESSING' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300 font-semibold' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500'}">
			<span class="w-5 h-5 rounded-full flex items-center justify-center {currentStep === 'VALIDATE' || currentStep === 'PROCESSING' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'} font-bold text-[10px]">3</span>
			<span>3. Validasi & Hitung</span>
		</div>

		<div class="flex items-center gap-2 p-2.5 rounded-lg border transition-colors {currentStep === 'RESULTS' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500'}">
			<span class="w-5 h-5 rounded-full flex items-center justify-center {currentStep === 'RESULTS' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'} font-bold text-[10px]">4</span>
			<span>4. Hasil & Ekspor</span>
		</div>
	</div>

	<!-- STEP 1: UPLOAD AREA -->
	{#if currentStep === 'UPLOAD'}
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-6 shadow-xs">
			<div
				ondragover={(e) => e.preventDefault()}
				ondrop={handleDrop}
				role="region"
				aria-label="Area unggah file"
				class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 sm:p-12 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-850/30 space-y-4"
			>
				<div class="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
					<UploadCloud class="w-8 h-8" />
				</div>

				<div class="space-y-1">
					<h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
						Tarik & Lepas File Excel / CSV di Sini
					</h3>
					<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
						Mendukung format .xlsx, .xls, dan .csv hingga 10.000 baris produk sekaligus.
					</p>
				</div>

				<div class="pt-2">
					<label class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors">
						<FileSpreadsheet class="w-4 h-4" />
						<span>Pilih File dari Komputer</span>
						<input
							type="file"
							accept=".xlsx, .xls, .csv"
							onchange={handleFileSelected}
							class="hidden"
						/>
					</label>
				</div>
			</div>

			{#if isParsing}
				<div class="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
					<RefreshCw class="w-4 h-4 animate-spin" />
					<span>Sedang membaca dan memindai struktur file...</span>
				</div>
			{/if}

			{#if parseError}
				<div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
					{parseError}
				</div>
			{/if}
		</div>

	<!-- STEP 2: COLUMN MAPPING -->
	{:else if currentStep === 'MAP' && parsedFile}
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
				<div>
					<h3 class="text-base font-bold text-slate-900 dark:text-white">
						Pemetaan Kolom File: {parsedFile.fileName}
					</h3>
					<p class="text-xs text-slate-500 dark:text-slate-400">
						Ditemukan {parsedFile.totalRows.toLocaleString('id-ID')} baris data. Pastikan kolom yang wajib terhubung dengan benar.
					</p>
				</div>
				<button
					onclick={resetBulkWorkflow}
					class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
				>
					Ganti File
				</button>
			</div>

			{#if parseError}
				<div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
					{parseError}
				</div>
			{/if}

			<!-- Mapping Fields Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Mandatory: Destination Country -->
				<div class="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
					<label for="mapCountry" class="block text-xs font-bold text-blue-900 dark:text-blue-300">
						Negara Tujuan <span class="text-rose-500">* (Wajib)</span>
					</label>
					<p class="text-[11px] text-slate-500 dark:text-slate-400">
						Kolom berisi kode negara (BN, PH, MY, SG, TH) atau nama negara.
					</p>
					<select
						id="mapCountry"
						bind:value={mapping.destinationCountry}
						class="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
					>
						<option value="">-- Pilih Kolom dari File --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>

				<!-- Mandatory: Weight -->
				<div class="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
					<label for="mapWeight" class="block text-xs font-bold text-blue-900 dark:text-blue-300">
						Berat Produk (Gram) <span class="text-rose-500">* (Wajib)</span>
					</label>
					<p class="text-[11px] text-slate-500 dark:text-slate-400">
						Kolom berisi berat dalam gram (angka positif, mendukung desimal).
					</p>
					<select
						id="mapWeight"
						bind:value={mapping.weightG}
						class="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
					>
						<option value="">-- Pilih Kolom dari File --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>

				<!-- Optional Fields -->
				<div>
					<label for="mapSku" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
						SKU / Kode Produk (Opsional)
					</label>
					<select
						id="mapSku"
						bind:value={mapping.sku}
						class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
					>
						<option value="">-- Tidak Dipetakan --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="mapName" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
						Nama Produk (Opsional)
					</label>
					<select
						id="mapName"
						bind:value={mapping.productName}
						class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
					>
						<option value="">-- Tidak Dipetakan --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="mapZone" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
						Zona / Wilayah (Opsional)
					</label>
					<select
						id="mapZone"
						bind:value={mapping.zone}
						class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
					>
						<option value="">-- Tidak Dipetakan (Gunakan Zona Standar) --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="mapQty" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
						Kuantitas / Qty (Opsional, Default: 1)
					</label>
					<select
						id="mapQty"
						bind:value={mapping.quantity}
						class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
					>
						<option value="">-- Tidak Dipetakan (Default: 1) --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="mapPrice" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
						Harga Jual Produk (Opsional)
					</label>
					<select
						id="mapPrice"
						bind:value={mapping.sellingPrice}
						class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
					>
						<option value="">-- Tidak Dipetakan --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="mapCost" class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
						HPP / Modal Produk (Opsional)
					</label>
					<select
						id="mapCost"
						bind:value={mapping.productCost}
						class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
					>
						<option value="">-- Tidak Dipetakan --</option>
						{#each parsedFile.headers as h}
							<option value={h}>{h}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Preview First 3 Rows -->
			<div class="space-y-2 pt-2">
				<div class="text-xs font-semibold text-slate-700 dark:text-slate-300">
					Pratinjau Data Awal File (3 Baris Pertama):
				</div>
				<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
					<table class="w-full text-xs text-left">
						<thead class="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
							<tr>
								<th class="p-2">#</th>
								{#each parsedFile.headers.slice(0, 7) as h}
									<th class="p-2 truncate max-w-[150px]">{h}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							{#each parsedFile.rows.slice(0, 3) as r, i}
								<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
									<td class="p-2 font-mono text-slate-400">{i + 2}</td>
									{#each parsedFile.headers.slice(0, 7) as h}
										<td class="p-2 truncate max-w-[150px]">{r[h] ?? '-'}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Confirm Button -->
			<div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
				<button
					onclick={resetBulkWorkflow}
					class="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					Batal
				</button>
				<button
					onclick={confirmMapping}
					class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
				>
					<span>Lanjut ke Validasi Baris</span>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</div>

	<!-- STEP 3: VALIDATION DISPLAY -->
	{:else if currentStep === 'VALIDATE'}
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
				<div>
					<h3 class="text-base font-bold text-slate-900 dark:text-white">
						Hasil Pemeriksaan Validasi Data
					</h3>
					<p class="text-xs text-slate-500 dark:text-slate-400">
						Total {validations.length.toLocaleString('id-ID')} baris data telah dipindai sebelum perhitungan dijalankan.
					</p>
				</div>
				<button
					onclick={() => (currentStep = 'MAP')}
					class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
				>
					Ubah Pemetaan Kolom
				</button>
			</div>

			<!-- Status Summary Cards -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
					<div class="text-xs text-slate-500 dark:text-slate-400">Total Baris File</div>
					<div class="text-2xl font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-1">
						{validations.length.toLocaleString('id-ID')}
					</div>
				</div>

				<div class="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
					<div class="flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
						<span>Baris Valid Siap Dihitung</span>
					</div>
					<div class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
						{validCount.toLocaleString('id-ID')}
					</div>
				</div>

				<div class="p-4 rounded-xl {invalidCount > 0 ? 'bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40' : 'bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800'}">
					<div class="flex items-center gap-1 text-xs font-semibold {invalidCount > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-slate-500'}">
						<AlertCircle class="w-3.5 h-3.5 {invalidCount > 0 ? 'text-rose-600' : 'text-slate-400'}" />
						<span>Baris Bermasalah</span>
					</div>
					<div class="text-2xl font-bold {invalidCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500'} tabular-nums mt-1">
						{invalidCount.toLocaleString('id-ID')}
					</div>
				</div>
			</div>

			<!-- Processing Option Selection -->
			{#if invalidCount > 0}
				<div class="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2 text-xs text-amber-900 dark:text-amber-200">
					<div class="font-semibold flex items-center gap-1.5">
						<AlertCircle class="w-4 h-4 text-amber-600" />
						<span>Ditemukan {invalidCount} baris bermasalah (berat kosong, negara salah, atau melebihi batas).</span>
					</div>
					<p class="text-[11px] text-amber-800 dark:text-amber-300">
						Baris yang tidak valid tidak akan diabaikan secara diam-diam. Anda dapat mengunduh daftar baris bermasalah ini untuk dikoreksi kembali.
					</p>
					<div class="pt-1 flex items-center gap-2">
						<label class="flex items-center gap-2 font-medium cursor-pointer">
							<input type="checkbox" bind:checked={onlyProcessValid} class="rounded border-slate-300 text-blue-600" />
							<span>Hanya proses {validCount} baris valid (abaikan sementara baris bermasalah)</span>
						</label>
					</div>
				</div>
			{/if}

			<!-- Action Trigger -->
			<div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
				<button
					onclick={resetBulkWorkflow}
					class="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					Batal
				</button>
				<button
					onclick={startProcessing}
					disabled={validCount === 0}
					class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-xs transition-colors"
				>
					<Play class="w-3.5 h-3.5" />
					<span>Jalankan Perhitungan ({onlyProcessValid ? validCount : validations.length} Produk)</span>
				</button>
			</div>
		</div>

	<!-- STEP 4: PROCESSING PROGRESS -->
	{:else if currentStep === 'PROCESSING'}
		<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-6 shadow-xs">
			<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600">
				<RefreshCw class="w-7 h-7 animate-spin" />
			</div>

			<div class="space-y-1">
				<h3 class="text-lg font-bold text-slate-900 dark:text-white">
					Sedang Memproses Perhitungan Tarif Shopee FLEXI...
				</h3>
				<p class="text-xs text-slate-500 dark:text-slate-400">
					Mencocokkan setiap produk ke tabel tarif resmi 5 negara tujuan (BN, PH, MY, SG, TH).
				</p>
			</div>

			<!-- Progress Bar -->
			<div class="max-w-md mx-auto space-y-2">
				<div class="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
					<div
						class="h-full bg-blue-600 transition-all duration-200 ease-out"
						style="width: {progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0}%"
					></div>
				</div>
				<div class="flex items-center justify-between text-xs text-slate-500 font-medium tabular-nums">
					<span>{progressCurrent.toLocaleString('id-ID')} selesai</span>
					<span>{progressTotal.toLocaleString('id-ID')} total baris</span>
				</div>
			</div>
		</div>

	<!-- STEP 5: RESULTS & EXPORTS -->
	{:else if currentStep === 'RESULTS' && sessionSummary}
		<div class="space-y-6">
			<!-- Summary Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
				<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
					<span class="text-xs text-slate-500 dark:text-slate-400">Total Baris Diproses</span>
					<div class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
						{sessionSummary.processedRows.toLocaleString('id-ID')}
					</div>
					<span class="text-[11px] text-slate-400">Produk terhitung</span>
				</div>

				<div class="bg-white dark:bg-[#111827] rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 p-4 shadow-xs">
					<span class="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Sukses Dihitung</span>
					<div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
						{sessionSummary.successfulRows.toLocaleString('id-ID')}
					</div>
					<span class="text-[11px] text-emerald-600/80">Tarif resmi ditemukan</span>
				</div>

				<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
					<span class="text-xs text-slate-500 dark:text-slate-400">Negara Tujuan</span>
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-1">
						{Object.keys(sessionSummary.countryBreakdown).length}
					</div>
					<span class="text-[11px] text-slate-400">
						{Object.keys(sessionSummary.countryBreakdown).join(', ') || '-'}
					</span>
				</div>

				<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
					<span class="text-xs text-slate-500 dark:text-slate-400">Baris Bermasalah</span>
					<div class="text-2xl font-bold {sessionSummary.failedRows > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} tabular-nums mt-1">
						{sessionSummary.failedRows.toLocaleString('id-ID')}
					</div>
					<span class="text-[11px] text-slate-400">
						{sessionSummary.failedRows > 0 ? 'Dapat diekspor terpisah' : 'Semua baris valid'}
					</span>
				</div>
			</div>

			<!-- SEPARATE CURRENCY TOTALS (Never mixed!) -->
			<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
				<div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
					<div class="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
						<Layers class="w-4 h-4 text-blue-600" />
						<span>Ringkasan Total Biaya Kirim per Mata Uang (Pemisahan Resmi)</span>
					</div>
					<span class="text-[11px] text-slate-400">Tidak digabung antar mata uang</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{#each Object.entries(sessionSummary.currencies) as [currCode, currData]}
						<div class="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-blue-700 dark:text-blue-400">{currCode}</span>
								<span class="text-[11px] text-slate-500">{currData.totalProducts} pcs</span>
							</div>
							<div class="pt-1">
								<div class="text-[11px] text-slate-500">Ongkir Ditanggung Penjual:</div>
								<div class="text-base font-bold text-slate-900 dark:text-white tabular-nums">
									{formatCurrency(currData.totalSellerPaid, currCode)}
								</div>
							</div>
							<div class="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/40 dark:border-slate-800">
								<span>Ongkir Pembeli:</span>
								<span class="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
									{formatCurrency(currData.totalBuyerPaid, currCode)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- EXPORT & FILTER TOOLBAR -->
			<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
				<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
					<!-- Search & Filters -->
					<div class="flex flex-wrap items-center gap-2 flex-1">
						<div class="relative min-w-[200px]">
							<Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Cari SKU, Nama Produk, No. Baris..."
								class="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
							/>
						</div>

						<select
							bind:value={filterCountry}
							class="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
						>
							<option value="ALL">Semua Negara</option>
							{#each Object.keys(sessionSummary.countryBreakdown) as c}
								<option value={c}>{c}</option>
							{/each}
						</select>

						<select
							bind:value={filterStatus}
							class="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
						>
							<option value="ALL">Semua Status</option>
							<option value="SUCCESS">Hanya Sukses</option>
							<option value="ERROR">Hanya Bermasalah</option>
						</select>
					</div>

					<!-- Export Action Buttons -->
					<div class="flex items-center gap-2 shrink-0">
						<button
							onclick={() => downloadXlsx(false)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
						>
							<Download class="w-3.5 h-3.5" />
							<span>Download Semua (XLSX)</span>
						</button>

						<button
							onclick={() => downloadCsv(false)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
						>
							<span>CSV</span>
						</button>

						{#if sessionSummary.failedRows > 0}
							<button
								onclick={downloadInvalidRows}
								class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
							>
								<FileWarning class="w-3.5 h-3.5" />
								<span>Download Baris Gagal</span>
							</button>
						{/if}

						<button
							onclick={resetBulkWorkflow}
							class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
						>
							<RefreshCw class="w-3 h-3" />
							<span>Hitung File Baru</span>
						</button>
					</div>
				</div>

				<!-- RESULTS TABLE -->
				<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
					<table class="w-full text-xs text-left">
						<thead class="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
							<tr>
								<th class="p-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onclick={() => toggleSort('rowNumber')}>
									<div class="flex items-center gap-1">
										<span>No</span>
										<ArrowUpDown class="w-3 h-3 text-slate-400" />
									</div>
								</th>
								<th class="p-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onclick={() => toggleSort('sku')}>
									<div class="flex items-center gap-1">
										<span>SKU</span>
										<ArrowUpDown class="w-3 h-3 text-slate-400" />
									</div>
								</th>
								<th class="p-2.5">Nama Produk</th>
								<th class="p-2.5">Tujuan</th>
								<th class="p-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onclick={() => toggleSort('inputWeightG')}>
									<div class="flex items-center gap-1">
										<span>Berat (g)</span>
										<ArrowUpDown class="w-3 h-3 text-slate-400" />
									</div>
								</th>
								<th class="p-2.5">Bracket</th>
								<th class="p-2.5">Ongkir Penjual</th>
								<th class="p-2.5">Ongkir Pembeli</th>
								<th class="p-2.5">Total Ongkir</th>
								<th class="p-2.5">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
							{#if paginatedResults.length === 0}
								<tr>
									<td colspan="10" class="p-8 text-center text-slate-400">
										Tidak ada baris yang sesuai dengan kriteria filter atau pencarian.
									</td>
								</tr>
							{:else}
								{#each paginatedResults as row}
									<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 {row.status === 'ERROR' ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''}">
										<td class="p-2.5 font-mono text-slate-400 tabular-nums">{row.rowNumber}</td>
										<td class="p-2.5 font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{row.sku || '-'}</td>
										<td class="p-2.5 text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={row.productName}>{row.productName || '-'}</td>
										<td class="p-2.5">
											<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
												{row.destinationCountry}
											</span>
										</td>
										<td class="p-2.5 tabular-nums text-slate-800 dark:text-slate-200">{row.inputWeightG} g</td>
										<td class="p-2.5 tabular-nums text-slate-500">{row.chargedWeightG ? `${row.chargedWeightG} g` : '-'}</td>
										<td class="p-2.5 font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
											{row.status === 'SUCCESS' ? formatCurrency(row.sellerPaidShipping, row.currency) : '-'}
										</td>
										<td class="p-2.5 tabular-nums text-slate-600 dark:text-slate-400">
											{row.status === 'SUCCESS' ? formatCurrency(row.buyerPaidShipping, row.currency) : '-'}
										</td>
										<td class="p-2.5 tabular-nums font-medium text-slate-700 dark:text-slate-300">
											{row.status === 'SUCCESS' ? formatCurrency(row.totalShippingFee, row.currency) : '-'}
										</td>
										<td class="p-2.5">
											{#if row.status === 'SUCCESS'}
												<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
													<Check class="w-3 h-3" />
													<span>Valid</span>
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400" title={row.errorExplanation}>
													<AlertCircle class="w-3 h-3 shrink-0" />
													<span class="truncate max-w-[120px]">{row.errorExplanation}</span>
												</span>
											{/if}
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>

				<!-- Pagination Controls -->
				<div class="flex items-center justify-between text-xs text-slate-500 pt-2">
					<div>
						Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredResults.length)} dari {filteredResults.length.toLocaleString('id-ID')} baris
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
		</div>
	{/if}
</div>
