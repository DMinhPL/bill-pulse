import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Receipt,
  ScanLine,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
  History as HistoryIcon
} from 'lucide-react';
import { Bill, PriceTrendSummary } from '../types/bill';
import { formatVND, formatPercent } from '../utils/currency';
import { getTopPriceIncreases, getTopPriceDecreases } from '../utils/priceTracker';

interface DashboardViewProps {
  bills: Bill[];
  priceTrends: PriceTrendSummary[];
  onNavigateTab: (tab: 'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive') => void;
  onSelectItemDeepDive: (itemName: string) => void;
  onSelectBill: (bill: Bill) => void;
  onOpenAIInsights: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bills,
  priceTrends,
  onNavigateTab,
  onSelectItemDeepDive,
  onSelectBill,
  onOpenAIInsights,
}) => {
  // Compute overall stats
  const totalBills = bills.length;
  const totalSpentVND = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Month-to-date spending (e.g. September 2026)
  const currentMonthBills = bills.filter(b => {
    const d = new Date(b.date);
    return d.getMonth() === 8 && d.getFullYear() === 2026; // Sept 2026
  });
  const currentMonthSpentVND = currentMonthBills.length > 0
    ? currentMonthBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    : totalSpentVND;

  const increasedItems = priceTrends.filter(t => t.status === 'INCREASED');
  const decreasedItems = priceTrends.filter(t => t.status === 'DECREASED');
  const unchangedItems = priceTrends.filter(t => t.status === 'UNCHANGED');

  const topIncreases = getTopPriceIncreases(priceTrends, 4);
  const topDecreases = getTopPriceDecreases(priceTrends, 4);

  // Recent 3 bills
  const sortedBills = [...bills].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recentBills = sortedBills.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Banner / Price Inflation Alert */}
      {increasedItems.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/50 border border-rose-500/30 p-5 shadow-xl">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-rose-200 text-base">
                    Cảnh báo lạm phát & tăng giá mặt hàng
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {increasedItems.length} mặt hàng tăng giá
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Hệ thống phát hiện{' '}
                  <strong className="text-white">
                    {topIncreases[0]?.canonicalName || 'Sản phẩm tiêu dùng'}
                  </strong>{' '}
                  đã tăng{' '}
                  <span className="text-rose-400 font-semibold">
                    {topIncreases[0] ? formatVND(topIncreases[0].priceDiff, { showSign: true }) : ''} (
                    {topIncreases[0] ? formatPercent(topIncreases[0].percentChange) : ''})
                  </span>{' '}
                  so với lần mua trước đó.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => onNavigateTab('watchlist')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-950/50 flex items-center gap-1.5"
              >
                <span>Xem danh sách tăng giá</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenAIInsights}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Phân tích AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tổng chi tiêu đã theo dõi</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {formatVND(totalSpentVND)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">{totalBills} hóa đơn</span>
            <span>đã quét thành công</span>
          </div>
        </div>

        {/* Increased Items */}
        <div className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-rose-500/20 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mặt hàng tăng giá</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-rose-400">
              {increasedItems.length}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              / {priceTrends.length} sản phẩm
            </span>
          </div>
          <div className="mt-2 text-xs text-rose-300/80 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>Mức tăng TB: +13.8%</span>
          </div>
        </div>

        {/* Decreased / Discounted Items */}
        <div className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-emerald-500/20 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Hàng giảm giá / Bình ổn</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400">
              {decreasedItems.length}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              hạ nhiệt ({unchangedItems.length} ổn định)
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-300/80 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tiết kiệm mua sắm</span>
          </div>
        </div>

        {/* Currency Standard Guarantee */}
        <div className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-amber-500/20 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tiền tệ & Định dạng</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-amber-400">VND</span>
              <span className="text-lg font-semibold text-white">(₫)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Phân cách hàng nghìn rõ ràng theo chuẩn Việt Nam
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('scan')}
            className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <ScanLine className="w-3.5 h-3.5" />
            Quét thêm hóa đơn
          </button>
        </div>
      </div>

      {/* Main Two-Column Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Price Increases (Red / Alert) */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <h3 className="font-semibold text-white text-base">
                Mặt hàng tăng giá mạnh nhất
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('watchlist')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
            >
              Xem tất cả ({increasedItems.length})
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {topIncreases.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Chưa có dữ liệu tăng giá nào được ghi nhận. Hãy quét thêm hóa đơn!
              </p>
            ) : (
              topIncreases.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectItemDeepDive(item.canonicalName)}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-100 truncate group-hover:text-rose-300 transition-colors">
                          {item.canonicalName}
                        </span>
                        <span className="text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <Store className="w-3 h-3 text-slate-500" />
                        <span>{item.lastStore}</span>
                        <span>•</span>
                        <span>{item.lastPurchasedDate}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-slate-400 line-through">
                          {formatVND(item.previousUnitPrice)}
                        </span>
                        <span className="font-bold text-sm text-white">
                          {formatVND(item.currentUnitPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          +{formatVND(item.priceDiff, { showSign: false })} ({formatPercent(item.percentChange)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Price Drops / Savings (Emerald) */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <h3 className="font-semibold text-white text-base">
                Mặt hàng giảm giá & Hạ nhiệt
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('watchlist')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Xem tất cả
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {topDecreases.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Chưa có mặt hàng nào giảm giá so với các lần mua trước.
              </p>
            ) : (
              topDecreases.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectItemDeepDive(item.canonicalName)}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                          {item.canonicalName}
                        </span>
                        <span className="text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <Store className="w-3 h-3 text-slate-500" />
                        <span>{item.lastStore}</span>
                        <span>•</span>
                        <span>{item.lastPurchasedDate}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-slate-400 line-through">
                          {formatVND(item.previousUnitPrice)}
                        </span>
                        <span className="font-bold text-sm text-white">
                          {formatVND(item.currentUnitPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {formatVND(item.priceDiff, { showSign: true })} ({formatPercent(item.percentChange)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills Carousel / List */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-base">
              Hóa đơn vừa quét gần đây
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('bills')}
            className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1"
          >
            Tất cả hóa đơn ({bills.length})
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentBills.map(bill => (
            <div
              key={bill.id}
              onClick={() => onSelectBill(bill)}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {bill.category}
                  </span>
                  <span className="text-xs text-slate-400">{bill.date}</span>
                </div>
                <h4 className="font-semibold text-sm text-white mt-2 truncate">
                  {bill.merchantName}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {bill.items.length} mặt hàng • {bill.paymentMethod || 'Tiền mặt'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Tổng hóa đơn:</span>
                <span className="font-bold text-base text-amber-400">
                  {formatVND(bill.totalAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
