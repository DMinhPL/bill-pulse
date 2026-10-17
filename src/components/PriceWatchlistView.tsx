import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  Store,
  Calendar,
  ChevronRight,
  Minus,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { PriceTrendSummary, PriceTrendStatus } from '../types/bill';
import { formatVND, formatPercent } from '../utils/currency';

interface PriceWatchlistViewProps {
  priceTrends: PriceTrendSummary[];
  onSelectItemDeepDive: (itemName: string) => void;
  onOpenAIInsights: () => void;
}

export const PriceWatchlistView: React.FC<PriceWatchlistViewProps> = ({
  priceTrends,
  onSelectItemDeepDive,
  onOpenAIInsights,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PriceTrendStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'INCREASE_PCT' | 'INCREASE_DIFF' | 'CURRENT_PRICE' | 'NAME'>('INCREASE_PCT');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    priceTrends.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [priceTrends]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return priceTrends
      .filter(item => {
        // Status filter
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        // Category filter
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.canonicalName.toLowerCase().includes(q) ||
            item.lastStore.toLowerCase().includes(q) ||
            (item.category && item.category.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'INCREASE_PCT') {
          return b.percentChange - a.percentChange;
        }
        if (sortBy === 'INCREASE_DIFF') {
          return b.priceDiff - a.priceDiff;
        }
        if (sortBy === 'CURRENT_PRICE') {
          return b.currentUnitPrice - a.currentUnitPrice;
        }
        if (sortBy === 'NAME') {
          return a.canonicalName.localeCompare(b.canonicalName);
        }
        return 0;
      });
  }, [priceTrends, searchQuery, statusFilter, categoryFilter, sortBy]);

  const countIncreased = priceTrends.filter(t => t.status === 'INCREASED').length;
  const countDecreased = priceTrends.filter(t => t.status === 'DECREASED').length;
  const countUnchanged = priceTrends.filter(t => t.status === 'UNCHANGED').length;

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            <span>Theo dõi biến động giá hàng hóa (VND)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tổng hợp sự thay đổi đơn giá của từng mặt hàng qua các lần mua sắm trong quá khứ.
          </p>
        </div>

        <button
          onClick={onOpenAIInsights}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Nhận định lạm phát giỏ hàng</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, siêu thị (e.g. Sữa TH, Trứng, WinMart)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 rounded-xl text-sm text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-950 text-xs font-medium text-slate-200 py-2 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500/50"
            >
              <option value="INCREASE_PCT">Tăng % cao nhất</option>
              <option value="INCREASE_DIFF">Chênh lệch VND lớn nhất</option>
              <option value="CURRENT_PRICE">Đơn giá cao nhất</option>
              <option value="NAME">Tên sản phẩm A-Z</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-200 text-slate-950 font-bold shadow'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({priceTrends.length})
          </button>

          <button
            onClick={() => setStatusFilter('INCREASED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === 'INCREASED'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950'
                : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Đang tăng giá ({countIncreased})
          </button>

          <button
            onClick={() => setStatusFilter('DECREASED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === 'DECREASED'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Hạ nhiệt / Giảm ({countDecreased})
          </button>

          <button
            onClick={() => setStatusFilter('UNCHANGED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'UNCHANGED'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            Ổn định ({countUnchanged})
          </button>

          {/* Category Filter dropdown */}
          {categories.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-950 text-xs text-slate-300 py-1 px-2.5 rounded-lg border border-slate-800 focus:outline-none"
              >
                <option value="ALL">Mọi danh mục</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Items List Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Không tìm thấy mặt hàng nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item, idx) => {
            const hasHistory = item.history.length > 1;
            const priceRange = item.maxPrice - item.minPrice;
            const currentPositionPct = priceRange > 0
              ? Math.max(0, Math.min(100, ((item.currentUnitPrice - item.minPrice) / priceRange) * 100))
              : 50;

            return (
              <div
                key={idx}
                onClick={() => onSelectItemDeepDive(item.canonicalName)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-100 text-sm truncate group-hover:text-amber-400 transition-colors">
                          {item.canonicalName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px]">
                          {item.category || 'Tiêu dùng'}
                        </span>
                        <span>ĐVT: {item.unit}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-500" />
                          {item.lastStore}
                        </span>
                      </div>
                    </div>

                    {/* Price Change Status Badge */}
                    <div className="shrink-0 text-right">
                      {item.status === 'INCREASED' ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                          <span>+{formatVND(item.priceDiff, { showSign: false })}</span>
                          <span>({formatPercent(item.percentChange)})</span>
                        </div>
                      ) : item.status === 'DECREASED' ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{formatVND(item.priceDiff, { showSign: true })}</span>
                          <span>({formatPercent(item.percentChange)})</span>
                        </div>
                      ) : item.status === 'UNCHANGED' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Ổn định (=)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">
                          Lần đầu mua
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Comparison Line */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Đơn giá gần nhất:</span>
                      <span className="text-lg font-bold text-white">
                        {formatVND(item.currentUnitPrice)}
                      </span>
                    </div>

                    {item.previousUnitPrice !== null && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Lần mua trước đó:</span>
                        <span className="text-sm text-slate-400 font-medium">
                          {formatVND(item.previousUnitPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Min - Max Range Bar */}
                  {hasHistory && (
                    <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <span>Thấp nhất: {formatVND(item.minPrice)}</span>
                        <span>TB: {formatVND(item.avgPrice)}</span>
                        <span>Cao nhất: {formatVND(item.maxPrice)}</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'INCREASED' ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.max(10, currentPositionPct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                  <span>
                    Mua {item.history.length} lần • Tổng chi: {formatVND(item.totalSpent)}
                  </span>
                  <span className="text-amber-400/90 group-hover:text-amber-300 font-medium flex items-center gap-0.5">
                    Xem biểu đồ lịch sử <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
