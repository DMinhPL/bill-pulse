import { errorJson, json } from '../../../../server/http';
import { fromBill, toBill } from '../../../../server/billDto';
import { currentUser, payload } from '../../../../server/payload';

export async function GET() {
  const user = await currentUser();
  if (!user) return errorJson('Vui lòng đăng nhập.', 401);
  const p = await payload();
  const result = await p.find({ collection: 'bills', where: { user: { equals: user.id } }, sort: ['-date', '-createdAt'], pagination: false, depth: 0, user, overrideAccess: false });
  return json({ bills: result.docs.map(toBill) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return errorJson('Vui lòng đăng nhập.', 401);
  try {
    const p = await payload();
    const doc = await p.create({ collection: 'bills', data: { ...fromBill(await request.json()), user: user.id }, user, overrideAccess: false });
    return json({ bill: toBill(doc) }, 201);
  } catch (error) {
    console.error('Save bill failed:', error);
    return errorJson('Không thể lưu hóa đơn.', 500);
  }
}
