import React from 'react';
import {
  X,
  Store,
  Calendar,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  FileText,
  FileCheck
} from 'lucide-react';
import { Bill } from '../types/bill';
import { formatVND, formatPercent } from '../utils/currency';
import { enrichBillItemsWithTrends } from '../utils/priceTracker';

interface BillDetailModalProps {
  bill: Bill | null;
  allBills: Bill[];
  onClose: () => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  bill,
  allBills,
  onClose,
}) => {
  if (!bill) return null;

  // Enrich items with historical comparison
  const enrichedItems = enrichBillItemsWithTrends(
    bill.items,
    allBills.filter(b => b.id !== bill.id),
    bill.date
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {bill.merchantName}
              </h3>
              <p className="text-xs text-slate-400">
                {bill.date} • Mã số: {bill.billNumber || 'Không có mã'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Danh mục</span>
              <span className="font-semibold text-slate-200">{bill.category}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Thanh toán</span>
              <span className="font-semibold text-slate-200">{bill.paymentMethod || 'Tiền mặt'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Số lượng món</span>
              <span className="font-semibold text-slate-200">{bill.items.length} món</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Tổng số tiền</span>
              <span className="font-bold text-amber-400">{formatVND(bill.totalAmount)}</span>
            </div>
          </div>

          {/* Branch / Notes */}
          {bill.branch && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Địa chỉ / Chi nhánh: {bill.branch}</span>
            </div>
          )}

          {/* Items breakdown with price movement badges */}
          <div>
            <h4 className="font-semibold text-sm text-slate-200 mb-3">
              Chi tiết mặt hàng & Đơn giá so với quá khứ
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-2 text-center">SL</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center">So với trước</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {enrichedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-200">{item.canonicalName}</div>
                        <div className="text-[10px] text-slate-400">ĐVT: {item.unit}</div>
                      </td>

                      <td className="py-2.5 px-2 text-center text-slate-300 font-medium">
                        {item.quantity}
                      </td>

                      <td className="py-2.5 px-3 text-right font-medium text-slate-200">
                        {formatVND(item.unitPrice)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {item.trendStatus === 'INCREASED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <TrendingUp className="w-3 h-3 text-rose-400" />
                            +{formatVND(item.priceDiff, { showSign: false })} ({formatPercent(item.percentChange || 0)})
                          </span>
                        ) : item.trendStatus === 'DECREASED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <TrendingDown className="w-3 h-3 text-emerald-400" />
                            {formatVND(item.priceDiff, { showSign: true })} ({formatPercent(item.percentChange || 0)})
                          </span>
                        ) : item.trendStatus === 'UNCHANGED' ? (
                          <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                            = Bằng giá cũ
                          </span>
                        ) : (
                          <span className="text-[11px] text-blue-300 px-2 py-0.5 rounded bg-blue-500/10">
                            ★ Lần đầu
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatVND(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal & Taxes breakdown */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-400">
              <span>Tiền hàng (chưa thuế):</span>
              <span>{formatVND(bill.subtotal)}</span>
            </div>
            {bill.discountTotal ? (
              <div className="flex justify-between text-emerald-400">
                <span>Khuyến mãi / Giảm giá:</span>
                <span>-{formatVND(bill.discountTotal)}</span>
              </div>
            ) : null}
            {bill.vat ? (
              <div className="flex justify-between text-slate-400">
                <span>Thuế VAT:</span>
                <span>{formatVND(bill.vat)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span className="text-amber-400">Tổng thanh toán (VND):</span>
              <span className="text-amber-400 text-base">{formatVND(bill.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
