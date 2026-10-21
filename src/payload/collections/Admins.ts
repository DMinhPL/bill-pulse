import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access/isAdmin';

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  admin: { useAsTitle: 'email', group: 'System' },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [{ name: 'name', type: 'text' }],
};
