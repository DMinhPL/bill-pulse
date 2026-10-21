import type { Field } from 'payload';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

const validateCategory = async (value: unknown, { req }: { req: any }) => {
  if (!value) return 'Category is required.';
  const result = await req.payload.find({ collection: 'bill-categories', where: { key: { equals: value } }, limit: 1 });
  return result.docs.length > 0 ? true : 'Invalid category.';
};

const itemFields: Field[] = [
  { name: 'rawName', type: 'text', required: true },
  { name: 'canonicalName', type: 'text', required: true },
  { name: 'unit', type: 'text', required: true, defaultValue: 'cÃ¡i' },
  { name: 'quantity', type: 'number', required: true, min: 0.001 },
  { name: 'unitPrice', type: 'number', required: true, min: 0 },
  { name: 'totalPrice', type: 'number', required: true, min: 0 },
  { name: 'discount', type: 'number', min: 0 },
  { name: 'category', type: 'text' },
  { name: 'product', type: 'relationship', relationTo: 'products', admin: { readOnly: true } },
];

export const billFields: Field[] = [
  { name: 'merchantName', type: 'text', required: true, defaultValue: 'KhÃ´ng rÃµ cá»­a hÃ ng' },
  { name: 'branch', type: 'text' },
  { name: 'billNumber', type: 'text' },
  { name: 'date', type: 'text', required: true, validate: value => datePattern.test(String(value || '')) || 'Invalid date.' },
  { name: 'time', type: 'text', validate: value => !value || timePattern.test(String(value)) || 'Invalid time.' },
  { name: 'category', type: 'text', required: true, validate: validateCategory },
  { name: 'paymentMethod', type: 'text' },
  { name: 'subtotal', type: 'number', required: true, min: 0 },
  { name: 'discountTotal', type: 'number', min: 0 },
  { name: 'vat', type: 'number', min: 0 },
  { name: 'totalAmount', type: 'number', required: true, min: 0 },
  { name: 'confidenceNotes', type: 'text' },
  { name: 'fileName', type: 'text' },
  { name: 'fileType', type: 'select', options: [{ label: 'Image', value: 'image' }, { label: 'PDF', value: 'pdf' }] },
  { name: 'items', type: 'array', fields: itemFields },
];
