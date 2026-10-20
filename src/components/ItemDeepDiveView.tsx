import React from 'react';
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  Store,
  Calendar,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { PriceTrendSummary } from '../types/bill';
import { formatVND, formatPercent } from '../utils/currency';
import { PriceHistoryChart } from './charts/PriceHistoryChart';

interface ItemDeepDiveViewProps {
  priceTrends: PriceTrendSummary[];
  selectedItemName: string | null;
  onSelectItem: (name: string) => void;
}

export const ItemDeepDiveView: React.FC<ItemDeepDiveViewProps> = ({
  priceTrends,
  selectedItemName,
  onSelectItem,
}) => {
  // Current active item
  const currentItem =
    priceTrends.find(t => t.canonicalName === selectedItemName) ||
    priceTrends[0] ||
    null;

  if (!currentItem) {
    return (
      <div className="item-deep-dive item-deep-dive--empty text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
        <p className="item-deep-dive__empty-text text-slate-400">Chưa có mặt hàng nào trong cơ sở dữ liệu.</p>
      </div>
    );
  }

  // Sort history chronologically
  const timeline = [...currentItem.history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Keep the headline trend consistent with the watchlist: latest purchase vs.
  // the immediately previous purchase. The full history remains visible below.
  const latestTrendModifier = currentItem.status.toLowerCase();

  return (
    <div className="item-deep-dive space-y-6">
      {/* Title & Item Selector Dropdown */}
      <div className="item-deep-dive__header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="item-deep-dive__heading">
          <h2 className="item-deep-dive__title text-xl font-bold text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-amber-400" />
            <span>Biểu đồ diễn biến giá theo thời gian</span>
          </h2>
          <p className="item-deep-dive__subtitle text-sm text-slate-400 mt-1">
            Theo dõi xu hướng tăng giảm giá chi tiết của từng mặt hàng qua các tháng.
          </p>
        </div>

        {/* Dropdown to pick product */}
        <div className="item-deep-dive__item-picker w-full sm:w-80">
          <select
            value={currentItem.canonicalName}
            onChange={e => onSelectItem(e.target.value)}
            className="item-deep-dive__item-select w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-md"
          >
            {priceTrends.map(t => (
              <option key={t.canonicalName} value={t.canonicalName}>
                {t.canonicalName} ({formatVND(t.currentUnitPrice)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Item Overview Hero Card */}
      <div className={`item-overview item-overview--${latestTrendModifier} bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden`}>
        <div className="item-overview__main flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="item-overview__info space-y-1">
            <div className="item-overview__tags flex items-center gap-2">
              <span className="item-overview__category px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                {currentItem.category || 'Mặt hàng tiêu dùng'}
              </span>
              <span className="item-overview__unit text-xs text-slate-400">Đơn vị tính: {currentItem.unit}</span>
            </div>
            <h3 className="item-overview__name text-2xl font-black text-white tracking-tight">
              {currentItem.canonicalName}
            </h3>
            <p className="item-overview__last-purchase text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span className="item-overview__last-store">Cửa hàng mua gần nhất: <strong>{currentItem.lastStore}</strong></span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="item-overview__last-date">{currentItem.lastPurchasedDate}</span>
            </p>
          </div>

          {/* Current Price & Total Trend */}
          <div className="item-overview__pricing bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-6">
            <div className="item-overview__current-price">
              <span className="item-overview__label text-xs text-slate-400 block">Đơn giá hiện tại (VND)</span>
              <span className="item-overview__value text-2xl font-black text-amber-400 tracking-tight">
                {formatVND(currentItem.currentUnitPrice)}
              </span>
            </div>

            <div className="item-overview__overall-change border-l border-slate-800 pl-6">
              <span className="item-overview__label text-xs text-slate-400 block">Biến động so với lần trước</span>
              {currentItem.status === 'INCREASED' ? (
                <div className="item-overview__change item-overview__change--increased flex items-center gap-1 text-rose-400 font-bold text-base">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{formatVND(currentItem.priceDiff, { showSign: false })}</span>
                  <span className="item-overview__change-percent text-xs font-semibold">({formatPercent(currentItem.percentChange)})</span>
                </div>
              ) : currentItem.status === 'DECREASED' ? (
                <div className="item-overview__change item-overview__change--decreased flex items-center gap-1 text-emerald-400 font-bold text-base">
                  <TrendingDown className="w-4 h-4" />
                  <span>{formatVND(currentItem.priceDiff, { showSign: true })}</span>
                  <span className="item-overview__change-percent text-xs font-semibold">({formatPercent(currentItem.percentChange)})</span>
                </div>
              ) : currentItem.status === 'NEW' ? (
                <span className="item-overview__change item-overview__change--new text-blue-300 font-bold text-base">Lần đầu mua</span>
              ) : (
                <span className="item-overview__change item-overview__change--unchanged text-slate-300 font-bold text-base">Không đổi (0%)</span>
              )}
            </div>
          </div>
        </div>

        {/* 4 Stat Pills */}
        <div className="item-overview__stats grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="item-overview__stat item-overview__stat--min bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="item-overview__stat-label text-[11px] text-slate-500 block">Giá thấp nhất từng mua</span>
            <span className="item-overview__stat-value text-sm font-bold text-emerald-400">{formatVND(currentItem.minPrice)}</span>
          </div>
          <div className="item-overview__stat item-overview__stat--max bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="item-overview__stat-label text-[11px] text-slate-500 block">Giá cao nhất từng mua</span>
            <span className="item-overview__stat-value text-sm font-bold text-rose-400">{formatVND(currentItem.maxPrice)}</span>
          </div>
          <div className="item-overview__stat item-overview__stat--avg bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="item-overview__stat-label text-[11px] text-slate-500 block">Đơn giá trung bình</span>
            <span className="item-overview__stat-value text-sm font-bold text-slate-200">{formatVND(currentItem.avgPrice)}</span>
          </div>
          <div className="item-overview__stat item-overview__stat--total bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="item-overview__stat-label text-[11px] text-slate-500 block">Tổng tiền đã chi</span>
            <span className="item-overview__stat-value text-sm font-bold text-white">{formatVND(currentItem.totalSpent)}</span>
          </div>
        </div>
      </div>

      {/* Visual SVG Price Trend Chart */}
      <div className="price-chart bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="price-chart__header flex items-center justify-between">
          <h4 className="price-chart__title font-semibold text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span>Biểu đồ giá theo các mốc thời gian</span>
          </h4>
          <span className="price-chart__count text-xs text-slate-400">
            {timeline.length} lần ghi nhận
          </span>
        </div>

        {timeline.length < 2 ? (
          <div className="price-chart__empty text-center py-10 text-slate-500 text-xs">
            Mặt hàng này mới được ghi nhận 1 lần ({formatVND(currentItem.currentUnitPrice)} tại {currentItem.lastStore}).
            Khi bạn quét thêm các hóa đơn mới có món này, biểu đồ so sánh xu hướng giá sẽ được vẽ tự động!
          </div>
        ) : (
          <PriceHistoryChart
            className="price-chart__canvas h-64 pt-2"
            points={timeline}
            unit={currentItem.unit}
            itemName={currentItem.canonicalName}
          />
        )}
      </div>

      {/* Historical Purchase Log Table */}
      <div className="purchase-log bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
        <h4 className="purchase-log__title font-semibold text-white text-sm mb-4">
          Nhật ký các lần mua sản phẩm này ({timeline.length} lần)
        </h4>

        <div className="purchase-log__scroll overflow-x-auto rounded-xl border border-slate-800">
          <table className="purchase-log__table w-full text-left text-sm">
            <thead className="purchase-log__head bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="purchase-log__col purchase-log__col--date py-3 px-4">Ngày mua</th>
                <th className="purchase-log__col purchase-log__col--store py-3 px-4">Địa điểm / Siêu thị</th>
                <th className="purchase-log__col purchase-log__col--quantity py-3 px-3 text-center">Số lượng</th>
                <th className="purchase-log__col purchase-log__col--unit-price py-3 px-4 text-right">Đơn giá (VND)</th>
                <th className="purchase-log__col purchase-log__col--total py-3 px-4 text-right">Tổng tiền (VND)</th>
              </tr>
            </thead>
            <tbody className="purchase-log__body divide-y divide-slate-800/80">
              {timeline.map((point, idx) => (
                <tr key={idx} className="purchase-log__row hover:bg-slate-800/30 transition-colors">
                  <td className="purchase-log__cell purchase-log__cell--date py-3 px-4 font-medium text-slate-200">
                    {point.date}
                  </td>
                  <td className="purchase-log__cell purchase-log__cell--store py-3 px-4 text-slate-300">
                    <span className="purchase-log__store flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      {point.store}
                    </span>
                  </td>
                  <td className="purchase-log__cell purchase-log__cell--quantity py-3 px-3 text-center text-slate-200 font-semibold">
                    {point.quantity} {currentItem.unit}
                  </td>
                  <td className="purchase-log__cell purchase-log__cell--unit-price py-3 px-4 text-right font-bold text-white">
                    {formatVND(point.unitPrice)}
                  </td>
                  <td className="purchase-log__cell purchase-log__cell--total py-3 px-4 text-right font-bold text-amber-400">
                    {formatVND(point.unitPrice * point.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
