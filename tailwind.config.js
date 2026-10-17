/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#eff6ff',
					100: '#dbeafe',
					500: '#2563EB',
					600: '#1d4ed8',
					700: '#1e40af',
					DEFAULT: '#2563EB'
				},
				accent: {
					50: '#f0fdfa',
					100: '#ccfbf1',
					500: '#14B8A6',
					600: '#0d9488',
					DEFAULT: '#14B8A6'
				},
				slate: {
					850: '#151f32',
					900: '#0f172a',
					950: '#0b1120'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
			}
		}
	},
	plugins: []
};
