import { Bill, BillItem, BillItemWithTrend } from '../../../../shared/types/bill';
import { enrichBillItemsWithTrends } from '../../../../shared/priceTracker';
import { SampleQuickBill } from '../../../../shared/seed/sampleBills';

/** Bill under review before saving: from an AI scan, a demo sample, or typed in by hand */
export interface StagedBill {
  source: 'scan' | 'demo' | 'manual';
  merchantName: string;
  branch: string;
  billNumber: string;
  date: string;
  time: string;
  category: Bill['category'];
  paymentMethod: string;
  items: BillItemWithTrend[];
  subtotal: number;
  vat: number;
  discountTotal: number;
  totalAmount: number;
  confidenceNotes: string;
  fileName: string;
}

/** The scanned file kept alongside the bill so it can be stored with it */
export interface BillAttachment {
  preview: string;
  type: 'image' | 'pdf';
}

export const BILL_CATEGORY_OPTIONS: { value: Bill['category']; label: string }[] = [
  { value: 'Supermarket', label: 'Siêu thị' },
  { value: 'Groceries', label: 'Chợ / Thực phẩm' },
  { value: 'Dining & Cafe', label: 'Ăn uống & Cafe' },
  { value: 'Utilities', label: 'Tiện ích (điện, nước...)' },
  { value: 'Electronics & Tech', label: 'Điện tử & Công nghệ' },
  { value: 'Healthcare & Pharmacy', label: 'Y tế & Nhà thuốc' },
  { value: 'Other', label: 'Khác' },
];

export const PAYMENT_METHOD_SUGGESTIONS = ['Tiền mặt', 'Chuyển khoản', 'Thẻ ngân hàng', 'Ví MoMo', 'ZaloPay', 'VNPay'];

export type BillCategoryOption = { value: Bill['category']; label: string };

/** Local calendar date/time (toISOString would give yesterday's date before 7am in Vietnam) */
const nowLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

/** Strip derived trend fields so items can be re-compared against history */
export const toBillItem = (it: BillItemWithTrend): BillItem => ({
  id: it.id,
  rawName: it.rawName,
  canonicalName: it.canonicalName,
  unit: it.unit,
  quantity: it.quantity,
  unitPrice: it.unitPrice,
  totalPrice: it.totalPrice,
  discount: it.discount,
  category: it.category,
});

export const createBlankItem = (): BillItem => ({
  id: `item_manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  rawName: '',
  canonicalName: '',
  unit: 'cái',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  discount: 0,
  category: 'Hàng tiêu dùng',
});

/** New staged bill with items re-compared against history and totals recomputed */
export const restageItems = (
  bill: StagedBill,
  items: BillItem[],
  existingBills: Bill[],
  date = bill.date
): StagedBill => {
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  return {
    ...bill,
    date,
    items: enrichBillItemsWithTrends(items, existingBills, date),
    subtotal,
    totalAmount: subtotal + (bill.vat || 0) - (bill.discountTotal || 0),
  };
};

/** Normalizes the loosely-typed JSON returned by /api/scan-bill */
export const stagedBillFromScan = (
  rawBill: any,
  fileName: string,
  existingBills: Bill[],
  categoryOptions: BillCategoryOption[] = BILL_CATEGORY_OPTIONS
): StagedBill => {
  const date = rawBill.date || new Date().toISOString().split('T')[0];
  return {
    source: 'scan',
    merchantName: rawBill.merchantName || 'Cửa hàng tiện lợi',
    branch: rawBill.branch || '',
    billNumber: rawBill.billNumber || `HD-${Date.now().toString().slice(-6)}`,
    date,
    time: rawBill.time || '12:00',
    // Keep the category <select> on a valid option even if the AI invents one
    category: categoryOptions.some(o => o.value === rawBill.category) ? rawBill.category : 'Other',
    paymentMethod: rawBill.paymentMethod || 'Tiền mặt',
    items: enrichBillItemsWithTrends(rawBill.items || [], existingBills, date),
    subtotal: Number(rawBill.subtotal) || Number(rawBill.totalAmount) || 0,
    vat: Number(rawBill.vat) || 0,
    discountTotal: Number(rawBill.discountTotal) || 0,
    totalAmount: Number(rawBill.totalAmount) || 0,
    confidenceNotes: rawBill.confidenceNotes || 'Quét thành công bằng AI',
    fileName,
  };
};

export const stagedBillFromDemo = (demo: SampleQuickBill, existingBills: Bill[]): StagedBill => ({
  source: 'demo',
  merchantName: demo.billData.merchantName,
  branch: demo.billData.branch || '',
  billNumber: demo.billData.billNumber || '',
  date: demo.billData.date,
  time: demo.billData.time || '15:00',
  category: demo.billData.category,
  paymentMethod: demo.billData.paymentMethod || 'Tiền mặt',
  items: enrichBillItemsWithTrends(demo.billData.items, existingBills, demo.billData.date),
  subtotal: demo.billData.subtotal,
  vat: demo.billData.vat || 0,
  discountTotal: demo.billData.discountTotal || 0,
  totalAmount: demo.billData.totalAmount,
  confidenceNotes: demo.billData.confidenceNotes || 'Dữ liệu mẫu thực tế',
  fileName: demo.billData.fileName || 'sample_bill.png',
});

/** Empty bill for the manual entry path, dated now */
export const createManualStagedBill = (existingBills: Bill[]): StagedBill => {
  const { date, time } = nowLocal();
  return {
    source: 'manual',
    merchantName: '',
    branch: '',
    billNumber: '',
    date,
    time,
    category: 'Supermarket',
    paymentMethod: 'Tiền mặt',
    items: enrichBillItemsWithTrends([createBlankItem()], existingBills, date),
    subtotal: 0,
    vat: 0,
    discountTotal: 0,
    totalAmount: 0,
    confidenceNotes: 'Nhập thủ công',
    fileName: '',
  };
};

/** Returns the first problem blocking save, or null when the bill can be stored */
export const getStagedBillError = (bill: StagedBill): string | null => {
  if (!bill.merchantName.trim()) return 'Vui lòng nhập tên cửa hàng.';
  if (!bill.date) return 'Vui lòng chọn ngày mua.';
  if (bill.items.length === 0) return 'Hóa đơn cần ít nhất 1 mặt hàng.';
  if (bill.items.some(i => !i.canonicalName.trim())) return 'Có mặt hàng chưa được đặt tên.';
  // Scanned bills may legitimately contain free gift lines at 0 ₫
  if (bill.source === 'manual' && bill.items.some(i => i.unitPrice <= 0)) {
    return 'Có mặt hàng chưa nhập đơn giá.';
  }
  return null;
};

export const stagedBillToBill = (staged: StagedBill, attachment: BillAttachment | null): Bill => ({
  id: `bill_${Date.now()}`,
  merchantName: staged.merchantName.trim(),
  branch: staged.branch,
  billNumber: staged.billNumber,
  date: staged.date,
  time: staged.time,
  category: staged.category,
  paymentMethod: staged.paymentMethod,
  items: staged.items.map(it => {
    const item = toBillItem(it);
    const name = item.canonicalName.trim();
    // Hand-typed items have no receipt text; use the typed name as the raw name
    return { ...item, canonicalName: name, rawName: item.rawName || name };
  }),
  subtotal: staged.subtotal,
  vat: staged.vat,
  discountTotal: staged.discountTotal,
  totalAmount: staged.totalAmount,
  confidenceNotes: staged.confidenceNotes,
  fileName: staged.fileName,
  filePreview: attachment?.preview,
  fileType: attachment?.type ?? 'image',
  createdAt: new Date().toISOString(),
});
