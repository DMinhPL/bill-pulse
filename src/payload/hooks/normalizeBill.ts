import type { CollectionBeforeChangeHook } from 'payload';

const vnd = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));
const today = () => new Date().toISOString().slice(0, 10);
const categories = ['Supermarket', 'Groceries', 'Dining & Cafe', 'Utilities', 'Electronics & Tech', 'Healthcare & Pharmacy', 'Other'];

export const normalizeBill: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.context?.skipNormalize) return data;
  const items = Array.isArray(data.items) ? data.items : [];
  data.merchantName = String(data.merchantName || '').trim() || 'KhÃ´ng rÃµ cá»­a hÃ ng';
  data.date = /^\d{4}-\d{2}-\d{2}$/.test(String(data.date)) ? data.date : today();
  data.time = /^\d{2}:\d{2}$/.test(String(data.time)) ? data.time : null;
  data.category = categories.includes(data.category) ? data.category : 'Other';
  data.fileType = data.fileType === 'pdf' || data.fileType === 'image'
    ? data.fileType
    : String(data.fileName || '').toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
  for (const item of items) {
    item.canonicalName = String(item.canonicalName || item.rawName || 'Sáº£n pháº©m').trim();
    item.rawName = item.rawName || item.canonicalName;
    item.unit = item.unit || 'cÃ¡i';
    item.quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    item.unitPrice = vnd(item.unitPrice);
    item.totalPrice = vnd(item.totalPrice);
    item.discount = vnd(item.discount);
  }
  data.items = items;
  data.subtotal = vnd(data.subtotal);
  data.discountTotal = vnd(data.discountTotal);
  data.vat = vnd(data.vat);
  data.totalAmount = vnd(data.totalAmount);
  if (req.user?.collection === 'users') data.user = req.user.id;
  return data;
};
