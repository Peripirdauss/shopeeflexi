import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbRepository } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const country = url.searchParams.get('country');
	if (country) {
		const tariff = dbRepository.getTariffByCountry(country);
		const logs = dbRepository.getAuditLogs(country);
		return json({ success: true, tariff, logs });
	}

	const tariffs = dbRepository.getAllTariffs();
	const logs = dbRepository.getAuditLogs();
	return json({ success: true, tariffs, logs });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		dbRepository.saveTariff(body);
		return json({ success: true, message: 'Tarif berhasil diperbarui dan dipublikasikan.' });
	} catch (e: any) {
		return json({ success: false, error: e.message }, { status: 400 });
	}
};
