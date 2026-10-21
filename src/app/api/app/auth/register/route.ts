import { json, errorJson } from '../../../../../server/http';
import { payload } from '../../../../../server/payload';
import { commitTransaction, createLocalReq, initTransaction, killTransaction } from 'payload';
import { seedSampleBillsForUser } from '../../../../../payload/hooks/seedSampleBills';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
const INVITATION_CODE_RE = /^[A-Z0-9]{8}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || '').trim();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');
    const displayName = String(body?.displayName || '').trim() || username;
    const invitationCode = String(body?.invitationCode || '').trim().toUpperCase();
    if (!USERNAME_RE.test(username)) return errorJson('Tên đăng nhập cần 3–32 ký tự, chỉ gồm chữ không dấu, số và . _ -', 400);
    if (!EMAIL_RE.test(email)) return errorJson('Email không hợp lệ.', 400);
    if (password.length < 8) return errorJson('Mật khẩu cần ít nhất 8 ký tự.', 400);
    if (displayName.length > 80) return errorJson('Tên hiển thị tối đa 80 ký tự.', 400);
    if (!invitationCode) return errorJson('Mã mời là bắt buộc.', 400);
    if (!INVITATION_CODE_RE.test(invitationCode)) return errorJson('Mã mời không hợp lệ.', 400);
    const p = await payload();
    const [sameUsername, sameEmail] = await Promise.all([
      p.find({ collection: 'users', where: { username: { equals: username.toLowerCase() } }, limit: 1, overrideAccess: true }),
      p.find({ collection: 'users', where: { email: { equals: email.toLowerCase() } }, limit: 1, overrideAccess: true }),
    ]);
    if (sameUsername.docs.length) return errorJson('Tên đăng nhập này đã có người dùng.', 409);
    if (sameEmail.docs.length) return errorJson('Email này đã được đăng ký.', 409);
    const req = await createLocalReq({}, p);
    await initTransaction(req);
    let user;
    try {
      const invitation = await p.find({
        collection: 'invitation-codes',
        where: { code: { equals: invitationCode } },
        limit: 1,
        overrideAccess: true,
        req,
      });
      const invitationDoc = invitation.docs[0] as { id: string; enabled?: boolean; consumedAt?: string | null } | undefined;
      if (!invitationDoc || invitationDoc.enabled === false) {
        await killTransaction(req);
        return errorJson('Mã mời không hợp lệ hoặc đã bị vô hiệu hóa.', 403);
      }
      if (invitationDoc.consumedAt) {
        await killTransaction(req);
        return errorJson('Mã mời này đã được sử dụng.', 409);
      }

      try {
        const consumed = await p.update({
          collection: 'invitation-codes',
          where: {
            and: [
              { code: { equals: invitationCode } },
              { enabled: { equals: true } },
              { consumedAt: { exists: false } },
            ],
          },
          data: { consumedAt: new Date().toISOString(), consumedBy: null },
          overrideAccess: true,
          req,
        });
        const consumedDocs = Array.isArray(consumed)
          ? consumed
          : (consumed as { docs?: unknown[] } | null | undefined)?.docs;
        if (!consumedDocs?.length) {
          await killTransaction(req);
          return errorJson('Mã mời này đã được sử dụng.', 409);
        }
      } catch {
        await killTransaction(req);
        return errorJson('Mã mời này đã được sử dụng.', 409);
      }

      user = await p.create({ collection: 'users', data: { username, email, displayName, password }, overrideAccess: true, req, context: { skipSeed: true } });
      await p.update({ collection: 'invitation-codes', id: invitationDoc.id, data: { consumedBy: user.id }, overrideAccess: true, req });
      await seedSampleBillsForUser(String(user.id), req);
      await commitTransaction(req);
    } catch (error) {
      await killTransaction(req);
      throw error;
    }
    const login = await p.login({ collection: 'users', data: { username, password } });
    if (login.token) {
      const { cookies } = await import('next/headers');
      (await cookies()).set(`${p.config.cookiePrefix}-token`, login.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date((login.exp || 0) * 1000) });
    }
    return json({ user: { id: String(user.id), username: user.username, email: user.email, displayName: user.displayName } }, 201);
  } catch (error) {
    console.error('Register failed:', error);
    return errorJson('Không thể đăng ký lúc này.', 500);
  }
}
