import type { PageServerLoad } from './$types';
import { dbRepository } from '$lib/server/db';
import { COUNTRIES, getRawRates } from '$lib/calculator/tariffs';
import type { CountryCode } from '$lib/calculator/types';

export const load: PageServerLoad = async () => {
	const tariffs = dbRepository.getAllTariffs();
	const auditLogs = dbRepository.getAuditLogs();

	return {
		tariffs,
		auditLogs,
		countries: Object.values(COUNTRIES)
	};
};
