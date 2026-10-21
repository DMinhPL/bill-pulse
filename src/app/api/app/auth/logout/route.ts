import { cookies } from 'next/headers';

import { json } from '../../../../../server/http';
import { payload } from '../../../../../server/payload';

export async function POST() {
  const p = await payload();
  (await cookies()).delete(`${p.config.cookiePrefix}-token`);
  return json({ success: true });
}
