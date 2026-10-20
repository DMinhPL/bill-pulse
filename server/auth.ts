import crypto from 'crypto';
import { promisify } from 'util';
import express, { Request, Response, NextFunction } from 'express';
import pg from 'pg';
import { pool, withTransaction } from './db.js';
import { insertSampleBills } from './bills.js';

const scrypt = promisify(crypto.scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

const SESSION_COOKIE = 'bp_session';
const SESSION_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 3–32 characters: letters, digits, dot, underscore, hyphen
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
}

// ─── Passwords ──────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// ─── Sessions ───────────────────────────────────────────────────────────────

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

function readSessionToken(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

async function startSession(res: Response, userId: number, db: pg.Pool | pg.PoolClient = pool) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
    sha256(token),
    userId,
    expiresAt,
  ]);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

/** Rejects the request with 401 unless it carries a valid session. Sets res.locals.userId. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readSessionToken(req);
    if (!token) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });

    const { rows } = await pool.query<{ user_id: string }>(
      'SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()',
      [sha256(token)]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' });

    res.locals.userId = Number(rows[0].user_id);
    next();
  } catch (err) {
    next(err);
  }
}

const toPublicUser = (row: {
  id: string | number;
  username: string;
  email: string;
  display_name: string;
}): PublicUser => ({
  id: Number(row.id),
  username: row.username,
  email: row.email,
  displayName: row.display_name,
});

// ─── Routes ─────────────────────────────────────────────────────────────────

export const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || '').trim() || username;

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({
        error: 'Tên đăng nhập cần 3–32 ký tự, chỉ gồm chữ không dấu, số và . _ -',
      });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email không hợp lệ.' });
    if (password.length < 8) return res.status(400).json({ error: 'Mật khẩu cần ít nhất 8 ký tự.' });
    if (displayName.length > 80) return res.status(400).json({ error: 'Tên hiển thị tối đa 80 ký tự.' });

    // Say which field is taken; the unique indexes below still guard against races
    const taken = await pool.query<{ username_taken: boolean; email_taken: boolean }>(
      `SELECT bool_or(lower(username) = lower($1)) AS username_taken,
              bool_or(lower(email) = lower($2))    AS email_taken
       FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($2)`,
      [username, email]
    );
    if (taken.rows[0]?.username_taken) return res.status(409).json({ error: 'Tên đăng nhập này đã có người dùng.' });
    if (taken.rows[0]?.email_taken) return res.status(409).json({ error: 'Email này đã được đăng ký.' });

    const passwordHash = await hashPassword(password);

    const user = await withTransaction(async client => {
      const { rows } = await client.query(
        `INSERT INTO users (username, email, display_name, password_hash) VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING
         RETURNING id, username, email, display_name`,
        [username, email, displayName, passwordHash]
      );
      if (rows.length === 0) return null;

      // New accounts start with the sample bills, as the app did before accounts existed
      await insertSampleBills(client, Number(rows[0].id));
      await startSession(res, Number(rows[0].id), client);
      return toPublicUser(rows[0]);
    });

    if (!user) return res.status(409).json({ error: 'Tên đăng nhập hoặc email đã được đăng ký.' });
    return res.status(201).json({ user });
  } catch (err: any) {
    console.error('Register failed:', err);
    return res.status(500).json({ error: 'Không thể đăng ký lúc này.' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    const { rows } = await pool.query(
      'SELECT id, username, email, display_name, password_hash FROM users WHERE lower(username) = lower($1)',
      [username]
    );
    const valid = rows.length > 0 && (await verifyPassword(password, rows[0].password_hash));
    if (!valid) return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });

    await startSession(res, Number(rows[0].id));
    return res.json({ user: toPublicUser(rows[0]) });
  } catch (err: any) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Không thể đăng nhập lúc này.' });
  }
});

authRouter.post('/logout', async (req, res) => {
  const token = readSessionToken(req);
  if (token) {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)]).catch(() => {});
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  return res.json({ success: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, email, display_name FROM users WHERE id = $1', [
    res.locals.userId,
  ]);
  if (rows.length === 0) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
  return res.json({ user: toPublicUser(rows[0]) });
});
