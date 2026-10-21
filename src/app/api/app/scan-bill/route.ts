import { errorJson, json } from '../../../../server/http';
import { currentUser } from '../../../../server/payload';
import { scanBill } from '../../../../server/gemini';

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await currentUser())) return errorJson('Vui lòng đăng nhập.', 401);
  try { return json({ success: true, bill: await scanBill(await request.json()) }); }
  catch (error: any) { console.error('Error scanning bill with Gemini:', error); return errorJson(error.message || 'Failed to scan bill. Please ensure Gemini API key is configured.', error.status || 500); }
}
