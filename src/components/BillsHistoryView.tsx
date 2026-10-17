import React, { useState } from 'react';
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
import { Bill } from '../types/bill';
import { formatVND } from '../utils/currency';

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

  return (
    <div className="space-y-6">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-amber-400" />
            <span>Lịch sử hóa đơn đã quét ({bills.length})</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tổng hợp các hóa đơn mua sắm, siêu thị và chi tiêu cá nhân bằng tiền tệ VND.
          </p>
        </div>

        <button
          onClick={onNavigateScan}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-md flex items-center gap-1.5"
        >
          <Receipt className="w-4 h-4" />
          <span>+ Quét hóa đơn mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo cửa hàng, mã HĐ, tên món..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 rounded-xl text-xs text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {merchants.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Cửa hàng:</span>
            <select
              value={selectedMerchant}
              onChange={e => setSelectedMerchant(e.target.value)}
              className="bg-slate-950 text-xs text-slate-200 py-2 px-3 rounded-xl border border-slate-800 focus:outline-none w-full sm:w-auto"
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
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Chưa tìm thấy hóa đơn nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => (
            <div
              key={bill.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                      {bill.category}
                    </span>
                    <h3 className="font-bold text-white text-base mt-2 group-hover:text-amber-400 transition-colors">
                      {bill.merchantName}
                    </h3>
                  </div>

                  <span className="text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                    {bill.date}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  {bill.branch && (
                    <p className="truncate flex items-center gap-1">
                      <Store className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{bill.branch}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Mã: {bill.billNumber || 'N/A'}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{bill.paymentMethod || 'Tiền mặt'}</span>
                  </p>
                </div>

                {/* Sample items preview */}
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 font-medium mb-1">
                    {bill.items.length} món trong hóa đơn:
                  </div>
                  <div className="space-y-1">
                    {bill.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300">
                        <span className="truncate max-w-[180px]">• {item.canonicalName}</span>
                        <span className="font-medium text-slate-400 shrink-0">
                          {formatVND(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                    {bill.items.length > 3 && (
                      <div className="text-[10px] text-slate-500 italic">
                        + thêm {bill.items.length - 3} món khác...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total & Action */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tổng tiền</span>
                  <span className="font-extrabold text-base text-amber-400">
                    {formatVND(bill.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectBill(bill)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Xem chi tiết hóa đơn"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                  </button>

                  <button
                    onClick={() => onDeleteBill(bill.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Xóa hóa đơn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
