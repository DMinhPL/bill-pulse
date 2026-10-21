import type { GlobalConfig } from 'payload';

export const Lookups: GlobalConfig = {
  slug: 'lookups',
  access: { read: () => true },
  fields: [
    { name: 'paymentMethods', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    { name: 'units', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    { name: 'itemCategories', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
  ],
};
