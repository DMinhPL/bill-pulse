import type { CollectionConfig, Field } from 'payload';

import { isOwnerOrAdmin } from '../access/isOwnerOrAdmin';
import { billFields } from '../fields/billFields';
import { linkProducts } from '../hooks/linkProducts';
import { normalizeBill } from '../hooks/normalizeBill';

const makeBillFieldReadOnly = (field: Field): Field => {
  if ('fields' in field && Array.isArray(field.fields)) {
    return {
      ...field,
      fields: field.fields.map(makeBillFieldReadOnly),
    } as Field;
  }

  return {
    ...field,
    admin: {
      ...field.admin,
      readOnly: true,
    },
  } as Field;
};

export const Bills: CollectionConfig = {
  slug: 'bills',
  admin: { useAsTitle: 'merchantName', defaultColumns: ['merchantName', 'date', 'totalAmount', 'user'], group: 'Data' },
  access: { read: isOwnerOrAdmin, update: () => false, delete: () => false, create: ({ req }) => !!req.user },
  hooks: { beforeChange: [normalizeBill, linkProducts] },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, admin: { readOnly: true } },
    ...billFields.map(makeBillFieldReadOnly),
  ],
  indexes: [{ fields: ['user', 'date'] }],
};
