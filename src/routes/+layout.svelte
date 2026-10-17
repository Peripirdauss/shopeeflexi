<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';
	import { themeStore, type Theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import {
		Calculator,
		UploadCloud,
		History,
		Database,
		TrendingUp,
		Settings,
		LayoutDashboard,
		Sun,
		Moon,
		Laptop,
		Menu,
		X,
		CheckCircle2,
		ExternalLink,
		Package
	} from 'lucide-svelte';

	let { children } = $props();

	let isMobileMenuOpen = $state(false);
	let currentTheme = $state<Theme>('system');

	themeStore.subscribe((val) => {
		currentTheme = val;
	});

	onMount(() => {
		// Initialize theme on mount
		themeStore.setTheme(currentTheme);
	});

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/calculator', label: 'Kalkulator Tunggal', icon: Calculator, badge: 'Utama' },
		{ href: '/bulk', label: 'Kalkulator Massal', icon: UploadCloud, badge: 'Excel/CSV' },
		{ href: '/history', label: 'Riwayat Hasil', icon: History },
		{ href: '/tariffs', label: 'Database Tarif', icon: Database, badge: '5 Negara' },
		{ href: '/simulator', label: 'Simulator Laba', icon: TrendingUp },
		{ href: '/settings', label: 'Pengaturan', icon: Settings }
	];

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}
</script>

<div class="flex min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 font-sans antialiased">
	<!-- DESKTOP SIDEBAR -->
	<aside class="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] shrink-0 sticky top-0 h-screen z-30 select-none">
		<!-- Brand Logo -->
		<div class="flex items-center gap-3 px-6 h-16 border-b border-slate-100 dark:border-slate-800/80">
			<div class="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20">
				<Package class="w-5 h-5 text-white" />
			</div>
			<div>
				<div class="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white tracking-tight">
					Shopee FLEXI
					<span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Ekspor</span>
				</div>
				<p class="text-[11px] text-slate-500 dark:text-slate-400">Kalkulator Ongkir Resmi</p>
			</div>
		</div>

		<!-- Navigation Links -->
		<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
			{#each navItems as item}
				{@const isActive = $page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/')}
				<a
					href={item.href}
					class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive
						? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold shadow-xs'
						: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'}"
				>
					<div class="flex items-center gap-3">
						<item.icon class="w-4 h-4 {isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}" />
						<span>{item.label}</span>
					</div>
					{#if item.badge}
						<span class="text-[10px] font-medium px-1.5 py-0.5 rounded {isActive ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">
							{item.badge}
						</span>
					{/if}
				</a>
			{/each}
		</nav>

		<!-- Sidebar Status & Footer -->
		<div class="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
			<div class="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
				<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
					<CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
					<span>Tarif Terverifikasi</span>
				</div>
				<p class="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
					Data resmi Shopee FLEXI (BN, PH, MY, SG, TH)
				</p>
			</div>

			<a
				href="https://seller.shopee.co.id/edu/article/25432"
				target="_blank"
				rel="noreferrer"
				class="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
			>
				<span>Edukasi Penjual Shopee</span>
				<ExternalLink class="w-3.5 h-3.5 text-slate-400" />
			</a>
		</div>
	</aside>

	<!-- MOBILE DRAWER OVERLAY -->
	{#if isMobileMenuOpen}
		<div
			class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
			onclick={closeMobileMenu}
			onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}
			role="button"
			tabindex="0"
			aria-label="Tutup menu"
		></div>
		<div class="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#111827] z-50 p-4 shadow-xl flex flex-col lg:hidden border-r border-slate-200 dark:border-slate-800">
			<div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
				<div class="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
					<div class="flex items-center justify-center w-7 h-7 rounded bg-blue-600 text-white">
						<Package class="w-4 h-4" />
					</div>
					<span>Shopee FLEXI Ekspor</span>
				</div>
				<button
					onclick={closeMobileMenu}
					class="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
					aria-label="Tutup Menu"
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<nav class="flex-1 py-4 space-y-1 overflow-y-auto">
				{#each navItems as item}
					{@const isActive = $page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/')}
					<a
						href={item.href}
						onclick={closeMobileMenu}
						class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium {isActive
							? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
							: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}"
					>
						<div class="flex items-center gap-3">
							<item.icon class="w-4 h-4 {isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}" />
							<span>{item.label}</span>
						</div>
						{#if item.badge}
							<span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
								{item.badge}
							</span>
						{/if}
					</a>
				{/each}
			</nav>
		</div>
	{/if}

	<!-- MAIN CONTENT CONTAINER -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- TOP BAR -->
		<header class="flex items-center justify-between px-4 sm:px-8 h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md sticky top-0 z-20">
			<div class="flex items-center gap-3">
				<button
					class="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
					onclick={() => (isMobileMenuOpen = true)}
					aria-label="Buka Menu"
				>
					<Menu class="w-5 h-5" />
				</button>
				<h1 class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
					{#if $page.url.pathname === '/'}
						Dashboard Ringkasan
					{:else if $page.url.pathname === '/calculator'}
						Kalkulator Ongkir Tunggal
					{:else if $page.url.pathname === '/bulk'}
						Kalkulator Massal (Excel & CSV)
					{:else if $page.url.pathname === '/history'}
						Riwayat Hasil Perhitungan
					{:else if $page.url.pathname === '/tariffs'}
						Database & Manajemen Tarif Resmi
					{:else if $page.url.pathname === '/simulator'}
						Simulator Harga & Laba Bersih
					{:else if $page.url.pathname === '/settings'}
						Pengaturan Aplikasi
					{:else}
						Kalkulator Shopee FLEXI Ekspor
					{/if}
				</h1>
			</div>

			<!-- Theme Switcher & Actions -->
			<div class="flex items-center gap-2 sm:gap-3">
				<!-- Theme Toggle Segmented Control -->
				<div class="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
					<button
						onclick={() => themeStore.setTheme('light')}
						class="flex items-center justify-center p-1.5 rounded-md text-xs transition-colors {currentTheme === 'light'
							? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
							: 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
						title="Mode Terang"
						aria-label="Mode Terang"
					>
						<Sun class="w-3.5 h-3.5" />
					</button>
					<button
						onclick={() => themeStore.setTheme('dark')}
						class="flex items-center justify-center p-1.5 rounded-md text-xs transition-colors {currentTheme === 'dark'
							? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
							: 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
						title="Mode Gelap"
						aria-label="Mode Gelap"
					>
						<Moon class="w-3.5 h-3.5" />
					</button>
					<button
						onclick={() => themeStore.setTheme('system')}
						class="flex items-center justify-center p-1.5 rounded-md text-xs transition-colors {currentTheme === 'system'
							? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
							: 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
						title="Ikuti Sistem"
						aria-label="Ikuti Sistem"
					>
						<Laptop class="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
		</header>

		<!-- PAGE CONTENT -->
		<main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
			{@render children()}
		</main>

		<!-- MINIMAL FOOTER -->
		<footer class="py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
			<p>
				Kalkulator Independen Shopee FLEXI Ekspor • Dihitung berdasarkan tabel tarif resmi Pusat Edukasi Penjual Shopee Indonesia • Bukan kalkulator resmi milik Shopee.
			</p>
		</footer>
	</div>
</div>
