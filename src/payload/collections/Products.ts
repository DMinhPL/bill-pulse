import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access/isAdmin';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'canonicalName', group: 'Data' },
  access: { read: ({ req }) => !!req.user, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'canonicalName', type: 'text', required: true },
    { name: 'normalizedKey', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'unit', type: 'text', defaultValue: 'cái' },
    { name: 'category', type: 'text', defaultValue: 'Hàng tiêu dùng' },
  ],
};
