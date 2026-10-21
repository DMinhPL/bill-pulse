import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access/isAdmin';

export const BillCategories: CollectionConfig = {
  slug: 'bill-categories',
  admin: { useAsTitle: 'label', group: 'Settings' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'label', type: 'text', required: true },
    { name: 'order', type: 'number', required: true },
  ],
};
