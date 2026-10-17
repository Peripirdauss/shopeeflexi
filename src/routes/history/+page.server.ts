import type { PageServerLoad } from './$types';
import { dbRepository } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const history = dbRepository.getCalculationHistory(100, 0);
	const bulkSessions = dbRepository.getBulkSessions(50);

	return {
		history,
		bulkSessions
	};
};
