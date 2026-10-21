import crypto from 'node:crypto';
import { getPayload } from 'payload';

import config from '../payload.config';
import { INITIAL_SAMPLE_BILLS } from '../shared/seed/sampleBills';

const payload = await getPayload({ config });

const categories = [
  ['Supermarket', 'Siêu thị'],
  ['Groceries', 'Tạp hóa'],
  ['Dining & Cafe', 'Ăn uống & Cà phê'],
  ['Utilities', 'Tiện ích'],
  ['Electronics & Tech', 'Điện tử & Công nghệ'],
  ['Healthcare & Pharmacy', 'Y tế & Nhà thuốc'],
  ['Other', 'Khác'],
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
  paymentMethods: ['Tiền mặt', 'Thẻ tín dụng/ghi nợ', 'Chuyển khoản', 'MoMo', 'VNPay', 'ZaloPay', 'Khác'].map(value => ({ value })),
  units: ['hộp', 'chai', 'kg', 'gói', 'lon', 'ly', 'cái', 'phần'].map(value => ({ value })),
  itemCategories: ['Thực phẩm', 'Đồ uống', 'Sữa - Bơ trứng', 'Gia dụng', 'Chăm sóc cá nhân', 'Rau củ quả'].map(value => ({ value })),
});
await upsertGlobal('ai-settings', {
  model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  inflationMaxItems: 20,
});

for (const sample of INITIAL_SAMPLE_BILLS) {
  const existing = await payload.find({ collection: 'sample-bills', where: { billNumber: { equals: sample.billNumber } }, limit: 1 });
  if (!existing.docs[0]) {
    const { id: _sampleId, ...sampleData } = sample;
    await payload.create({ collection: 'sample-bills', data: { ...sampleData, id: crypto.randomUUID() } as never });
  }
}

await payload.destroy();
