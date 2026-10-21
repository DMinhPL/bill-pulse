import { errorJson, json } from '../../../../server/http';
import { analyzeInflation } from '../../../../server/gemini';
import { currentUser } from '../../../../server/payload';

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await currentUser())) return errorJson('Vui lÃ²ng Ä‘Äƒng nháº­p.', 401);
  try {
    const { itemsComparison } = await request.json();
    if (!itemsComparison || !Array.isArray(itemsComparison) || itemsComparison.length === 0) return errorJson('itemsComparison array is required.', 400);
    return json({ success: true, analysis: await analyzeInflation(itemsComparison) });
  } catch (error: any) { console.error('Error analyzing inflation:', error); return errorJson(error.message || 'Analysis failed', 500); }
}
