import type { CollectionConfig } from 'payload';

import { isOwnerOrAdmin } from '../access/isOwnerOrAdmin';
import { billFields } from '../fields/billFields';
import { linkProducts } from '../hooks/linkProducts';
import { normalizeBill } from '../hooks/normalizeBill';

export const Bills: CollectionConfig = {
  slug: 'bills',
  admin: { useAsTitle: 'merchantName', defaultColumns: ['merchantName', 'date', 'totalAmount', 'user'], group: 'Data' },
  access: { read: isOwnerOrAdmin, update: isOwnerOrAdmin, delete: isOwnerOrAdmin, create: ({ req }) => !!req.user },
  hooks: { beforeChange: [normalizeBill, linkProducts] },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    ...billFields,
  ],
  indexes: [{ fields: ['user', 'date'] }],
};
