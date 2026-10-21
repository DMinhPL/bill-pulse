import { errorJson, json } from '../../../../../server/http';
import { currentUser, payload } from '../../../../../server/payload';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return errorJson('Vui lÃ²ng Ä‘Äƒng nháº­p.', 401);
  try {
    const p = await payload();
    await p.delete({ collection: 'bills', id: (await params).id, user, overrideAccess: false });
    return json({ success: true });
  } catch (error) {
    return errorJson('KhÃ´ng tÃ¬m tháº¥y hÃ³a Ä‘Æ¡n.', 404);
  }
}
