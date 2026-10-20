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
import { CategoryChangeChart, computeCategoryChanges } from './charts/CategoryChangeChart';
import { chartTheme } from './charts/chartSetup';

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
  const [storeFilter, setStoreFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'INCREASE_PCT' | 'INCREASE_DIFF' | 'CURRENT_PRICE' | 'NAME'>('INCREASE_PCT');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    priceTrends.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [priceTrends]);

  // Store reflects where each product was purchased most recently.
  const stores = useMemo(() => {
    const set = new Set<string>();
    priceTrends.forEach(t => {
      if (t.lastStore) set.add(t.lastStore);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [priceTrends]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return priceTrends
      .filter(item => {
        // Status filter
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        // Category filter
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
        // Latest purchase store filter
        if (storeFilter !== 'ALL' && item.lastStore !== storeFilter) return false;
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
  }, [priceTrends, searchQuery, statusFilter, categoryFilter, storeFilter, sortBy]);

  const countIncreased = priceTrends.filter(t => t.status === 'INCREASED').length;
  const countDecreased = priceTrends.filter(t => t.status === 'DECREASED').length;
  const countUnchanged = priceTrends.filter(t => t.status === 'UNCHANGED').length;

  // Average price change per category (products bought only once are skipped)
  const categoryChanges = useMemo(() => computeCategoryChanges(priceTrends), [priceTrends]);

  // Neutral pills share one look; coloured ones keep their status colour
  const neutralInactive = 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white';
  const statusFilters: {
    value: 'ALL' | PriceTrendStatus;
    modifier: string;
    label: string;
    count: number;
    Icon: React.ComponentType<{ className?: string }> | null;
    activeClass: string;
    inactiveClass: string;
  }[] = [
    {
      value: 'ALL',
      modifier: 'all',
      label: 'Tất cả',
      count: priceTrends.length,
      Icon: null,
      activeClass: 'bg-slate-200 text-slate-950 border-slate-200 shadow',
      inactiveClass: neutralInactive,
    },
    {
      value: 'INCREASED',
      modifier: 'increased',
      label: 'Đang tăng giá',
      count: countIncreased,
      Icon: TrendingUp,
      activeClass: 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-950',
      inactiveClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20',
    },
    {
      value: 'DECREASED',
      modifier: 'decreased',
      label: 'Hạ nhiệt / Giảm',
      count: countDecreased,
      Icon: TrendingDown,
      activeClass: 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-950',
      inactiveClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20',
    },
    {
      value: 'UNCHANGED',
      modifier: 'unchanged',
      label: 'Ổn định',
      count: countUnchanged,
      Icon: Minus,
      activeClass: 'bg-slate-600 text-white border-slate-500 shadow',
      inactiveClass: neutralInactive,
    },
  ];

  return (
    <div className="price-watchlist space-y-6">
      {/* Title & Stats */}
      <div className="price-watchlist__header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="price-watchlist__heading">
          <h2 className="price-watchlist__title text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            <span>Theo dõi biến động giá hàng hóa (VND)</span>
          </h2>
          <p className="price-watchlist__subtitle text-sm text-slate-400 mt-1">
            Tổng hợp sự thay đổi đơn giá của từng mặt hàng qua các lần mua sắm trong quá khứ.
          </p>
        </div>

        <button
          onClick={onOpenAIInsights}
          className="price-watchlist__ai-button self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Nhận định lạm phát giỏ hàng</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="price-watchlist__toolbar bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-4 shadow-md">
        <div className="price-watchlist__toolbar-row flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="price-watchlist__search relative flex-1">
            <Search className="price-watchlist__search-icon w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, siêu thị (e.g. Sữa TH, Trứng, WinMart)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="price-watchlist__search-input w-full pl-10 pr-4 py-2 bg-slate-950 rounded-xl text-sm text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          {/* Sort Selector */}
          <div className="price-watchlist__sort flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="price-watchlist__sort-select bg-slate-950 text-xs font-medium text-slate-200 py-2 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500/50"
            >
              <option value="INCREASE_PCT">Tăng % cao nhất</option>
              <option value="INCREASE_DIFF">Chênh lệch VND lớn nhất</option>
              <option value="CURRENT_PRICE">Đơn giá cao nhất</option>
              <option value="NAME">Tên sản phẩm A-Z</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="price-watchlist__status-filters flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-800/80">
          {statusFilters.map(({ value, modifier, label, count, Icon, activeClass, inactiveClass }) => {
            const isActive = statusFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                aria-pressed={isActive}
                className={`price-watchlist__status-filter price-watchlist__status-filter--${modifier} ${
                  isActive ? 'is-active' : ''
                } inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                {Icon && <Icon className="price-watchlist__status-filter-icon w-3.5 h-3.5 shrink-0" />}
                <span className="price-watchlist__status-filter-label">{label}</span>
                <span className="price-watchlist__status-filter-count tabular-nums opacity-80">({count})</span>
              </button>
            );
          })}

          <div className="price-watchlist__dropdown-filters ml-auto flex flex-wrap items-center gap-2">
            {/* Store Filter dropdown */}
            {stores.length > 0 && (
              <div className="price-watchlist__store-filter flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-slate-500" />
                <select
                  aria-label="Lọc theo cửa hàng mua gần nhất"
                  value={storeFilter}
                  onChange={e => setStoreFilter(e.target.value)}
                  className="price-watchlist__store-select h-9 max-w-56 bg-slate-950 text-xs text-slate-300 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500/50"
                >
                  <option value="ALL">Mọi cửa hàng</option>
                  {stores.map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter dropdown */}
            {categories.length > 0 && (
              <div className="price-watchlist__category-filter flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  aria-label="Lọc theo danh mục"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="price-watchlist__category-select h-9 bg-slate-950 text-xs text-slate-300 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500/50"
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
      </div>

      {/* Average price change by category */}
      <section className="price-watchlist__category-chart bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="price-watchlist__category-chart-header flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="price-watchlist__category-chart-title font-semibold text-white text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Biến động giá trung bình theo danh mục
            </h3>
            <p className="price-watchlist__category-chart-subtitle text-xs text-slate-400 mt-1">
              So sánh đơn giá lần mua gần nhất với lần trước của từng sản phẩm. Nhấn vào một danh mục để lọc danh sách bên dưới.
            </p>
          </div>
          <div className="price-watchlist__category-chart-legend flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: chartTheme.change.increase }} />
              Tăng giá
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: chartTheme.change.decrease }} />
              Giảm giá
            </span>
          </div>
        </div>

        {categoryChanges.length === 0 ? (
          <p className="price-watchlist__category-chart-empty text-center py-8 text-xs text-slate-500">
            Chưa có sản phẩm nào được mua từ 2 lần trở lên để so sánh giá theo danh mục.
          </p>
        ) : (
          <CategoryChangeChart
            className="price-watchlist__category-chart-canvas"
            changes={categoryChanges}
            selectedCategory={categoryFilter}
            onSelectCategory={setCategoryFilter}
          />
        )}
      </section>

      {/* Items List Grid */}
      {filteredItems.length === 0 ? (
        <div className="price-watchlist__empty text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Không tìm thấy mặt hàng nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="price-watchlist__grid grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`price-card price-card--${item.status.toLowerCase()} p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between shadow-md`}
              >
                <div className="price-card__body">
                  <div className="price-card__header flex items-start justify-between gap-3">
                    <div className="price-card__info flex-1 min-w-0">
                      <div className="price-card__name-row flex items-center gap-2">
                        <h4 className="price-card__name font-semibold text-slate-100 text-sm truncate group-hover:text-amber-400 transition-colors">
                          {item.canonicalName}
                        </h4>
                      </div>
                      {/* Chips stay whole; the store gets its own full-width line and truncates */}
                      <div className="price-card__meta flex flex-wrap items-center gap-1.5 mt-2 text-xs text-slate-400">
                        <span className="price-card__category whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-medium text-slate-300">
                          {item.category || 'Tiêu dùng'}
                        </span>
                        <span className="price-card__unit whitespace-nowrap px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
                          ĐVT: <span className="text-slate-300">{item.unit}</span>
                        </span>
                        <span
                          className="price-card__store basis-full min-w-0 flex items-center gap-1.5 mt-0.5"
                          title={item.lastStore}
                        >
                          <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="price-card__store-name truncate">{item.lastStore}</span>
                        </span>
                      </div>
                    </div>

                    {/* Price Change Status Badge */}
                    <div className="price-card__status shrink-0 text-right">
                      {item.status === 'INCREASED' ? (
                        <div className="price-card__badge price-card__badge--increased inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                          <span>+{formatVND(item.priceDiff, { showSign: false })}</span>
                          <span>({formatPercent(item.percentChange)})</span>
                        </div>
                      ) : item.status === 'DECREASED' ? (
                        <div className="price-card__badge price-card__badge--decreased inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{formatVND(item.priceDiff, { showSign: true })}</span>
                          <span>({formatPercent(item.percentChange)})</span>
                        </div>
                      ) : item.status === 'UNCHANGED' ? (
                        <span className="price-card__badge price-card__badge--unchanged inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Ổn định (=)
                        </span>
                      ) : (
                        <span className="price-card__badge price-card__badge--new inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">
                          Lần đầu mua
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Comparison Line */}
                  <div className="price-card__prices mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                    <div className="price-card__price price-card__price--current">
                      <span className="price-card__price-label text-[11px] text-slate-400 block">Đơn giá gần nhất:</span>
                      <span className="price-card__price-value text-lg font-bold text-white">
                        {formatVND(item.currentUnitPrice)}
                      </span>
                    </div>

                    {item.previousUnitPrice !== null && (
                      <div className="price-card__price price-card__price--previous text-right">
                        <span className="price-card__price-label text-[11px] text-slate-400 block">Lần mua trước đó:</span>
                        <span className="price-card__price-value text-sm text-slate-400 font-medium">
                          {formatVND(item.previousUnitPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Min - Max Range Bar */}
                  {hasHistory && (
                    <div className="price-card__range mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="price-card__range-labels flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <span className="price-card__range-min">Thấp nhất: {formatVND(item.minPrice)}</span>
                        <span className="price-card__range-avg">TB: {formatVND(item.avgPrice)}</span>
                        <span className="price-card__range-max">Cao nhất: {formatVND(item.maxPrice)}</span>
                      </div>
                      <div className="price-card__range-track relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`price-card__range-fill h-full rounded-full ${
                            item.status === 'INCREASED' ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.max(10, currentPositionPct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="price-card__footer mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                  <span className="price-card__summary">
                    Mua {item.history.length} lần • Tổng chi: {formatVND(item.totalSpent)}
                  </span>
                  <span className="price-card__cta text-amber-400/90 group-hover:text-amber-300 font-medium flex items-center gap-0.5">
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
