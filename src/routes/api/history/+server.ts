import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbRepository } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 50;
	const offset = Number(url.searchParams.get('offset')) || 0;
	const history = dbRepository.getCalculationHistory(limit, offset);
	return json({ success: true, history });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const calculation = await request.json();
		const id = dbRepository.saveCalculationHistory(calculation);
		return json({ success: true, id });
	} catch (e: any) {
		return json({ success: false, error: e.message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	const clearAll = url.searchParams.get('all') === 'true';

	if (clearAll) {
		dbRepository.clearAllHistory();
		return json({ success: true, message: 'Semua riwayat berhasil dihapus.' });
	} else if (id) {
		dbRepository.deleteCalculationHistory(id);
		return json({ success: true, message: 'Riwayat berhasil dihapus.' });
	}

	return json({ success: false, error: 'ID tidak diberikan.' }, { status: 400 });
};
