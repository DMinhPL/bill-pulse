import React from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { Bill } from '../../../../shared/types/bill';
import { formatVND } from '../../../../shared/currency';
import { BillCategoryOption, StagedBill, getStagedBillError, restageItems, toBillItem, createBlankItem } from './stagedBill';
import { BillDetailsForm, BillDetailField } from './BillDetailsForm';
import { BillItemsTable, BillItemField } from './BillItemsTable';

interface BillReviewEditorProps {
  bill: StagedBill;
  existingBills: Bill[];
  onChange: (bill: StagedBill) => void;
  isSaving: boolean;
  /** Show the blocking validation message (set after a save attempt) */
  showValidation: boolean;
  onCancel: () => void;
  onSave: () => void;
  categoryOptions?: BillCategoryOption[];
  paymentMethodSuggestions?: string[];
}

/** Review and edit a staged bill (scanned, sample, or manual) before saving it */
export const BillReviewEditor: React.FC<BillReviewEditorProps> = ({
  bill,
  existingBills,
  onChange,
  isSaving,
  showValidation,
  onCancel,
  onSave,
  categoryOptions,
  paymentMethodSuggestions,
}) => {
  const isManual = bill.source === 'manual';
  const validationError = showValidation ? getStagedBillError(bill) : null;
  const increasedCount = bill.items.filter(i => i.trendStatus === 'INCREASED').length;

  // An edited item's trend is recomputed so a renamed or repriced item is
  // compared with the right purchase history
  const handleUpdateItem = (index: number, field: BillItemField, value: string) => {
    const items = bill.items.map(toBillItem);
    const item = { ...items[index] };

    if (field === 'canonicalName') {
      item.canonicalName = value;
    } else if (field === 'unit') {
      item.unit = value;
    } else if (field === 'unitPrice') {
      item.unitPrice = Math.max(0, Number(value) || 0);
    } else if (field === 'quantity') {
      item.quantity = Number(value) || 1;
    }
    item.totalPrice = item.unitPrice * item.quantity;

    items[index] = item;
    onChange(restageItems(bill, items, existingBills));
  };

  const handleRemoveItem = (index: number) => {
    onChange(restageItems(bill, bill.items.map(toBillItem).filter((_, i) => i !== index), existingBills));
  };

  const handleAddItem = () => {
    onChange(restageItems(bill, [...bill.items.map(toBillItem), createBlankItem()], existingBills));
  };

  const handleChangeDetail = <K extends BillDetailField>(field: K, value: StagedBill[K]) => {
    onChange({ ...bill, [field]: value });
  };

  // Price history only counts bills on or before the purchase date, so re-compare
  const handleChangeDate = (date: string) => {
    onChange(restageItems(bill, bill.items.map(toBillItem), existingBills, date));
  };

  const handleChangeAdjustment = (field: 'vat' | 'discountTotal', value: string) => {
    const next = { ...bill, [field]: Math.max(0, Number(value) || 0) };
    onChange({ ...next, totalAmount: next.subtotal + next.vat - next.discountTotal });
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {isManual ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700/60 text-slate-200 border border-slate-600 shrink-0">
                Nhập thủ công
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Đã bóc tách thành công
              </span>
            )}
            <span className="text-xs text-slate-400 truncate">{bill.fileName}</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1 truncate">{bill.merchantName || 'Hóa đơn mới'}</h3>
          <p className="text-xs text-slate-400">
            {isManual
              ? 'Điền thông tin hóa đơn và các món đã mua bên dưới.'
              : 'Kiểm tra và chỉnh sửa thông tin bên dưới trước khi lưu.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isManual ? 'Hủy' : 'Hủy & Quét lại'}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            aria-busy={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md flex items-center gap-1.5 transition-all disabled:opacity-80 disabled:cursor-wait"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isSaving ? 'Đang lưu...' : 'Lưu vào hệ thống theo dõi'}
          </button>
        </div>
      </div>

      {/* Blocking problem from the last save attempt */}
      {validationError && (
        <div
          className="bg-rose-950/40 border-b border-rose-500/30 px-5 py-3 text-xs text-rose-300 flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <BillDetailsForm
        bill={bill}
        existingBills={existingBills}
        onChangeDetail={handleChangeDetail}
        onChangeDate={handleChangeDate}
        onChangeAdjustment={handleChangeAdjustment}
        categoryOptions={categoryOptions}
        paymentMethodSuggestions={paymentMethodSuggestions}
      />

      {/* Quick Notice about Detected Price Trends */}
      {increasedCount > 0 && (
        <div className="bg-rose-950/40 border-b border-rose-500/30 px-5 py-3 text-xs text-rose-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Phát hiện tăng giá:</strong> Có{' '}
            <span className="font-bold text-white underline">{increasedCount} mặt hàng</span> trong hóa đơn này có
            đơn giá cao hơn so với các lần mua trước trong cơ sở dữ liệu!
          </span>
        </div>
      )}

      <div className="p-5">
        <BillItemsTable
          items={bill.items}
          existingBills={existingBills}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          onAddItem={handleAddItem}
        />

        {/* Total Summary Footer */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
          <div className="text-xs text-slate-400 space-y-1">
            <p>• {bill.confidenceNotes}</p>
            <p>• Bạn có thể chỉnh sửa trực tiếp tên, đơn giá hoặc số lượng trước khi lưu.</p>
          </div>

          <div className="text-right space-y-1">
            {bill.vat > 0 && (
              <div className="text-xs text-slate-400 flex justify-end gap-3">
                <span>Thuế VAT:</span>
                <span>{formatVND(bill.vat)}</span>
              </div>
            )}
            {bill.discountTotal > 0 && (
              <div className="text-xs text-emerald-400 flex justify-end gap-3">
                <span>Khuyến mãi giảm:</span>
                <span>-{formatVND(bill.discountTotal)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-end gap-3 pt-1 border-t border-slate-800">
              <span className="text-sm font-semibold text-slate-300">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-amber-400 tracking-tight">{formatVND(bill.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
