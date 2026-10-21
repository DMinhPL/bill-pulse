import React, { useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Bill, BillItemWithTrend } from '../../../shared/types/bill';
import { formatVND, formatPercent } from '../../../shared/currency';

export type BillItemField = 'canonicalName' | 'unit' | 'unitPrice' | 'quantity';

interface BillItemsTableProps {
  items: BillItemWithTrend[];
  existingBills: Bill[];
  onUpdateItem: (index: number, field: BillItemField, value: string) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
}

/** Real-time comparison of an item's unit price against purchase history */
const PriceTrendBadge: React.FC<{ item: BillItemWithTrend }> = ({ item }) => {
  if (item.trendStatus === 'INCREASED') {
    return (
      <div className="inline-flex flex-col items-center">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <TrendingUp className="w-3 h-3 text-rose-400" />
          +{formatVND(item.priceDiff, { showSign: false })} ({formatPercent(item.percentChange || 0)})
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">Trước: {formatVND(item.previousUnitPrice)}</span>
      </div>
    );
  }
  if (item.trendStatus === 'DECREASED') {
    return (
      <div className="inline-flex flex-col items-center">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <TrendingDown className="w-3 h-3 text-emerald-400" />
          {formatVND(item.priceDiff, { showSign: true })} ({formatPercent(item.percentChange || 0)})
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">Trước: {formatVND(item.previousUnitPrice)}</span>
      </div>
    );
  }
  if (item.trendStatus === 'UNCHANGED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        = Bằng giá cũ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">
      ★ Lần đầu mua
    </span>
  );
};

/** Editable line items with price-change comparison */
export const BillItemsTable: React.FC<BillItemsTableProps> = ({
  items,
  existingBills,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}) => {
  // Autocomplete from history: reusing the exact product name is what lets the
  // price comparison match earlier purchases
  const knownItemNames = useMemo(
    () => [...new Set(existingBills.flatMap(b => b.items.map(i => i.canonicalName)))].sort(),
    [existingBills]
  );

  return (
    <>
      <div className="flex items-center justify-between pb-3">
        <h4 className="font-semibold text-white text-sm">
          Danh sách mặt hàng & So sánh đơn giá ({items.length} món)
        </h4>
        <button
          onClick={onAddItem}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm món thủ công
        </button>
      </div>

      <datalist id="bill-known-items">
        {knownItemNames.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/90 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Tên mặt hàng (Chuẩn hóa)</th>
              <th className="py-3 px-3 text-center">Số lượng</th>
              <th className="py-3 px-3 text-right">Đơn giá (VND)</th>
              <th className="py-3 px-4 text-center">Biến động giá</th>
              <th className="py-3 px-4 text-right">Thành tiền</th>
              <th className="py-3 px-2 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4">
                  <input
                    type="text"
                    list="bill-known-items"
                    value={item.canonicalName}
                    onChange={e => onUpdateItem(idx, 'canonicalName', e.target.value)}
                    placeholder="Tên mặt hàng"
                    className={`w-full min-w-40 bg-transparent text-slate-100 font-medium text-sm placeholder:text-slate-500 focus:outline-none focus:bg-slate-800 px-1 py-0.5 rounded border focus:border-slate-600 ${
                      item.canonicalName ? 'border-transparent' : 'border-slate-700'
                    }`}
                  />
                  <div className="text-[11px] text-slate-400 px-1 flex items-center gap-1">
                    {item.rawName && item.rawName !== item.canonicalName && (
                      <span className="truncate">Gốc: {item.rawName} •</span>
                    )}
                    <span className="shrink-0">ĐVT:</span>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={e => onUpdateItem(idx, 'unit', e.target.value)}
                      aria-label="Đơn vị tính"
                      className="w-14 bg-transparent text-slate-300 focus:outline-none focus:bg-slate-800 px-1 rounded border border-transparent focus:border-slate-600"
                    />
                  </div>
                </td>

                <td className="py-3 px-3 text-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => onUpdateItem(idx, 'quantity', e.target.value)}
                    className="w-14 bg-slate-950 text-center text-sm font-semibold text-white px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </td>

                <td className="py-3 px-3 text-right">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="500"
                    value={item.unitPrice || ''}
                    onChange={e => onUpdateItem(idx, 'unitPrice', e.target.value)}
                    placeholder="0"
                    className="w-28 bg-slate-950 text-right text-sm font-semibold text-white px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="text-[11px] text-slate-400">{formatVND(item.unitPrice)}</div>
                </td>

                <td className="py-3 px-4 text-center">
                  <PriceTrendBadge item={item} />
                </td>

                <td className="py-3 px-4 text-right font-bold text-white">{formatVND(item.totalPrice)}</td>

                <td className="py-3 px-2 text-center">
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Xóa món"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
