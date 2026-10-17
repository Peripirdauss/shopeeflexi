import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbRepository } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (id) {
		const session = dbRepository.getBulkSessionById(id);
		if (!session) {
			return json({ success: false, error: 'Sesi tidak ditemukan.' }, { status: 404 });
		}
		return json({ success: true, session });
	}

	const limit = Number(url.searchParams.get('limit')) || 20;
	const sessions = dbRepository.getBulkSessions(limit);
	return json({ success: true, sessions });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const id = dbRepository.saveBulkSession(body);
		return json({ success: true, id });
	} catch (e: any) {
		return json({ success: false, error: e.message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (id) {
		dbRepository.deleteBulkSession(id);
		return json({ success: true, message: 'Sesi massal berhasil dihapus.' });
	}
	return json({ success: false, error: 'ID sesi tidak diberikan.' }, { status: 400 });
};
