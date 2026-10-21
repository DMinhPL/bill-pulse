import { getPayload } from 'payload';

import config from '../payload.config';
import { INITIAL_SAMPLE_BILLS } from '../shared/seed/sampleBills';

const payload = await getPayload({ config });

const categories = [
  ['Supermarket', 'SiÃªu thá»‹'],
  ['Groceries', 'Táº¡p hÃ³a'],
  ['Dining & Cafe', 'Ä‚n uá»‘ng & CÃ  phÃª'],
  ['Utilities', 'Tiá»‡n Ã­ch'],
  ['Electronics & Tech', 'Äiá»‡n tá»­ & CÃ´ng nghá»‡'],
  ['Healthcare & Pharmacy', 'Y táº¿ & NhÃ  thuá»‘c'],
  ['Other', 'KhÃ¡c'],
];

for (const [order, [key, label]] of categories.entries()) {
  const existing = await payload.find({ collection: 'bill-categories', where: { key: { equals: key } }, limit: 1 });
  if (existing.docs[0]) await payload.update({ collection: 'bill-categories', id: existing.docs[0].id, data: { label, order } });
  else await payload.create({ collection: 'bill-categories', data: { key, label, order } });
}

const upsertGlobal = async (slug: 'lookups' | 'ai-settings', data: Record<string, unknown>) => {
  await payload.updateGlobal({ slug, data });
};

await upsertGlobal('lookups', {
  paymentMethods: ['Tiá»n máº·t', 'Tháº» tÃ­n dá»¥ng/ghi ná»£', 'Chuyá»ƒn khoáº£n', 'MoMo', 'VNPay', 'ZaloPay', 'KhÃ¡c'].map(value => ({ value })),
  units: ['há»™p', 'chai', 'kg', 'gÃ³i', 'lon', 'ly', 'cÃ¡i', 'pháº§n'].map(value => ({ value })),
  itemCategories: ['Thá»±c pháº©m', 'Äá»“ uá»‘ng', 'Sá»¯a - BÆ¡ trá»©ng', 'Gia dá»¥ng', 'ChÄƒm sÃ³c cÃ¡ nhÃ¢n', 'Rau cá»§ quáº£'].map(value => ({ value })),
});
await upsertGlobal('ai-settings', {
  model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  inflationMaxItems: 20,
});

for (const sample of INITIAL_SAMPLE_BILLS) {
  const existing = await payload.find({ collection: 'sample-bills', where: { billNumber: { equals: sample.billNumber } }, limit: 1 });
  if (!existing.docs[0]) await payload.create({ collection: 'sample-bills', data: sample as never });
}

await payload.destroy();
