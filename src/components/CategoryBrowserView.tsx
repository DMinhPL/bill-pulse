import React, { useMemo, useState } from 'react';
import {
  Tags,
  Search,
  ArrowUpDown,
  Store,
  Package,
  Wallet,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { PriceTrendSummary } from '../types/bill';
import { formatVND, formatPercent } from '../utils/currency';
import { formatDateShort } from '../utils/date';

const ALL = 'ALL';
const UNCATEGORIZED = 'Chưa phân loại';

type SortKey = 'SPENT' | 'TIMES' | 'RECENT' | 'NAME';

interface CategorySummary {
  name: string;
  products: PriceTrendSummary[];
  totalSpent: number;
  purchaseCount: number;
}

const categoryOf = (t: PriceTrendSummary) => t.category?.trim() || UNCATEGORIZED;

/** Products grouped by their known category, biggest spending first. */
function groupByCategory(trends: PriceTrendSummary[]): CategorySummary[] {
  const map = new Map<string, PriceTrendSummary[]>();
  for (const t of trends) map.set(categoryOf(t), [...(map.get(categoryOf(t)) ?? []), t]);
  return Array.from(map, ([name, products]) => ({
    name,
    products,
    totalSpent: products.reduce((s, p) => s + p.totalSpent, 0),
    purchaseCount: products.reduce((s, p) => s + p.history.length, 0),
  })).sort((a, b) => b.totalSpent - a.totalSpent);
}

const SORTERS: Record<SortKey, (a: PriceTrendSummary, b: PriceTrendSummary) => number> = {
  SPENT: (a, b) => b.totalSpent - a.totalSpent,
  TIMES: (a, b) => b.history.length - a.history.length || b.totalSpent - a.totalSpent,
  RECENT: (a, b) => b.lastPurchasedDate.localeCompare(a.lastPurchasedDate),
  NAME: (a, b) => a.canonicalName.localeCompare(b.canonicalName, 'vi'),
};

const TrendBadge: React.FC<{ item: PriceTrendSummary }> = ({ item }) => {
  if (item.status === 'INCREASED') {
    return (
      <span className="category-browser__trend category-browser__trend--increased inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300">
        <TrendingUp className="w-3 h-3" />
        {formatPercent(item.percentChange)}
      </span>
    );
  }
  if (item.status === 'DECREASED') {
    return (
      <span className="category-browser__trend category-browser__trend--decreased inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
        <TrendingDown className="w-3 h-3" />
        {formatPercent(item.percentChange)}
      </span>
    );
  }
  if (item.status === 'UNCHANGED') {
    return <span className="category-browser__trend category-browser__trend--unchanged text-[11px] text-slate-400">Ổn định</span>;
  }
  return <span className="category-browser__trend category-browser__trend--new text-[11px] text-blue-300">Lần đầu mua</span>;
};

interface CategoryBrowserViewProps {
  priceTrends: PriceTrendSummary[];
  onSelectItemDeepDive: (itemName: string) => void;
}

export const CategoryBrowserView: React.FC<CategoryBrowserViewProps> = ({ priceTrends, onSelectItemDeepDive }) => {
  const [selected, setSelected] = useState<string>(ALL);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('SPENT');

  const categories = useMemo(() => groupByCategory(priceTrends), [priceTrends]);
  const active = categories.find(c => c.name === selected);
  // A category can disappear (e.g. its bills were deleted); fall back to "all"
  const scope = active ? active.products : priceTrends;

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scope
      .filter(p => !q || p.canonicalName.toLowerCase().includes(q) || p.lastStore.toLowerCase().includes(q))
      .sort(SORTERS[sortBy]);
  }, [scope, query, sortBy]);

  const scopeSpent = scope.reduce((s, p) => s + p.totalSpent, 0);
  const scopePurchases = scope.reduce((s, p) => s + p.history.length, 0);
  const scopeIncreased = scope.filter(p => p.status === 'INCREASED').length;
  const allSpent = priceTrends.reduce((s, p) => s + p.totalSpent, 0) || 1;

  const categoryButton = (key: string, label: string, count: number, spent: number) => {
    const isActive = (active ? active.name : ALL) === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setSelected(key)}
        aria-pressed={isActive}
        className={`category-browser__category ${isActive ? 'is-active' : ''} shrink-0 lg:w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
          isActive
            ? 'bg-amber-500/10 border-amber-500/40 text-white'
            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
        }`}
      >
        <span className="category-browser__category-name block text-sm font-semibold whitespace-nowrap lg:whitespace-normal lg:truncate" title={label}>
          {label}
        </span>
        <span className="category-browser__category-meta flex items-center justify-between gap-3 mt-0.5 text-[11px] text-slate-400 whitespace-nowrap">
          <span>{count} sản phẩm</span>
          <span className="tabular-nums">{formatVND(spent, { compact: true })}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="category-browser space-y-6">
      {/* Header */}
      <div className="category-browser__header">
        <h2 className="category-browser__title text-xl font-bold text-white flex items-center gap-2">
          <Tags className="w-5 h-5 text-amber-400" />
          <span>Sản phẩm đã mua theo danh mục</span>
        </h2>
        <p className="category-browser__subtitle text-sm text-slate-400 mt-1">
          Chọn một danh mục để xem toàn bộ sản phẩm bạn đã mua trong nhóm đó, số lần mua, tổng chi và biến động giá.
        </p>
      </div>

      {priceTrends.length === 0 ? (
        <div className="category-browser__empty text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p className="text-sm text-slate-400">Chưa có sản phẩm nào. Quét hóa đơn để bắt đầu theo dõi.</p>
        </div>
      ) : (
        <div className="category-browser__layout grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
          {/* Category list: horizontal scroll on small screens, sidebar on large */}
          <nav className="category-browser__categories lg:sticky lg:top-24" aria-label="Danh mục sản phẩm">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
              {categoryButton(ALL, 'Tất cả danh mục', priceTrends.length, allSpent)}
              {categories.map(c => categoryButton(c.name, c.name, c.products.length, c.totalSpent))}
            </div>
          </nav>

          <section className="category-browser__content min-w-0 space-y-4" aria-live="polite">
            {/* Summary of the selected scope */}
            <div className="category-browser__summary grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'products', icon: Package, label: 'Sản phẩm', value: `${scope.length}` },
                { key: 'purchases', icon: ShoppingBag, label: 'Lượt mua', value: `${scopePurchases}` },
                { key: 'spent', icon: Wallet, label: 'Tổng chi', value: formatVND(scopeSpent) },
                {
                  key: 'share',
                  icon: Tags,
                  label: active ? 'Tỉ trọng chi tiêu' : 'Đang tăng giá',
                  value: active ? `${((scopeSpent / allSpent) * 100).toFixed(1)}%` : `${scopeIncreased} sản phẩm`,
                },
              ].map(({ key, icon: Icon, label, value }) => (
                <div key={key} className={`category-browser__stat category-browser__stat--${key} bg-slate-900 p-3.5 rounded-xl border border-slate-800`}>
                  <span className="category-browser__stat-label flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    {label}
                  </span>
                  <span className="category-browser__stat-value block mt-1 text-base font-bold text-white tabular-nums truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Search & sort */}
            <div className="category-browser__toolbar flex flex-col sm:flex-row gap-3 bg-slate-900/90 rounded-2xl p-3 border border-slate-800">
              <div className="category-browser__search relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={active ? `Tìm trong "${active.name}"...` : 'Tìm theo tên sản phẩm hoặc cửa hàng...'}
                  className="category-browser__search-input w-full h-9 pl-9 pr-3 bg-slate-950 rounded-xl text-sm text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="category-browser__sort flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortKey)}
                  aria-label="Sắp xếp sản phẩm"
                  className="category-browser__sort-select h-9 bg-slate-950 text-xs font-medium text-slate-200 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="SPENT">Chi tiêu nhiều nhất</option>
                  <option value="TIMES">Mua nhiều lần nhất</option>
                  <option value="RECENT">Mua gần đây nhất</option>
                  <option value="NAME">Tên A–Z</option>
                </select>
              </div>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="category-browser__no-results text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
                <p className="text-sm text-slate-400">Không có sản phẩm nào phù hợp với từ khóa.</p>
              </div>
            ) : (
              <div className="category-browser__table-scroll overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="category-browser__table w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="category-browser__col category-browser__col--name py-3 px-4">Sản phẩm</th>
                      {!active && <th className="category-browser__col category-browser__col--category py-3 px-3">Danh mục</th>}
                      <th className="category-browser__col category-browser__col--times py-3 px-3 text-center">Lượt mua</th>
                      <th className="category-browser__col category-browser__col--price py-3 px-3 text-right">Đơn giá gần nhất</th>
                      <th className="category-browser__col category-browser__col--spent py-3 px-3 text-right">Tổng chi</th>
                      <th className="category-browser__col category-browser__col--last py-3 px-4">Mua gần nhất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {products.map(p => (
                      <tr key={p.canonicalName} className={`category-browser__row category-browser__row--${p.status.toLowerCase()} hover:bg-slate-800/30 transition-colors`}>
                        <td className="category-browser__cell category-browser__cell--name py-3 px-4 min-w-[220px]">
                          <button
                            type="button"
                            onClick={() => onSelectItemDeepDive(p.canonicalName)}
                            className="category-browser__product group text-left"
                            title="Xem biểu đồ lịch sử giá"
                          >
                            <span className="category-browser__product-name font-medium text-slate-100 group-hover:text-amber-400 transition-colors flex items-center gap-1">
                              {p.canonicalName}
                              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </span>
                            <span className="category-browser__product-unit block text-[11px] text-slate-500">ĐVT: {p.unit}</span>
                          </button>
                        </td>
                        {!active && (
                          <td className="category-browser__cell category-browser__cell--category py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 whitespace-nowrap">
                              {categoryOf(p)}
                            </span>
                          </td>
                        )}
                        <td className="category-browser__cell category-browser__cell--times py-3 px-3 text-center tabular-nums text-slate-200">
                          {p.history.length}
                        </td>
                        <td className="category-browser__cell category-browser__cell--price py-3 px-3 text-right whitespace-nowrap">
                          <span className="block font-semibold text-white tabular-nums">{formatVND(p.currentUnitPrice)}</span>
                          <TrendBadge item={p} />
                        </td>
                        <td className="category-browser__cell category-browser__cell--spent py-3 px-3 text-right font-bold text-amber-400 tabular-nums whitespace-nowrap">
                          {formatVND(p.totalSpent)}
                        </td>
                        <td className="category-browser__cell category-browser__cell--last py-3 px-4 whitespace-nowrap">
                          <span className="block text-slate-200 tabular-nums">{formatDateShort(p.lastPurchasedDate)}</span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 max-w-[180px]" title={p.lastStore}>
                            <Store className="w-3 h-3 shrink-0" />
                            <span className="truncate">{p.lastStore}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
