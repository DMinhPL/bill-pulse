import type { CollectionBeforeChangeHook } from 'payload';

import { normalizeItemKey } from '../../../shared/priceTracker';

export const linkProducts: CollectionBeforeChangeHook = async ({ data, req }) => {
  for (const item of Array.isArray(data.items) ? data.items : []) {
    const canonicalName = String(item.canonicalName || item.rawName || '').trim();
    const normalizedKey = normalizeItemKey(canonicalName);
    const existing = await req.payload.find({ collection: 'products', where: { normalizedKey: { equals: normalizedKey } }, limit: 1, depth: 0 });
    let product = existing.docs[0];
    if (!product) {
      try {
        product = await req.payload.create({
          collection: 'products',
          data: { canonicalName, normalizedKey, unit: item.unit || 'cÃ¡i', category: item.category || 'HÃ ng tiÃªu dÃ¹ng' },
          req,
          overrideAccess: true,
        });
      } catch {
        const retry = await req.payload.find({ collection: 'products', where: { normalizedKey: { equals: normalizedKey } }, limit: 1, depth: 0 });
        product = retry.docs[0];
      }
    }
    if (product) item.product = product.id;
  }
  return data;
};
