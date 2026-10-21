import React, { useMemo, useState } from 'react';
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
  History as HistoryIcon,
  PieChart
} from 'lucide-react';
import { Bill, PriceTrendSummary } from '../../../shared/types/bill';
import { AppTab } from '../types/navigation';
import { formatVND, formatPercent } from '../../../shared/currency';
import { formatDateShort } from '../../../shared/date';
import { getTopPriceIncreases, getTopPriceDecreases } from '../../../shared/priceTracker';
import { SpendingShareChart, computeSpendingShare, MonthRange, formatMonthKey } from './charts/SpendingShareChart';
import { MonthRangePicker, MonthRangePreset, rangeForPreset } from './MonthRangePicker';

interface DashboardViewProps {
  bills: Bill[];
  priceTrends: PriceTrendSummary[];
  onNavigateTab: (tab: AppTab) => void;
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

  // Monthly spending split by product group, for the selected month range
  const [sharePreset, setSharePreset] = useState<MonthRangePreset>('12m');
  const [shareCustomRange, setShareCustomRange] = useState<MonthRange>({});
  const shareRange = sharePreset === 'custom' ? shareCustomRange : rangeForPreset(sharePreset);
  const spendingShare = useMemo(
    () => computeSpendingShare(bills, shareRange),
    [bills, shareRange.from, shareRange.to]
  );
  const shareMonths = spendingShare.availableMonths;
  // The custom selects always show the months actually on screen
  const shownFrom = spendingShare.months[0]?.key ?? shareMonths[0] ?? '';
  const shownTo = spendingShare.months[spendingShare.months.length - 1]?.key ?? shareMonths[shareMonths.length - 1] ?? '';

  return (
    <div className="dashboard space-y-6">
      {/* Top Banner / Price Inflation Alert */}
      {increasedItems.length > 0 && (
        <div className="dashboard__price-alert relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/50 border border-rose-500/30 p-5 shadow-xl">
          <div className="dashboard__price-alert-decoration absolute -right-8 -top-8 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="dashboard__price-alert-content flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="dashboard__price-alert-summary flex items-start gap-3.5">
              <div className="dashboard__price-alert-icon p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <AlertTriangle className="dashboard__price-alert-icon-symbol w-6 h-6 animate-pulse" />
              </div>
              <div className="dashboard__price-alert-body">
                <div className="dashboard__price-alert-heading flex items-center gap-2">
                  <h3 className="dashboard__price-alert-title font-semibold text-rose-200 text-base">
                    Cảnh báo lạm phát & tăng giá mặt hàng
                  </h3>
                  <span className="dashboard__price-alert-count px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {increasedItems.length} mặt hàng tăng giá
                  </span>
                </div>
                <p className="dashboard__price-alert-description text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Hệ thống phát hiện{' '}
                  <strong className="dashboard__price-alert-item text-white">
                    {topIncreases[0]?.canonicalName || 'Sản phẩm tiêu dùng'}
                  </strong>{' '}
                  đã tăng{' '}
                  <span className="dashboard__price-alert-change text-rose-400 font-semibold">
                    {topIncreases[0] ? formatVND(topIncreases[0].priceDiff, { showSign: true }) : ''} (
                    {topIncreases[0] ? formatPercent(topIncreases[0].percentChange) : ''})
                  </span>{' '}
                  so với lần mua trước đó.
                </p>
              </div>
            </div>

            <div className="dashboard__price-alert-actions flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => onNavigateTab('watchlist')}
                className="dashboard__price-alert-action dashboard__price-alert-action--watchlist px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-950/50 flex items-center gap-1.5"
              >
                <span>Xem danh sách tăng giá</span>
                <ChevronRight className="dashboard__price-alert-action-icon w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenAIInsights}
                className="dashboard__price-alert-action dashboard__price-alert-action--ai px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="dashboard__price-alert-action-icon w-3.5 h-3.5 text-purple-400" />
                <span className="dashboard__price-alert-action-label hidden sm:inline">Phân tích AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="dashboard__kpis grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="dashboard__kpi dashboard__kpi--total-spent bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md">
          <div className="dashboard__kpi-header flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="dashboard__kpi-label">Tổng chi tiêu đã theo dõi</span>
            <div className="dashboard__kpi-icon p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Receipt className="dashboard__kpi-icon-symbol w-4 h-4" />
            </div>
          </div>
          <div className="dashboard__kpi-value-row mt-2">
            <span className="dashboard__kpi-value text-xl sm:text-2xl font-bold tracking-tight text-white">
              {formatVND(totalSpentVND)}
            </span>
          </div>
          <div className="dashboard__kpi-meta mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span className="dashboard__kpi-meta-value text-emerald-400 font-medium">{totalBills} hóa đơn</span>
            <span className="dashboard__kpi-meta-label">đã quét thành công</span>
          </div>
        </div>

        {/* Increased Items */}
        <div className="dashboard__kpi dashboard__kpi--increased bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-rose-500/20 shadow-md">
          <div className="dashboard__kpi-header flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="dashboard__kpi-label">Mặt hàng tăng giá</span>
            <div className="dashboard__kpi-icon p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingUp className="dashboard__kpi-icon-symbol w-4 h-4" />
            </div>
          </div>
          <div className="dashboard__kpi-value-row mt-2 flex items-baseline gap-2">
            <span className="dashboard__kpi-value text-xl sm:text-2xl font-bold tracking-tight text-rose-400">
              {increasedItems.length}
            </span>
            <span className="dashboard__kpi-value-context text-xs text-slate-400 font-normal">
              / {priceTrends.length} sản phẩm
            </span>
          </div>
          <div className="dashboard__kpi-meta mt-2 text-xs text-rose-300/80 flex items-center gap-1">
            <ArrowUpRight className="dashboard__kpi-meta-icon w-3.5 h-3.5 text-rose-400" />
            <span className="dashboard__kpi-meta-label">Mức tăng TB: +13.8%</span>
          </div>
        </div>

        {/* Decreased / Discounted Items */}
        <div className="dashboard__kpi dashboard__kpi--decreased bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-emerald-500/20 shadow-md">
          <div className="dashboard__kpi-header flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="dashboard__kpi-label">Hàng giảm giá / Bình ổn</span>
            <div className="dashboard__kpi-icon p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="dashboard__kpi-icon-symbol w-4 h-4" />
            </div>
          </div>
          <div className="dashboard__kpi-value-row mt-2 flex items-baseline gap-2">
            <span className="dashboard__kpi-value text-xl sm:text-2xl font-bold tracking-tight text-emerald-400">
              {decreasedItems.length}
            </span>
            <span className="dashboard__kpi-value-context text-xs text-slate-400 font-normal">
              hạ nhiệt ({unchangedItems.length} ổn định)
            </span>
          </div>
          <div className="dashboard__kpi-meta mt-2 text-xs text-emerald-300/80 flex items-center gap-1">
            <ArrowDownRight className="dashboard__kpi-meta-icon w-3.5 h-3.5 text-emerald-400" />
            <span className="dashboard__kpi-meta-label">Tiết kiệm mua sắm</span>
          </div>
        </div>

        {/* Currency Standard Guarantee */}
        <div className="dashboard__kpi dashboard__kpi--currency bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-amber-500/20 shadow-md flex flex-col justify-between">
          <div className="dashboard__kpi-header flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="dashboard__kpi-label">Tiền tệ & Định dạng</span>
            <div className="dashboard__kpi-icon p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="dashboard__kpi-icon-symbol w-4 h-4" />
            </div>
          </div>
          <div className="dashboard__kpi-value-row mt-2">
            <div className="dashboard__currency flex items-center gap-1.5">
              <span className="dashboard__currency-code text-xl sm:text-2xl font-bold text-amber-400">VND</span>
              <span className="dashboard__currency-symbol text-lg font-semibold text-white">(₫)</span>
            </div>
            <p className="dashboard__currency-description text-xs text-slate-400 mt-1">
              Phân cách hàng nghìn rõ ràng theo chuẩn Việt Nam
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('scan')}
            className="dashboard__kpi-action mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <ScanLine className="dashboard__kpi-action-icon w-3.5 h-3.5" />
            Quét thêm hóa đơn
          </button>
        </div>
      </div>

      {/* Spending share by product group over time */}
      <section className="dashboard__spending-share bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
        <div className="dashboard__spending-share-header flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="dashboard__spending-share-heading">
            <h3 className="dashboard__spending-share-title font-semibold text-white text-base flex items-center gap-2">
              <PieChart className="dashboard__spending-share-icon w-4 h-4 text-slate-400" />
              Tỉ lệ phân bổ mua sắm theo nhóm sản phẩm
            </h3>
            <p className="dashboard__spending-share-subtitle text-xs text-slate-400 mt-1">
              Mỗi cột là 100% chi tiêu của tháng đó, chia theo nhóm sản phẩm (tính theo thành tiền từng món).
            </p>
          </div>
          {spendingShare.months.length > 0 && (
            <span className="dashboard__spending-share-range text-xs text-slate-400 shrink-0">
              {shownFrom === shownTo
                ? `Tháng ${formatMonthKey(shownFrom)}`
                : `${formatMonthKey(shownFrom)} – ${formatMonthKey(shownTo)} · ${spendingShare.months.length} tháng có chi tiêu`}
            </span>
          )}
        </div>

        {/* Date range: presets first, then a custom from/to */}
        {shareMonths.length > 0 && (
          <MonthRangePicker
            className="dashboard__spending-share-filters mt-3"
            availableMonths={shareMonths}
            preset={sharePreset}
            from={shownFrom}
            to={shownTo}
            onPresetChange={setSharePreset}
            onCustomChange={range => {
              setShareCustomRange(range);
              setSharePreset('custom');
            }}
          />
        )}

        {shareMonths.length === 0 ? (
          <p className="dashboard__spending-share-empty text-center py-10 text-xs text-slate-500">
            Chưa có dữ liệu chi tiêu. Quét hóa đơn đầu tiên để xem tỉ lệ phân bổ theo nhóm sản phẩm.
          </p>
        ) : spendingShare.months.length === 0 ? (
          <p className="dashboard__spending-share-empty text-center py-10 text-xs text-slate-500">
            Không có chi tiêu nào trong khoảng thời gian này. Hãy chọn khoảng khác hoặc "Tất cả".
          </p>
        ) : (
          <div className="dashboard__spending-share-body mt-4 flex flex-col lg:flex-row gap-5">
            <SpendingShareChart className="dashboard__spending-share-canvas h-72 flex-1 min-w-0" share={spendingShare} />

            {/* Legend: colour, group name and share of all spending in the period */}
            <ul className="dashboard__spending-share-legend lg:w-64 shrink-0 grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2 content-start">
              {spendingShare.groups.map(group => (
                <li key={group.name} className="dashboard__spending-share-legend-item flex items-center gap-2 min-w-0 text-xs">
                  <span className="dashboard__spending-share-legend-color w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: group.color }} />
                  <span className="dashboard__spending-share-legend-name truncate text-slate-300" title={group.name}>{group.name}</span>
                  <span className="dashboard__spending-share-legend-value ml-auto pl-2 tabular-nums font-semibold text-slate-200">
                    {group.overallShare.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Main Two-Column Analysis Section */}
      <div className="dashboard__trend-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Price Increases (Red / Alert) */}
        <div className="dashboard__trend-panel dashboard__trend-panel--increased bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
          <div className="dashboard__trend-header flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="dashboard__trend-heading flex items-center gap-2">
              <div className="dashboard__trend-indicator dashboard__trend-indicator--increased w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <h3 className="dashboard__trend-title font-semibold text-white text-base">
                Mặt hàng tăng giá mạnh nhất
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('watchlist')}
              className="dashboard__trend-link dashboard__trend-link--increased text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
            >
              Xem tất cả ({increasedItems.length})
              <ChevronRight className="dashboard__trend-link-icon w-3 h-3" />
            </button>
          </div>

          <div className="dashboard__trend-list mt-4 space-y-3">
            {topIncreases.length === 0 ? (
              <p className="dashboard__trend-empty text-sm text-slate-500 py-6 text-center">
                Chưa có dữ liệu tăng giá nào được ghi nhận. Hãy quét thêm hóa đơn!
              </p>
            ) : (
              topIncreases.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectItemDeepDive(item.canonicalName)}
                  className="dashboard__trend-item dashboard__trend-item--increased p-4 md:p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
                >
                  <div className="dashboard__trend-item-content flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="dashboard__trend-item-details w-full md:flex-1 min-w-0">
                      <div className="dashboard__trend-item-name-row flex items-center gap-2 min-w-0">
                        <span className="dashboard__trend-item-name min-w-0 flex-1 font-medium text-sm text-slate-100 truncate group-hover:text-rose-300 transition-colors">
                          {item.canonicalName}
                        </span>
                        <span className="dashboard__trend-item-unit shrink-0 text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {item.unit}
                        </span>
                      </div>
                      <div className="dashboard__trend-item-meta flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-400">
                        <Store className="dashboard__trend-item-store-icon w-3 h-3 text-slate-500 shrink-0" />
                        <span className="dashboard__trend-item-store min-w-[12rem] flex-1">{item.lastStore}</span>
                        <span className="dashboard__trend-item-separator">•</span>
                        <span className="dashboard__trend-item-date whitespace-nowrap">{item.lastPurchasedDate}</span>
                      </div>
                    </div>

                    <div className="dashboard__trend-item-pricing w-full md:w-auto shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-800/80 text-right">
                      <div className="dashboard__trend-item-prices flex items-center justify-between md:justify-end gap-3 md:gap-1.5">
                        <span className="dashboard__trend-item-previous-price text-xs text-slate-400 line-through whitespace-nowrap">
                          {formatVND(item.previousUnitPrice)}
                        </span>
                        <span className="dashboard__trend-item-current-price font-bold text-sm text-white whitespace-nowrap">
                          {formatVND(item.currentUnitPrice)}
                        </span>
                      </div>
                      <div className="dashboard__trend-item-change-row flex items-center justify-end gap-1 mt-1.5 md:mt-0.5">
                        <span className="dashboard__trend-item-change dashboard__trend-item-change--increased text-xs font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 whitespace-nowrap">
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
        <div className="dashboard__trend-panel dashboard__trend-panel--decreased bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
          <div className="dashboard__trend-header flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="dashboard__trend-heading flex items-center gap-2">
              <div className="dashboard__trend-indicator dashboard__trend-indicator--decreased w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <h3 className="dashboard__trend-title font-semibold text-white text-base">
                Mặt hàng giảm giá & Hạ nhiệt
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('watchlist')}
              className="dashboard__trend-link dashboard__trend-link--decreased text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Xem tất cả
              <ChevronRight className="dashboard__trend-link-icon w-3 h-3" />
            </button>
          </div>

          <div className="dashboard__trend-list mt-4 space-y-3">
            {topDecreases.length === 0 ? (
              <p className="dashboard__trend-empty text-sm text-slate-500 py-6 text-center">
                Chưa có mặt hàng nào giảm giá so với các lần mua trước.
              </p>
            ) : (
              topDecreases.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectItemDeepDive(item.canonicalName)}
                  className="dashboard__trend-item dashboard__trend-item--decreased p-4 md:p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                  <div className="dashboard__trend-item-content flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="dashboard__trend-item-details w-full md:flex-1 min-w-0">
                      <div className="dashboard__trend-item-name-row flex items-center gap-2 min-w-0">
                        <span className="dashboard__trend-item-name min-w-0 flex-1 font-medium text-sm text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                          {item.canonicalName}
                        </span>
                        <span className="dashboard__trend-item-unit shrink-0 text-[11px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {item.unit}
                        </span>
                      </div>
                      <div className="dashboard__trend-item-meta flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-400">
                        <Store className="dashboard__trend-item-store-icon w-3 h-3 text-slate-500 shrink-0" />
                        <span className="dashboard__trend-item-store min-w-[12rem] flex-1">{item.lastStore}</span>
                        <span className="dashboard__trend-item-separator">•</span>
                        <span className="dashboard__trend-item-date whitespace-nowrap">{item.lastPurchasedDate}</span>
                      </div>
                    </div>

                    <div className="dashboard__trend-item-pricing w-full md:w-auto shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-800/80 text-right">
                      <div className="dashboard__trend-item-prices flex items-center justify-between md:justify-end gap-3 md:gap-1.5">
                        <span className="dashboard__trend-item-previous-price text-xs text-slate-400 line-through whitespace-nowrap">
                          {formatVND(item.previousUnitPrice)}
                        </span>
                        <span className="dashboard__trend-item-current-price font-bold text-sm text-white whitespace-nowrap">
                          {formatVND(item.currentUnitPrice)}
                        </span>
                      </div>
                      <div className="dashboard__trend-item-change-row flex items-center justify-end gap-1 mt-1.5 md:mt-0.5">
                        <span className="dashboard__trend-item-change dashboard__trend-item-change--decreased text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
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
      <div className="dashboard__recent-bills bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
        <div className="dashboard__recent-bills-header flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="dashboard__recent-bills-heading flex items-center gap-2">
            <HistoryIcon className="dashboard__recent-bills-icon w-4 h-4 text-amber-400" />
            <h3 className="dashboard__recent-bills-title font-semibold text-white text-base">
              Hóa đơn vừa quét gần đây
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('bills')}
            className="dashboard__recent-bills-link text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1"
          >
            Tất cả hóa đơn ({bills.length})
            <ChevronRight className="dashboard__recent-bills-link-icon w-3 h-3" />
          </button>
        </div>

        <div className="dashboard__recent-bills-grid mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentBills.map(bill => (
            <div
              key={bill.id}
              onClick={() => onSelectBill(bill)}
              className="dashboard__recent-bill p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="dashboard__recent-bill-content">
                <div className="dashboard__recent-bill-meta flex items-center justify-between">
                  <span className="dashboard__recent-bill-category text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {bill.category}
                  </span>
                  <span className="dashboard__recent-bill-date text-xs text-slate-400">{formatDateShort(bill.date)}</span>
                </div>
                <h4 className="dashboard__recent-bill-merchant font-semibold text-sm text-white mt-2 truncate">
                  {bill.merchantName}
                </h4>
                <p className="dashboard__recent-bill-description text-xs text-slate-400 mt-1 line-clamp-1">
                  {bill.items.length} mặt hàng • {bill.paymentMethod || 'Tiền mặt'}
                </p>
              </div>

              <div className="dashboard__recent-bill-total mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="dashboard__recent-bill-total-label text-xs text-slate-400">Tổng hóa đơn:</span>
                <span className="dashboard__recent-bill-total-value font-bold text-base text-amber-400">
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
