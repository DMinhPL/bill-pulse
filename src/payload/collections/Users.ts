import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload';

import { isAdmin } from '../access/isAdmin';
import { seedSampleBills } from '../hooks/seedSampleBills';

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
const INVALID_USERNAME = 'Tên đăng nhập cần 3–32 ký tự, chỉ gồm chữ không dấu, số và . _ -';

const normalizeAndValidateUsername: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data;
  data.username = String(data.username || '').trim().toLowerCase();
  if (!USERNAME_RE.test(data.username)) throw new Error(INVALID_USERNAME);
  return data;
};

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    loginWithUsername: { allowEmailLogin: false, requireEmail: true },
    tokenExpiration: 60 * 60 * 24 * 30,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  admin: { useAsTitle: 'username', group: 'Accounts' },
  access: {
    admin: () => false,
    read: ({ req }) =>
      req.user?.collection === 'admins' ? true :
        req.user?.collection === 'users' ? { id: { equals: req.user.id } } : false,
    create: isAdmin,
    update: ({ req }) =>
      req.user?.collection === 'admins' ? true :
        req.user?.collection === 'users' ? { id: { equals: req.user.id } } : false,
    delete: isAdmin,
  },
  hooks: { beforeValidate: [normalizeAndValidateUsername], afterChange: [seedSampleBills] },
  fields: [
    { name: 'displayName', type: 'text', required: true, maxLength: 80 },
    { name: 'legacyPasswordHash', type: 'text', hidden: true, access: { read: () => false, update: () => false } },
  ],
};
