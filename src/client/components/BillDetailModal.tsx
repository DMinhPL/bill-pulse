import {
  Receipt,
  Store,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import React from 'react';
import { Bill } from '../../../shared/types/bill';
import { formatPercent, formatVND } from '../../../shared/currency';
import { formatDateLong } from '../../../shared/date';
import { enrichBillItemsWithTrends } from '../../../shared/priceTracker';
import { useTablePagination } from '../hooks/useTablePagination';
import { Pagination } from './Pagination';

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
  const pagination = useTablePagination(bill?.items.length ?? 0, bill?.id);

  if (!bill) return null;

  // Enrich items with historical comparison
  const enrichedItems = enrichBillItemsWithTrends(
    bill.items,
    allBills.filter(b => b.id !== bill.id),
    bill.date
  );
  const pagedItems = enrichedItems.slice(pagination.startIndex, pagination.endIndex);

  return (
    <div className="bill-detail fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bill-detail__dialog bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="bill-detail__header p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="bill-detail__heading flex items-center gap-3">
            <div className="bill-detail__icon w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="bill-detail__title-group">
              <h3 className="bill-detail__title font-bold text-lg text-white">
                {bill.merchantName}
              </h3>
              <p className="bill-detail__subtitle text-xs text-slate-400">
                <time className="bill-detail__date" dateTime={bill.date}>
                  {formatDateLong(bill.date)}
                </time>{' '}
                • Mã số: {bill.billNumber || 'Không có mã'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bill-detail__close p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="bill-detail__body p-6 overflow-y-auto space-y-6">
          {/* Metadata Cards */}
          <div className="bill-detail__meta grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bill-detail__meta-item bill-detail__meta-item--category bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="bill-detail__meta-label text-slate-500 block mb-0.5">Danh mục</span>
              <span className="bill-detail__meta-value font-semibold text-slate-200">{bill.category}</span>
            </div>
            <div className="bill-detail__meta-item bill-detail__meta-item--payment bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="bill-detail__meta-label text-slate-500 block mb-0.5">Thanh toán</span>
              <span className="bill-detail__meta-value font-semibold text-slate-200">{bill.paymentMethod || 'Tiền mặt'}</span>
            </div>
            <div className="bill-detail__meta-item bill-detail__meta-item--item-count bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="bill-detail__meta-label text-slate-500 block mb-0.5">Số lượng món</span>
              <span className="bill-detail__meta-value font-semibold text-slate-200">{bill.items.length} món</span>
            </div>
            <div className="bill-detail__meta-item bill-detail__meta-item--total bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="bill-detail__meta-label text-slate-500 block mb-0.5">Tổng số tiền</span>
              <span className="bill-detail__meta-value font-bold text-amber-400">{formatVND(bill.totalAmount)}</span>
            </div>
          </div>

          {/* Branch / Notes */}
          {bill.branch && (
            <div className="bill-detail__branch text-xs text-slate-400 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Địa chỉ / Chi nhánh: {bill.branch}</span>
            </div>
          )}

          {/* Items breakdown with price movement badges */}
          <div className="bill-detail__items">
            <h4 className="bill-detail__section-title font-semibold text-sm text-slate-200 mb-3">
              Chi tiết mặt hàng & Đơn giá so với quá khứ
            </h4>

            <div className="bill-detail__table-scroll max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-800">
              <table className="bill-detail__table w-full min-w-[680px] text-left text-xs sm:text-sm">
                <thead className="bill-detail__table-head bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="bill-detail__col bill-detail__col--name w-[240px] py-2.5 px-3">Tên sản phẩm</th>
                    <th className="bill-detail__col bill-detail__col--quantity w-[56px] py-2.5 px-2 text-center whitespace-nowrap">SL</th>
                    <th className="bill-detail__col bill-detail__col--unit-price w-[100px] py-2.5 px-3 text-right whitespace-nowrap">Đơn giá</th>
                    <th className="bill-detail__col bill-detail__col--trend w-[144px] py-2.5 px-3 text-center whitespace-nowrap">So với trước</th>
                    <th className="bill-detail__col bill-detail__col--total w-[112px] py-2.5 px-3 text-right whitespace-nowrap">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bill-detail__table-body divide-y divide-slate-800/80">
                  {pagedItems.map((item, pageIndex) => {
                    const idx = pagination.startIndex + pageIndex;
                    return (
                      <tr key={`${item.canonicalName}-${idx.toString()}`} className={`bill-detail__row bill-detail__row--${item.trendStatus.toLowerCase()} hover:bg-slate-800/30`}>
                        <td className="bill-detail__cell bill-detail__cell--name py-2.5 px-3">
                          <div className="bill-detail__item-name font-medium text-slate-200">{item.canonicalName}</div>
                          <div className="bill-detail__item-unit text-[10px] text-slate-400">ĐVT: {item.unit}</div>
                        </td>

                      <td className="bill-detail__cell bill-detail__cell--quantity py-2.5 px-2 text-center text-slate-300 font-medium whitespace-nowrap">
                        {item.quantity}
                      </td>

                      <td className="bill-detail__cell bill-detail__cell--unit-price py-2.5 px-3 text-right font-medium text-slate-200 whitespace-nowrap">
                        {formatVND(item.unitPrice)}
                      </td>

                      <td className="bill-detail__cell bill-detail__cell--trend py-2.5 px-3 text-center whitespace-nowrap">
                        {item.trendStatus === 'INCREASED' ? (
                          <span className="bill-detail__trend bill-detail__trend--increased inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <TrendingUp className="w-3 h-3 text-rose-400" />
                            +{formatVND(item.priceDiff, { showSign: false })} ({formatPercent(item.percentChange || 0)})
                          </span>
                        ) : item.trendStatus === 'DECREASED' ? (
                          <span className="bill-detail__trend bill-detail__trend--decreased inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <TrendingDown className="w-3 h-3 text-emerald-400" />
                            {formatVND(item.priceDiff, { showSign: true })} ({formatPercent(item.percentChange || 0)})
                          </span>
                        ) : item.trendStatus === 'UNCHANGED' ? (
                          <span className="bill-detail__trend bill-detail__trend--unchanged text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                            = Bằng giá cũ
                          </span>
                        ) : (
                          <span className="bill-detail__trend bill-detail__trend--new text-[11px] text-blue-300 px-2 py-0.5 rounded bg-blue-500/10">
                            ★ Lần đầu
                          </span>
                        )}
                      </td>

                      <td className="bill-detail__cell bill-detail__cell--total py-2.5 px-3 text-right font-bold text-white whitespace-nowrap">
                        {formatVND(item.totalPrice)}
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {enrichedItems.length > pagination.pageSize && (
              <Pagination
                className="bill-detail__pagination mt-4"
                page={pagination.page}
                pageSize={pagination.pageSize}
                totalItems={enrichedItems.length}
                onPageChange={pagination.setPage}
                itemLabel="món"
              />
            )}
          </div>

          {/* Subtotal & Taxes breakdown */}
          <div className="bill-detail__summary p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-right">
            <div className="bill-detail__summary-row bill-detail__summary-row--subtotal flex justify-between text-slate-400">
              <span>Tiền hàng (chưa thuế):</span>
              <span>{formatVND(bill.subtotal)}</span>
            </div>
            {bill.discountTotal ? (
              <div className="bill-detail__summary-row bill-detail__summary-row--discount flex justify-between text-emerald-400">
                <span>Khuyến mãi / Giảm giá:</span>
                <span>-{formatVND(bill.discountTotal)}</span>
              </div>
            ) : null}
            {bill.vat ? (
              <div className="bill-detail__summary-row bill-detail__summary-row--vat flex justify-between text-slate-400">
                <span>Thuế VAT:</span>
                <span>{formatVND(bill.vat)}</span>
              </div>
            ) : null}
            <div className="bill-detail__summary-row bill-detail__summary-row--total flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span className="text-amber-400">Tổng thanh toán (VND):</span>
              <span className="text-amber-400 text-base">{formatVND(bill.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bill-detail__footer p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bill-detail__close-button px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
