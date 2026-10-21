import { cookies } from 'next/headers';
import { AuthenticationError } from 'payload';

import { errorJson, json } from '../../../../../server/http';
import { verifyPassword } from '../../../../../server/legacyPassword';
import { payload } from '../../../../../server/payload';

const FAILURE = 'Tên đăng nhập hoặc mật khẩu không đúng.';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const p = await payload();
    let login;
    try {
      login = await p.login({ collection: 'users', data: { username, password } });
    } catch (error) {
      if (!(error instanceof AuthenticationError)) return errorJson(FAILURE, 401);
      const result = await p.find({ collection: 'users', where: { username: { equals: username } }, limit: 1, overrideAccess: true, showHiddenFields: true });
      const user = result.docs[0] as any;
      if (!user?.legacyPasswordHash || !(await verifyPassword(password, user.legacyPasswordHash))) return errorJson(FAILURE, 401);
      await p.update({ collection: 'users', id: user.id, data: { password, legacyPasswordHash: null }, overrideAccess: true });
      login = await p.login({ collection: 'users', data: { username, password } });
    }
    if (!login?.token || !login.user) return errorJson(FAILURE, 401);
    (await cookies()).set(`${p.config.cookiePrefix}-token`, login.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date((login.exp || 0) * 1000) });
    const user = login.user as any;
    return json({ user: { id: String(user.id), username: user.username, email: user.email, displayName: user.displayName } });
  } catch (error) {
    console.error('Login failed:', error);
    return errorJson(FAILURE, 401);
  }
}
