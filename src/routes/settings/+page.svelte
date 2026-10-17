<script lang="ts">
	import { themeStore, type Theme } from '$lib/stores/theme';
	import {
		Settings,
		Sun,
		Moon,
		Laptop,
		Trash2,
		ShieldCheck,
		ExternalLink,
		Database,
		Lock,
		CheckCircle2,
		AlertTriangle
	} from 'lucide-svelte';

	let currentTheme = $state<Theme>('system');
	let clearStatus = $state('');

	themeStore.subscribe((val) => {
		currentTheme = val;
	});

	async function handleClearDatabase() {
		if (!confirm('Apakah Anda yakin ingin menghapus seluruh riwayat kalkulasi dan sesi impor? Database tarif resmi akan tetap dipertahankan.')) return;
		try {
			const res = await fetch('/api/history?all=true', { method: 'DELETE' });
			if (res.ok) {
				clearStatus = 'Seluruh riwayat perhitungan berhasil dibersihkan dari database lokal.';
				setTimeout(() => (clearStatus = ''), 3000);
			}
		} catch (err) {
			console.error(err);
		}
	}
</script>

<svelte:head>
	<title>Pengaturan Aplikasi - Shopee FLEXI Ekspor</title>
</svelte:head>

<div class="space-y-6 max-w-4xl">
	<!-- Page Header -->
	<div class="pb-4 border-b border-slate-200 dark:border-slate-800">
		<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
			Pengaturan Aplikasi
		</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
			Kelola tampilan antarmuka, privasi data, dan preferensi kalkulator Shopee FLEXI Ekspor Anda.
		</p>
	</div>

	{#if clearStatus}
		<div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
			{clearStatus}
		</div>
	{/if}

	<!-- Section 1: Appearance & Theme -->
	<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
		<div class="pb-3 border-b border-slate-100 dark:border-slate-800">
			<h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
				Tampilan Antarmuka (Tema)
			</h3>
			<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
				Pilih tema warna sesuai kenyamanan kerja Anda. Pilihan Anda akan disimpan secara lokal.
			</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<button
				onclick={() => themeStore.setTheme('light')}
				class="p-4 rounded-xl border text-left flex items-start gap-3 transition-colors {currentTheme === 'light'
					? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 ring-2 ring-blue-600/20'
					: 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'}"
			>
				<Sun class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
				<div>
					<div class="text-sm font-semibold">Mode Terang</div>
					<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Kontras bersih untuk lingkungan kerja terang.</p>
				</div>
			</button>

			<button
				onclick={() => themeStore.setTheme('dark')}
				class="p-4 rounded-xl border text-left flex items-start gap-3 transition-colors {currentTheme === 'dark'
					? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 ring-2 ring-blue-600/20'
					: 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'}"
			>
				<Moon class="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
				<div>
					<div class="text-sm font-semibold">Mode Gelap</div>
					<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Kenyamanan mata untuk penggunaan malam hari.</p>
				</div>
			</button>

			<button
				onclick={() => themeStore.setTheme('system')}
				class="p-4 rounded-xl border text-left flex items-start gap-3 transition-colors {currentTheme === 'system'
					? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 ring-2 ring-blue-600/20'
					: 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'}"
			>
				<Laptop class="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
				<div>
					<div class="text-sm font-semibold">Ikuti Sistem OS</div>
					<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Menyesuaikan otomatis dengan tema sistem operasi.</p>
				</div>
			</button>
		</div>
	</div>

	<!-- Section 2: Data Storage & Privacy -->
	<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
		<div class="pb-3 border-b border-slate-100 dark:border-slate-800">
			<h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
				Penyimpanan Data & Keamanan Privasi
			</h3>
			<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
				Prinsip privasi mandiri tanpa transmisi data sensitif ke server pihak ketiga.
			</p>
		</div>

		<div class="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
			<div class="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800">
				<Lock class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
				<div>
					<strong class="text-slate-800 dark:text-slate-200">Tidak Memerlukan Akun Shopee:</strong>
					<p class="mt-0.5">Aplikasi ini beroperasi 100% mandiri (stand-alone). Kami tidak pernah meminta kata sandi, cookie login, session token, ataupun kredensial akun Shopee Anda.</p>
				</div>
			</div>

			<div class="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800">
				<ShieldCheck class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
				<div>
					<strong class="text-slate-800 dark:text-slate-200">Perhitungan Deterministik Lokal:</strong>
					<p class="mt-0.5">Seluruh perhitungan ongkir dieksekusi secara matematis murni menggunakan tabel tarif resmi yang terverifikasi tanpa bergantung pada API AI eksternal.</p>
				</div>
			</div>
		</div>

		<!-- Reset Database Button -->
		<div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
			<div>
				<div class="text-xs font-semibold text-slate-800 dark:text-slate-200">Bersihkan Riwayat Lokal</div>
				<p class="text-[11px] text-slate-500 dark:text-slate-400">Hapus riwayat perhitungan tunggal dan sesi impor massal.</p>
			</div>

			<button
				onclick={handleClearDatabase}
				class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 transition-colors"
			>
				<Trash2 class="w-3.5 h-3.5" />
				<span>Hapus Semua Riwayat</span>
			</button>
		</div>
	</div>

	<!-- Section 3: Official References & Legal Disclaimer -->
	<div class="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
		<div class="pb-3 border-b border-slate-100 dark:border-slate-800">
			<h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
				Referensi Resmi & Kebijakan
			</h3>
		</div>

		<div class="space-y-3 text-xs text-slate-600 dark:text-slate-400">
			<p>
				Aplikasi ini dibangun untuk membantu penjual Indonesia dalam merencanakan biaya ekspor melalui skema Shopee FLEXI Ekspor. Seluruh data tarif diekstraksi langsung dari dokumen resmi Pusat Edukasi Penjual Shopee Indonesia:
			</p>

			<ul class="space-y-1.5 pl-4 list-disc text-blue-600 dark:text-blue-400">
				<li>
					<a href="https://seller.shopee.co.id/edu/article/25432" target="_blank" rel="noreferrer" class="hover:underline">
						Pusat Edukasi Penjual Shopee: Rincian Biaya Pengiriman Ekspor Shopee FLEXI
					</a>
				</li>
			</ul>

			<div class="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed">
				<strong>Disclaimer:</strong> Aplikasi ini merupakan perangkat lunak independen dan tidak berafiliasi resmi dengan Shopee atau Sea Group. Setiap perubahan kebijakan atau tarif baru oleh Shopee dapat diperbarui melalui modul manajemen tarif.
			</div>
		</div>
	</div>
</div>
