import React, { useState } from 'react';
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
      <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
        <p className="text-slate-400">Chưa có mặt hàng nào trong cơ sở dữ liệu.</p>
      </div>
    );
  }

  // Sort history chronologically
  const timeline = [...currentItem.history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPoint = timeline[0];
  const lastPoint = timeline[timeline.length - 1];
  const overallDiff = lastPoint.unitPrice - firstPoint.unitPrice;
  const overallPct = firstPoint.unitPrice > 0 ? (overallDiff / firstPoint.unitPrice) * 100 : 0;

  // Chart min/max scaling
  const prices = timeline.map(t => t.unitPrice);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const padding = (maxP - minP) * 0.2 || minP * 0.1 || 1000;
  const chartMin = Math.max(0, minP - padding);
  const chartMax = maxP + padding;

  return (
    <div className="space-y-6">
      {/* Title & Item Selector Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-amber-400" />
            <span>Biểu đồ diễn biến giá theo thời gian</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi xu hướng tăng giảm giá chi tiết của từng mặt hàng qua các tháng.
          </p>
        </div>

        {/* Dropdown to pick product */}
        <div className="w-full sm:w-80">
          <select
            value={currentItem.canonicalName}
            onChange={e => onSelectItem(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-md"
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
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                {currentItem.category || 'Mặt hàng tiêu dùng'}
              </span>
              <span className="text-xs text-slate-400">Đơn vị tính: {currentItem.unit}</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {currentItem.canonicalName}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Cửa hàng mua gần nhất: <strong>{currentItem.lastStore}</strong></span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentItem.lastPurchasedDate}</span>
            </p>
          </div>

          {/* Current Price & Total Trend */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-400 block">Đơn giá hiện tại (VND)</span>
              <span className="text-2xl font-black text-amber-400 tracking-tight">
                {formatVND(currentItem.currentUnitPrice)}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6">
              <span className="text-xs text-slate-400 block">Biến động từ lần đầu</span>
              {overallDiff > 0 ? (
                <div className="flex items-center gap-1 text-rose-400 font-bold text-base">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{formatVND(overallDiff, { showSign: false })}</span>
                  <span className="text-xs font-semibold">({formatPercent(overallPct)})</span>
                </div>
              ) : overallDiff < 0 ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-base">
                  <TrendingDown className="w-4 h-4" />
                  <span>{formatVND(overallDiff, { showSign: true })}</span>
                  <span className="text-xs font-semibold">({formatPercent(overallPct)})</span>
                </div>
              ) : (
                <span className="text-slate-300 font-bold text-base">Không đổi (0%)</span>
              )}
            </div>
          </div>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-500 block">Giá thấp nhất từng mua</span>
            <span className="text-sm font-bold text-emerald-400">{formatVND(currentItem.minPrice)}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-500 block">Giá cao nhất từng mua</span>
            <span className="text-sm font-bold text-rose-400">{formatVND(currentItem.maxPrice)}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-500 block">Đơn giá trung bình</span>
            <span className="text-sm font-bold text-slate-200">{formatVND(currentItem.avgPrice)}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[11px] text-slate-500 block">Tổng tiền đã chi</span>
            <span className="text-sm font-bold text-white">{formatVND(currentItem.totalSpent)}</span>
          </div>
        </div>
      </div>

      {/* Visual SVG Price Trend Chart */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span>Biểu đồ giá theo các mốc thời gian</span>
          </h4>
          <span className="text-xs text-slate-400">
            {timeline.length} lần ghi nhận
          </span>
        </div>

        {timeline.length < 2 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Mặt hàng này mới được ghi nhận 1 lần ({formatVND(currentItem.currentUnitPrice)} tại {currentItem.lastStore}).
            Khi bạn quét thêm các hóa đơn mới có món này, biểu đồ so sánh xu hướng giá sẽ được vẽ tự động!
          </div>
        ) : (
          <div className="w-full overflow-x-auto pt-4 pb-2">
            <div className="min-w-[500px] h-64 relative">
              <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal guidelines */}
                {[0.2, 0.5, 0.8].map((ratio, i) => {
                  const y = 30 + (220 - 60) * ratio;
                  const priceLabel = Math.round(chartMax - (chartMax - chartMin) * ratio);
                  return (
                    <g key={i}>
                      <line
                        x1="40"
                        y1={y}
                        x2="580"
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text x="35" y={y + 3} fill="#64748b" fontSize="10" textAnchor="end">
                        {formatVND(priceLabel, { compact: true })}
                      </text>
                    </g>
                  );
                })}

                {/* SVG Line Coordinates Calculation */}
                {(() => {
                  const pts = timeline.map((t, idx) => {
                    const x = 50 + (idx / (timeline.length - 1)) * (580 - 70);
                    const y = 190 - ((t.unitPrice - chartMin) / (chartMax - chartMin || 1)) * 140;
                    return { x, y, point: t };
                  });

                  const pathD = pts.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );
                  const areaD = `${pathD} L ${pts[pts.length - 1].x} 200 L ${pts[0].x} 200 Z`;

                  return (
                    <>
                      {/* Gradient fill under curve */}
                      <path d={areaD} fill="url(#priceGradient)" />
                      {/* Main trend line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Interactive dots with labels */}
                      {pts.map((p, idx) => (
                        <g key={idx} className="cursor-pointer group">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            fill="#0f172a"
                            stroke="#f43f5e"
                            strokeWidth="3"
                          />
                          {/* Label above dot */}
                          <rect
                            x={p.x - 38}
                            y={p.y - 28}
                            width="76"
                            height="20"
                            rx="5"
                            fill="#1e293b"
                            stroke="#475569"
                            strokeWidth="1"
                          />
                          <text
                            x={p.x}
                            y={p.y - 14}
                            fill="#f8fafc"
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {formatVND(p.point.unitPrice)}
                          </text>

                          {/* Date and Store below */}
                          <text
                            x={p.x}
                            y="215"
                            fill="#94a3b8"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {p.point.date}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Historical Purchase Log Table */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
        <h4 className="font-semibold text-white text-sm mb-4">
          Nhật ký các lần mua sản phẩm này ({timeline.length} lần)
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ngày mua</th>
                <th className="py-3 px-4">Địa điểm / Siêu thị</th>
                <th className="py-3 px-3 text-center">Số lượng</th>
                <th className="py-3 px-4 text-right">Đơn giá (VND)</th>
                <th className="py-3 px-4 text-right">Tổng tiền (VND)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {timeline.map((point, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {point.date}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      {point.store}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-200 font-semibold">
                    {point.quantity} {currentItem.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    {formatVND(point.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-400">
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
