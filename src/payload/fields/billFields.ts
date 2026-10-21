import type { Field } from 'payload';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

const validateCategory = async (value: unknown, { req }: { req: any }) => {
  if (!value) return 'Category is required.';
  const result = await req.payload.find({ collection: 'bill-categories', where: { key: { equals: value } }, limit: 1 });
  return result.docs.length > 0 ? true : 'Invalid category.';
};

const itemFields: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'rawName', type: 'text', required: true },
      { name: 'canonicalName', type: 'text', required: true },
    ],
  },
  {
    type: 'row',
    fields: [
      { name: 'unit', type: 'text', required: true, defaultValue: 'cái' },
      { name: 'quantity', type: 'number', required: true, min: 0.001 },
      { name: 'unitPrice', type: 'number', required: true, min: 0 },
      { name: 'totalPrice', type: 'number', required: true, min: 0 },
    ],
  },
  {
    type: 'row',
    fields: [
      { name: 'discount', type: 'number', min: 0 },
      { name: 'category', type: 'text' },
    ],
  },
  { name: 'product', type: 'relationship', relationTo: 'products', admin: { readOnly: true } },
];

export const billFields: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'merchantName', type: 'text', required: true, defaultValue: 'Không rõ cửa hàng' },
      { name: 'branch', type: 'text' },
      { name: 'billNumber', type: 'text' },
    ],
  },
  {
    type: 'row',
    fields: [
      { name: 'date', type: 'text', required: true, validate: value => datePattern.test(String(value || '')) || 'Invalid date.' },
      { name: 'time', type: 'text', validate: value => !value || timePattern.test(String(value)) || 'Invalid time.' },
      { name: 'category', type: 'text', required: true, validate: validateCategory },
      { name: 'paymentMethod', type: 'text' },
    ],
  },
  {
    type: 'collapsible',
    label: 'Thanh toán',
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'subtotal', type: 'number', required: true, min: 0 },
          { name: 'discountTotal', type: 'number', min: 0 },
          { name: 'vat', type: 'number', min: 0 },
          { name: 'totalAmount', type: 'number', required: true, min: 0 },
        ],
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Mặt hàng',
    fields: [{ name: 'items', type: 'array', admin: { initCollapsed: true }, fields: itemFields }],
  },
  {
    type: 'collapsible',
    label: 'Tệp & ghi chú',
    admin: { initCollapsed: true },
    fields: [
      { name: 'confidenceNotes', type: 'textarea' },
      {
        type: 'row',
        fields: [
          { name: 'fileName', type: 'text' },
          { name: 'fileType', type: 'select', options: [{ label: 'Image', value: 'image' }, { label: 'PDF', value: 'pdf' }] },
        ],
      },
    ],
  },
];
