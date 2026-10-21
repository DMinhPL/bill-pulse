import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { PriceTrendSummary } from '../../../shared/types/bill';
import { formatPercent } from '../../../shared/currency';
import { chartTheme, withAlpha } from './chartSetup';

export interface CategoryChange {
  category: string;
  avgPercentChange: number;
  /** Products with at least two purchases, so a change can be measured */
  compared: number;
  increased: number;
  decreased: number;
  unchanged: number;
  topMover: PriceTrendSummary;
}

const FALLBACK_CATEGORY = 'Tiêu dùng';

/** Average latest-vs-previous unit price change per category, largest increase first. */
export function computeCategoryChanges(trends: PriceTrendSummary[]): CategoryChange[] {
  const groups = new Map<string, PriceTrendSummary[]>();
  for (const trend of trends) {
    // First-time purchases have nothing to compare against
    if (trend.previousUnitPrice === null) continue;
    const key = trend.category || FALLBACK_CATEGORY;
    groups.set(key, [...(groups.get(key) || []), trend]);
  }

  return Array.from(groups, ([category, items]) => ({
    category,
    avgPercentChange: items.reduce((sum, t) => sum + t.percentChange, 0) / items.length,
    compared: items.length,
    increased: items.filter(t => t.status === 'INCREASED').length,
    decreased: items.filter(t => t.status === 'DECREASED').length,
    unchanged: items.filter(t => t.status === 'UNCHANGED').length,
    topMover: items.reduce((a, b) => (Math.abs(b.percentChange) > Math.abs(a.percentChange) ? b : a)),
  })).sort((a, b) => b.avgPercentChange - a.avgPercentChange);
}

interface CategoryChangeChartProps {
  changes: CategoryChange[];
  /** Highlighted category; the others are dimmed. 'ALL' highlights everything. */
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

const BAR_ROW_HEIGHT = 36;

// Signed value at the end of each bar, in text ink (never the bar colour)
const valueLabelPlugin: Plugin<'bar'> = {
  id: 'categoryValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = `600 11px ${chart.options.font?.family ?? 'sans-serif'}`;
    ctx.fillStyle = chartTheme.textSecondary;
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, i) => {
      const value = chart.data.datasets[0].data[i] as number;
      const { x, y } = bar.getProps(['x', 'y'], true) as { x: number; y: number };
      const negative = value < 0;
      ctx.textAlign = negative ? 'right' : 'left';
      ctx.fillText(formatPercent(value), x + (negative ? -6 : 6), y);
    });
    ctx.restore();
  },
};

/** Horizontal diverging bars: rose to the right of 0% for increases, teal to the left for decreases. */
export const CategoryChangeChart: React.FC<CategoryChangeChartProps> = ({
  changes,
  selectedCategory,
  onSelectCategory,
  className,
}) => {
  const { data, options } = useMemo(() => {
    const values = changes.map(c => Number(c.avgPercentChange.toFixed(1)));
    const isDimmed = (category: string) => selectedCategory !== 'ALL' && selectedCategory !== category;
    const colorFor = (c: CategoryChange) => {
      const base = c.avgPercentChange < 0 ? chartTheme.change.decrease : chartTheme.change.increase;
      return isDimmed(c.category) ? withAlpha(base, 0.3) : base;
    };

    // Symmetric room on both sides so the 0% line stays put and labels fit
    const extent = Math.max(1, ...values.map(Math.abs));
    const limit = Math.ceil(extent * 1.35);

    const data: ChartData<'bar', number[], string> = {
      labels: changes.map(c => c.category),
      datasets: [
        {
          label: 'Thay đổi giá trung bình',
          data: values,
          backgroundColor: changes.map(colorFor),
          hoverBackgroundColor: changes.map(c =>
            withAlpha(c.avgPercentChange < 0 ? chartTheme.change.decrease : chartTheme.change.increase, 0.85)
          ),
          borderRadius: 4,
          borderSkipped: 'start', // round only the data end, square at the 0% baseline
          barPercentage: 0.9,
          categoryPercentage: 0.8,
          maxBarThickness: 22,
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      layout: { padding: { right: 8, left: 4 } },
      onClick: (_event, elements) => {
        if (!elements.length) return;
        const category = changes[elements[0].index].category;
        onSelectCategory(selectedCategory === category ? 'ALL' : category);
      },
      onHover: (event, elements) => {
        const target = event.native?.target as HTMLElement | undefined;
        if (target) target.style.cursor = elements.length ? 'pointer' : 'default';
      },
      plugins: {
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 1,
          titleColor: chartTheme.textPrimary,
          bodyColor: chartTheme.textSecondary,
          footerColor: chartTheme.axisText,
          footerFont: { weight: 'normal' },
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: item => {
              const c = changes[item.dataIndex];
              return [
                `Thay đổi trung bình: ${formatPercent(c.avgPercentChange)}`,
                `${c.compared} sản phẩm: ${c.increased} tăng · ${c.decreased} giảm · ${c.unchanged} ổn định`,
                `Biến động mạnh nhất: ${c.topMover.canonicalName} (${formatPercent(c.topMover.percentChange)})`,
              ];
            },
            footer: items =>
              selectedCategory === changes[items[0].dataIndex].category
                ? 'Nhấn để bỏ lọc'
                : 'Nhấn để lọc sản phẩm theo danh mục này',
          },
        },
      },
      scales: {
        x: {
          min: -limit,
          max: limit,
          ticks: {
            color: chartTheme.axisText,
            maxTicksLimit: 7,
            callback: value => `${value}%`,
          },
          grid: {
            // Recessive grid; the 0% line is the stronger neutral midpoint
            color: ctx => (ctx.tick.value === 0 ? chartTheme.zeroLine : chartTheme.grid),
            lineWidth: 1,
          },
          border: { display: false },
        },
        y: {
          ticks: { color: chartTheme.textSecondary, padding: 8 },
          grid: { display: false },
          border: { display: false },
        },
      },
    };

    return { data, options };
  }, [changes, selectedCategory, onSelectCategory]);

  const summary = changes.length
    ? `Thay đổi giá trung bình theo danh mục: ${changes
        .map(c => `${c.category} ${formatPercent(c.avgPercentChange)}`)
        .join(', ')}.`
    : 'Chưa có danh mục nào đủ dữ liệu để so sánh.';

  return (
    <div className={className} style={{ height: changes.length * BAR_ROW_HEIGHT + 40 }}>
      <Bar data={data} options={options} plugins={[valueLabelPlugin]} role="img" aria-label={summary} />
    </div>
  );
};
