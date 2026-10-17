import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
	const initialTheme: Theme = browser
		? ((localStorage.getItem('shopee_flexi_theme') as Theme) || 'system')
		: 'system';

	const { subscribe, set } = writable<Theme>(initialTheme);

	function applyTheme(theme: Theme) {
		if (!browser) return;
		localStorage.setItem('shopee_flexi_theme', theme);
		set(theme);

		const isDark =
			theme === 'dark' ||
			(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	if (browser) {
		// Listen for OS scheme change if in system mode
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			const current = (localStorage.getItem('shopee_flexi_theme') as Theme) || 'system';
			if (current === 'system') {
				if (e.matches) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
		});
	}

	return {
		subscribe,
		setTheme: applyTheme
	};
}

export const themeStore = createThemeStore();
