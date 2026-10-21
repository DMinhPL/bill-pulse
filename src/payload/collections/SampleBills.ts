import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access/isAdmin';
import { billFields } from '../fields/billFields';

export const SampleBills: CollectionConfig = {
  slug: 'sample-bills',
  admin: { useAsTitle: 'merchantName', group: 'Data' },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: billFields,
};
