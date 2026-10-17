import type { PageServerLoad } from './$types';
import { dbRepository } from '$lib/server/db';
import { COUNTRIES } from '$lib/calculator/tariffs';

export const load: PageServerLoad = async () => {
	const stats = dbRepository.getDashboardStats();
	return {
		stats,
		countries: Object.values(COUNTRIES)
	};
};
