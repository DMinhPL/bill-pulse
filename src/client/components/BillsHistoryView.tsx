import React, { useEffect, useRef, useState } from 'react';
import {
  History as HistoryIcon,
  Receipt,
  Search,
  Calendar,
  Store,
  CreditCard,
  Eye,
  Trash2,
  TrendingUp,
  FileText,
  CheckCircle,
  X
} from 'lucide-react';
import { Bill } from '../../../shared/types/bill';
import { formatVND } from '../../../shared/currency';
import { formatDateShort } from '../../../shared/date';
import { Pagination } from './Pagination';

// Multiples of 6 fill whole rows of the 1-, 2- and 3-column grid
const DEFAULT_PAGE_SIZE = 6;
const PAGE_SIZE_OPTIONS = [6, 12, 24];

interface BillsHistoryViewProps {
  bills: Bill[];
  onDeleteBill: (billId: string) => void;
  onSelectBill: (bill: Bill) => void;
  onNavigateScan: () => void;
}

export const BillsHistoryView: React.FC<BillsHistoryViewProps> = ({
  bills,
  onDeleteBill,
  onSelectBill,
  onNavigateScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const gridRef = useRef<HTMLDivElement>(null);

  // Extract unique merchants
  const merchants = Array.from(new Set(bills.map(b => b.merchantName)));

  // Filter bills
  const filteredBills = bills
    .filter(bill => {
      if (selectedMerchant !== 'ALL' && bill.merchantName !== selectedMerchant) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          bill.merchantName.toLowerCase().includes(q) ||
          (bill.branch && bill.branch.toLowerCase().includes(q)) ||
          (bill.billNumber && bill.billNumber.toLowerCase().includes(q)) ||
          bill.items.some(i => i.canonicalName.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpentAllBills = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // A new search, store filter or page size starts again from page 1
  useEffect(() => setPage(1), [searchQuery, selectedMerchant, pageSize]);

  // Clamp in case the list shrank (e.g. the last bill on a page was deleted)
  const pageCount = Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedBills = filteredBills.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (next: number) => {
    setPage(next);
    // Bring the top of the grid back into view when paging from the bottom controls
    gridRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div className="bills-history space-y-6">
      {/* Title & Summary */}
      <div className="bills-history__header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bills-history__heading">
          <h2 className="bills-history__title text-xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-amber-400" />
            <span>Lịch sử hóa đơn đã quét ({bills.length})</span>
          </h2>
          <p className="bills-history__subtitle text-sm text-slate-400 mt-1">
            Tổng hợp các hóa đơn mua sắm, siêu thị và chi tiêu cá nhân bằng tiền tệ VND.
          </p>
        </div>

        <button
          onClick={onNavigateScan}
          className="bills-history__scan-button self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-md flex items-center gap-1.5"
        >
          <Receipt className="w-4 h-4" />
          <span>+ Quét hóa đơn mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bills-history__toolbar bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="bills-history__search relative w-full sm:w-80">
          <Search className="bills-history__search-icon w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo cửa hàng, mã HĐ, tên món..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bills-history__search-input w-full pl-10 pr-4 py-2 bg-slate-950 rounded-xl text-xs text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {merchants.length > 0 && (
          <div className="bills-history__merchant-filter flex items-center gap-2 w-full sm:w-auto">
            <span className="bills-history__merchant-label text-xs text-slate-400 shrink-0">Cửa hàng:</span>
            <select
              value={selectedMerchant}
              onChange={e => setSelectedMerchant(e.target.value)}
              className="bills-history__merchant-select bg-slate-950 text-xs text-slate-200 py-2 px-3 rounded-xl border border-slate-800 focus:outline-none w-full sm:w-auto"
            >
              <option value="ALL">Tất cả ({bills.length})</option>
              {merchants.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bills Cards Grid */}
      {filteredBills.length === 0 ? (
        <div className="bills-history__empty text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Chưa tìm thấy hóa đơn nào phù hợp.</p>
        </div>
      ) : (
        <>
        <div ref={gridRef} className="bills-history__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
          {pagedBills.map(bill => (
            <div
              key={bill.id}
              className="bill-card p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md group"
            >
              <div className="bill-card__body">
                {/* Category + date on one row, merchant name gets the full card width below */}
                <div className="bill-card__header">
                  <div className="bill-card__header-top flex items-center justify-between gap-3">
                    <span className="bill-card__category min-w-0 truncate px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300">
                      {bill.category}
                    </span>

                    <time
                      dateTime={bill.date}
                      className="bill-card__date shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatDateShort(bill.date)}
                    </time>
                  </div>

                  <h3
                    className="bill-card__merchant mt-3 font-bold text-white text-base leading-snug line-clamp-2 wrap-break-word group-hover:text-amber-400 transition-colors"
                    title={bill.merchantName}
                  >
                    {bill.merchantName}
                  </h3>
                </div>

                <div className="bill-card__meta mt-2.5 space-y-1 text-xs text-slate-400">
                  {bill.branch && (
                    <p
                      className="bill-card__meta-item bill-card__meta-item--branch flex items-center gap-1 min-w-0"
                      title={bill.branch}
                    >
                      <Store className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{bill.branch}</span>
                    </p>
                  )}
                  <p className="bill-card__meta-item bill-card__meta-item--number flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Mã: {bill.billNumber || 'N/A'}</span>
                  </p>
                  <p className="bill-card__meta-item bill-card__meta-item--payment flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{bill.paymentMethod || 'Tiền mặt'}</span>
                  </p>
                </div>

                {/* Sample items preview */}
                <div className="bill-card__items mt-3 pt-3 border-t border-slate-800/80">
                  <div className="bill-card__items-count text-[11px] text-slate-400 font-medium mb-1">
                    {bill.items.length} món trong hóa đơn:
                  </div>
                  <div className="bill-card__item-list space-y-1">
                    {bill.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="bill-card__item flex justify-between text-xs text-slate-300">
                        <span className="bill-card__item-name truncate max-w-[180px]">• {item.canonicalName}</span>
                        <span className="bill-card__item-price font-medium text-slate-400 shrink-0">
                          {formatVND(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                    {bill.items.length > 3 && (
                      <div className="bill-card__items-more text-[10px] text-slate-500 italic">
                        + thêm {bill.items.length - 3} món khác...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total & Action */}
              <div className="bill-card__footer mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="bill-card__total">
                  <span className="bill-card__total-label text-[10px] text-slate-400 uppercase tracking-wider block">Tổng tiền</span>
                  <span className="bill-card__total-value font-extrabold text-base text-amber-400">
                    {formatVND(bill.totalAmount)}
                  </span>
                </div>

                <div className="bill-card__actions flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectBill(bill)}
                    className="bill-card__action bill-card__action--view p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Xem chi tiết hóa đơn"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                  </button>

                  <button
                    onClick={() => onDeleteBill(bill.id)}
                    className="bill-card__action bill-card__action--delete p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Xóa hóa đơn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBills.length > DEFAULT_PAGE_SIZE && (
          <Pagination
            className="bills-history__pagination"
            page={currentPage}
            pageSize={pageSize}
            totalItems={filteredBills.length}
            onPageChange={goToPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            itemLabel="hóa đơn"
          />
        )}
        </>
      )}
    </div>
  );
};
