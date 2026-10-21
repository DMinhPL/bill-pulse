import React, { useMemo } from 'react';
import { Bill } from '../../../shared/types/bill';
import { BILL_CATEGORY_OPTIONS, PAYMENT_METHOD_SUGGESTIONS, StagedBill } from './stagedBill';

export type BillDetailField = 'merchantName' | 'branch' | 'billNumber' | 'time' | 'category' | 'paymentMethod';

interface BillDetailsFormProps {
  bill: StagedBill;
  existingBills: Bill[];
  onChangeDetail: <K extends BillDetailField>(field: K, value: StagedBill[K]) => void;
  onChangeDate: (date: string) => void;
  onChangeAdjustment: (field: 'vat' | 'discountTotal', value: string) => void;
}

// text-base below sm: iOS Safari zooms the page when focusing inputs under 16px
const inputClass =
  'w-full bg-slate-950 text-base sm:text-sm text-white px-2.5 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500';

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
  label,
  className = '',
  children,
}) => (
  <label className={`block ${className}`}>
    <span className="block text-[11px] font-medium text-slate-400 mb-1">{label}</span>
    {children}
  </label>
);

/** Editable bill header fields: used for manual entry and for fixing what the AI read */
export const BillDetailsForm: React.FC<BillDetailsFormProps> = ({
  bill,
  existingBills,
  onChangeDetail,
  onChangeDate,
  onChangeAdjustment,
}) => {
  const knownMerchants = useMemo(
    () => [...new Set(existingBills.map(b => b.merchantName))].sort(),
    [existingBills]
  );

  return (
    <div className="p-5 border-b border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Field label="Tên cửa hàng *" className="col-span-2">
        <input
          type="text"
          list="bill-known-merchants"
          value={bill.merchantName}
          onChange={e => onChangeDetail('merchantName', e.target.value)}
          placeholder="VD: Bách Hóa Xanh"
          className={inputClass}
        />
      </Field>
      <Field label="Chi nhánh" className="col-span-2">
        <input
          type="text"
          value={bill.branch}
          onChange={e => onChangeDetail('branch', e.target.value)}
          placeholder="VD: 123 Nguyễn Trãi, Q.1"
          className={inputClass}
        />
      </Field>
      <Field label="Ngày mua *">
        <input
          type="date"
          value={bill.date}
          onChange={e => onChangeDate(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Giờ">
        <input
          type="time"
          value={bill.time}
          onChange={e => onChangeDetail('time', e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Danh mục">
        <select
          value={bill.category}
          onChange={e => onChangeDetail('category', e.target.value as Bill['category'])}
          className={inputClass}
        >
          {BILL_CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Thanh toán">
        <input
          type="text"
          list="bill-payment-methods"
          value={bill.paymentMethod}
          onChange={e => onChangeDetail('paymentMethod', e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Số hóa đơn">
        <input
          type="text"
          value={bill.billNumber}
          onChange={e => onChangeDetail('billNumber', e.target.value)}
          placeholder="Không bắt buộc"
          className={inputClass}
        />
      </Field>
      <Field label="Thuế VAT (₫)">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="500"
          value={bill.vat || ''}
          onChange={e => onChangeAdjustment('vat', e.target.value)}
          placeholder="0"
          className={inputClass}
        />
      </Field>
      <Field label="Khuyến mãi (₫)">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="500"
          value={bill.discountTotal || ''}
          onChange={e => onChangeAdjustment('discountTotal', e.target.value)}
          placeholder="0"
          className={inputClass}
        />
      </Field>

      <datalist id="bill-known-merchants">
        {knownMerchants.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="bill-payment-methods">
        {PAYMENT_METHOD_SUGGESTIONS.map(m => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
};
