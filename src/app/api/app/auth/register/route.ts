import { json, errorJson } from '../../../../../server/http';
import { payload } from '../../../../../server/payload';
import { commitTransaction, createLocalReq, initTransaction, killTransaction } from 'payload';
import { seedSampleBillsForUser } from '../../../../../payload/hooks/seedSampleBills';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || '').trim();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');
    const displayName = String(body?.displayName || '').trim() || username;
    if (!USERNAME_RE.test(username)) return errorJson('TÃªn Ä‘Äƒng nháº­p cáº§n 3â€“32 kÃ½ tá»±, chá»‰ gá»“m chá»¯ khÃ´ng dáº¥u, sá»‘ vÃ  . _ -', 400);
    if (!EMAIL_RE.test(email)) return errorJson('Email khÃ´ng há»£p lá»‡.', 400);
    if (password.length < 8) return errorJson('Máº­t kháº©u cáº§n Ã­t nháº¥t 8 kÃ½ tá»±.', 400);
    if (displayName.length > 80) return errorJson('TÃªn hiá»ƒn thá»‹ tá»‘i Ä‘a 80 kÃ½ tá»±.', 400);
    const p = await payload();
    const [sameUsername, sameEmail] = await Promise.all([
      p.find({ collection: 'users', where: { username: { equals: username.toLowerCase() } }, limit: 1, overrideAccess: true }),
      p.find({ collection: 'users', where: { email: { equals: email.toLowerCase() } }, limit: 1, overrideAccess: true }),
    ]);
    if (sameUsername.docs.length) return errorJson('TÃªn Ä‘Äƒng nháº­p nÃ y Ä‘Ã£ cÃ³ ngÆ°á»i dÃ¹ng.', 409);
    if (sameEmail.docs.length) return errorJson('Email nÃ y Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½.', 409);
    const req = await createLocalReq({}, p);
    await initTransaction(req);
    let user;
    try {
      user = await p.create({ collection: 'users', data: { username, email, displayName, password }, overrideAccess: true, req, context: { skipSeed: true } });
      await commitTransaction(req);
    } catch (error) {
      await killTransaction(req);
      throw error;
    }
    await seedSampleBillsForUser(String(user.id), await createLocalReq({}, p));
    const login = await p.login({ collection: 'users', data: { username, password } });
    if (login.token) {
      const { cookies } = await import('next/headers');
      (await cookies()).set(`${p.config.cookiePrefix}-token`, login.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date((login.exp || 0) * 1000) });
    }
    return json({ user: { id: String(user.id), username: user.username, email: user.email, displayName: user.displayName } }, 201);
  } catch (error) {
    console.error('Register failed:', error);
    return errorJson('KhÃ´ng thá»ƒ Ä‘Äƒng kÃ½ lÃºc nÃ y.', 500);
  }
}
