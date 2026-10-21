import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { Bill } from '../../../shared/types/bill';
import { formatVND } from '../../../shared/currency';
import { chartTheme, inkFor } from './chartSetup';

const OTHER_LABEL = 'Khác';
const UNCATEGORIZED = 'Chưa phân loại';
/** Segments smaller than this get no inside label (the tooltip still has the value) */
const MIN_LABEL_SHARE = 10;

export interface SpendingGroup {
  name: string;
  color: string;
  /** Share of all spending across the shown months, in % */
  overallShare: number;
}

/** Inclusive month range, 'YYYY-MM'. Missing ends are open. */
export interface MonthRange {
  from?: string;
  to?: string;
}

/** 'YYYY-MM' → 'MM/YYYY' */
export const formatMonthKey = (key: string) => {
  const [y, m] = key.split('-');
  return `${m}/${y}`;
};

export interface SpendingShare {
  /** Every month with spending, oldest first (for range pickers) */
  availableMonths: string[];
  months: { key: string; label: string; total: number }[];
  groups: SpendingGroup[];
  /** shares[groupIndex][monthIndex] in %, amounts[groupIndex][monthIndex] in VND */
  shares: number[][];
  amounts: number[][];
}

/**
 * Monthly share of spending per product group, from the line items of each bill.
 * Groups are ranked and coloured over the full history, so changing the range never
 * repaints a group; the range only decides which months are shown.
 */
export function computeSpendingShare(bills: Bill[], range: MonthRange = {}): SpendingShare {
  const byMonth = new Map<string, Map<string, number>>();
  const allTimeTotals = new Map<string, number>();
  const totals = new Map<string, number>();

  for (const bill of bills) {
    const month = bill.date.slice(0, 7); // 'YYYY-MM'
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const monthGroups = byMonth.get(month) ?? new Map<string, number>();
    for (const item of bill.items) {
      const amount = Math.max(0, item.totalPrice || 0);
      if (!amount) continue;
      const group = item.category?.trim() || UNCATEGORIZED;
      monthGroups.set(group, (monthGroups.get(group) ?? 0) + amount);
    }
    byMonth.set(month, monthGroups);
  }

  // Months with spending, oldest first
  const availableMonths = Array.from(byMonth.keys())
    .filter(key => Array.from(byMonth.get(key)!.values()).some(v => v > 0))
    .sort();
  const monthKeys = availableMonths.filter(
    key => (!range.from || key >= range.from) && (!range.to || key <= range.to)
  );

  for (const key of availableMonths) {
    for (const [group, amount] of byMonth.get(key)!) {
      allTimeTotals.set(group, (allTimeTotals.get(group) ?? 0) + amount);
      if (monthKeys.includes(key)) totals.set(group, (totals.get(group) ?? 0) + amount);
    }
  }

  // Colour follows the group: biggest all-time spenders get the fixed slots, the rest become "Khác"
  const ranked = Array.from(allTimeTotals.entries()).sort((a, b) => b[1] - a[1]);
  const slots = chartTheme.categorical.length;
  const needsOther = ranked.length > slots;
  const named = ranked.slice(0, slots);
  const namedSet = new Set(named.map(([group]) => group));
  const grandTotal = Array.from(totals.values()).reduce((sum, amount) => sum + amount, 0) || 1;

  // Only groups with spending in the selected range are shown; each keeps its colour
  const groups: SpendingGroup[] = named
    .map(([name], i) => ({
      name,
      color: chartTheme.categorical[i],
      overallShare: ((totals.get(name) ?? 0) / grandTotal) * 100,
    }))
    .filter(group => group.overallShare > 0);
  if (needsOther) {
    const otherTotal = Array.from(totals.entries())
      .filter(([g]) => !namedSet.has(g))
      .reduce((sum, [, a]) => sum + a, 0);
    if (otherTotal > 0) {
      groups.push({ name: OTHER_LABEL, color: chartTheme.other, overallShare: (otherTotal / grandTotal) * 100 });
    }
  }

  const months = monthKeys.map(key => {
    const total = Array.from(byMonth.get(key)!.values()).reduce((s, v) => s + v, 0);
    return { key, label: formatMonthKey(key), total };
  });

  const amounts = groups.map(group =>
    monthKeys.map(key => {
      const monthGroups = byMonth.get(key)!;
      if (group.name !== OTHER_LABEL || !needsOther) return monthGroups.get(group.name) ?? 0;
      return Array.from(monthGroups.entries())
        .filter(([g]) => !namedSet.has(g))
        .reduce((sum, [, a]) => sum + a, 0);
    })
  );
  const shares = amounts.map(row => row.map((amount, m) => (months[m].total ? (amount / months[m].total) * 100 : 0)));

  return { availableMonths, months, groups, shares, amounts };
}

// Percentage written inside segments that are big enough to hold it
const segmentLabelPlugin: Plugin<'bar'> = {
  id: 'spendingSegmentLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = `600 10px ${chart.options.font?.family ?? 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chart.data.datasets.forEach((dataset, d) => {
      const meta = chart.getDatasetMeta(d);
      if (meta.hidden) return;
      meta.data.forEach((bar, i) => {
        const value = dataset.data[i] as number;
        const { x, y, base } = bar.getProps(['x', 'y', 'base'], true) as { x: number; y: number; base: number };
        if (value < MIN_LABEL_SHARE || Math.abs(base - y) < 14) return;
        ctx.fillStyle = inkFor(dataset.backgroundColor as string);
        ctx.fillText(`${Math.round(value)}%`, x, (y + base) / 2);
      });
    });
    ctx.restore();
  },
};

interface SpendingShareChartProps {
  share: SpendingShare;
  className?: string;
}

/** 100% stacked bars: each month adds up to 100%, split by product group. */
export const SpendingShareChart: React.FC<SpendingShareChartProps> = ({ share, className }) => {
  const { data, options } = useMemo(() => {
    const data: ChartData<'bar', number[], string> = {
      labels: share.months.map(m => m.label),
      datasets: share.groups.map((group, g) => ({
        label: group.name,
        data: share.shares[g].map(v => Number(v.toFixed(2))),
        backgroundColor: group.color,
        hoverBackgroundColor: group.color,
        // 2px surface-coloured gap between stacked segments
        borderColor: chartTheme.surface,
        borderWidth: { top: 2, bottom: 0, left: 0, right: 0 },
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        maxBarThickness: 56,
      })),
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      interaction: { mode: 'index', intersect: false },
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
          boxPadding: 4,
          usePointStyle: true,
          itemSort: (a, b) => b.datasetIndex - a.datasetIndex, // same top-to-bottom order as the stack
          filter: item => (item.raw as number) > 0,
          callbacks: {
            title: items => `Tháng ${items[0].label}`,
            label: item => {
              const amount = share.amounts[item.datasetIndex][item.dataIndex];
              return ` ${item.dataset.label}: ${(item.raw as number).toFixed(1)}% · ${formatVND(amount)}`;
            },
            labelColor: item => ({
              borderColor: share.groups[item.datasetIndex].color,
              backgroundColor: share.groups[item.datasetIndex].color,
            }),
            footer: items => `Tổng chi: ${formatVND(share.months[items[0].dataIndex].total)}`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: chartTheme.axisText },
          grid: { display: false },
          border: { color: chartTheme.grid },
        },
        y: {
          stacked: true,
          min: 0,
          max: 100,
          ticks: { color: chartTheme.axisText, stepSize: 25, callback: value => `${value}%` },
          grid: { color: chartTheme.grid, lineWidth: 1 },
          border: { display: false },
        },
      },
    };

    return { data, options };
  }, [share]);

  const summary = `Tỉ lệ chi tiêu theo nhóm sản phẩm qua ${share.months.length} tháng: ${share.groups
    .map(g => `${g.name} ${g.overallShare.toFixed(1)}%`)
    .join(', ')}.`;

  return (
    <div className={className}>
      <Bar data={data} options={options} plugins={[segmentLabelPlugin]} role="img" aria-label={summary} />
    </div>
  );
};
