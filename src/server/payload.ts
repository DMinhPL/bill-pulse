import { headers } from 'next/headers';
import { getPayload } from 'payload';

import config from '../../payload.config';

export const payload = () => getPayload({ config });

export async function currentUser() {
  const p = await payload();
  const { user } = await p.auth({ headers: await headers() });
  return user?.collection === 'users' ? user : null;
}
