import type { RequestHandler } from './$types';
import { generateTemplateXlsx, generateTemplateCsv } from '$lib/file-processing/template';

export const GET: RequestHandler = async ({ url }) => {
	const format = url.searchParams.get('format') || 'xlsx';

	if (format === 'csv') {
		const csv = generateTemplateCsv();
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="Template_Shopee_FLEXI_Ekspor.csv"'
			}
		});
	}

	const xlsxBuffer = await generateTemplateXlsx();
	return new Response(new Blob([xlsxBuffer as any]), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="Template_Shopee_FLEXI_Ekspor.xlsx"'
		}
	});
};
