import { errorJson, json } from '../../../../../server/http';
import { currentUser } from '../../../../../server/payload';

export async function GET() {
  const user = await currentUser();
  if (!user) return errorJson('Vui lÃ²ng Ä‘Äƒng nháº­p.', 401);
  return json({ user: { id: String(user.id), username: user.username, email: user.email, displayName: user.displayName } });
}
