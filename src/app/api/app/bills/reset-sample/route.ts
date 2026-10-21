import { commitTransaction, createLocalReq, initTransaction, killTransaction } from 'payload';

import { errorJson, json } from '../../../../../server/http';
import { toBill } from '../../../../../server/billDto';
import { currentUser, payload } from '../../../../../server/payload';

export async function POST() {
  const user = await currentUser();
  if (!user) return errorJson('Vui lÃ²ng Ä‘Äƒng nháº­p.', 401);
  const p = await payload();
  const req = await createLocalReq({ user }, p);
  await initTransaction(req);
  try {
    const existing = await p.find({ collection: 'bills', where: { user: { equals: user.id } }, pagination: false, req, user, overrideAccess: false });
    for (const bill of existing.docs) await p.delete({ collection: 'bills', id: bill.id, req, user, overrideAccess: false });
    const samples = await p.find({ collection: 'sample-bills', pagination: false, depth: 0, req });
    for (const sample of samples.docs) {
      const { id, createdAt, updatedAt, ...bill } = sample as any;
      await p.create({ collection: 'bills', data: { ...bill, user: user.id }, req, user, overrideAccess: true });
    }
    await commitTransaction(req);
    const result = await p.find({ collection: 'bills', where: { user: { equals: user.id } }, sort: ['-date', '-createdAt'], pagination: false, depth: 0, user, overrideAccess: false });
    return json({ bills: result.docs.map(toBill) });
  } catch (error) {
    await killTransaction(req);
    console.error('Reset sample bills failed:', error);
    return errorJson('KhÃ´ng thá»ƒ khÃ´i phá»¥c dá»¯ liá»‡u máº«u.', 500);
  }
}
