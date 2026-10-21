import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { PricePoint } from '../../../../shared/types/bill';
import { formatVND } from '../../../../shared/currency';
import { chartTheme, crosshairPlugin, withAlpha } from './chartSetup';

interface PriceHistoryChartProps {
  points: PricePoint[];
  unit: string;
  itemName: string;
  className?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// 'YYYY-MM-DD' → UTC timestamp, so points sit at their real date with no timezone shift
const toTime = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const formatDay = (time: number, withYear = true) => {
  const date = new Date(time);
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return withYear ? `${dd}/${mm}/${date.getUTCFullYear()}` : `${dd}/${mm}`;
};

/** Unit price of one product over time. Points are placed by real date, not evenly spaced. */
export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ points, unit, itemName, className }) => {
  const color = chartTheme.series.price;

  const { data, options } = useMemo(() => {
    const times = points.map(p => toTime(p.date));
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const span = maxTime - minTime;
    // Breathing room so the first/last markers aren't clipped by the plot edge
    const pad = span > 0 ? span * 0.04 : DAY_MS;
    const sameYear = new Date(minTime).getUTCFullYear() === new Date(maxTime).getUTCFullYear();
    const tickTimes = Array.from(new Set(times));

    const data: ChartData<'line', { x: number; y: number }[]> = {
      datasets: [
        {
          label: 'Đơn giá',
          data: points.map((p, i) => ({ x: times[i], y: p.unitPrice })),
          borderColor: color,
          borderWidth: 2,
          tension: 0,
          fill: 'start',
          backgroundColor: withAlpha(color, 0.1),
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHitRadius: 14,
          pointBackgroundColor: color,
          pointBorderColor: chartTheme.surface,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
        },
      ],
    };

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      layout: { padding: { top: 8, right: 8 } },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 1,
          titleColor: chartTheme.textSecondary,
          bodyColor: chartTheme.textPrimary,
          titleFont: { weight: 'normal' },
          bodyFont: { weight: 'bold' },
          footerColor: chartTheme.axisText,
          footerFont: { weight: 'normal' },
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: items => formatDay(times[items[0].dataIndex]),
            label: item => `${formatVND(points[item.dataIndex].unitPrice)} / ${unit}`,
            footer: items => {
              const point = points[items[0].dataIndex];
              return [`Cửa hàng: ${point.store}`, `Số lượng: ${point.quantity} ${unit}`];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: minTime - pad,
          max: maxTime + pad,
          // One tick per purchase date
          afterBuildTicks: axis => {
            axis.ticks = tickTimes.map(value => ({ value }));
          },
          ticks: {
            color: chartTheme.axisText,
            maxRotation: 0,
            autoSkipPadding: 12,
            callback: value => formatDay(Number(value), !sameYear),
          },
          grid: { display: false },
          border: { color: chartTheme.grid },
        },
        y: {
          grace: '15%',
          ticks: {
            color: chartTheme.axisText,
            maxTicksLimit: 5,
            padding: 8,
            callback: value => formatVND(Number(value), { compact: true }),
          },
          grid: { color: chartTheme.grid, lineWidth: 1 },
          border: { display: false },
        },
      },
    };

    return { data, options };
  }, [points, unit, color]);

  const first = points[0];
  const last = points[points.length - 1];
  const summary = first && last
    ? `Biểu đồ đơn giá ${itemName}: từ ${formatVND(first.unitPrice)} (${formatDay(toTime(first.date))}) đến ${formatVND(last.unitPrice)} (${formatDay(toTime(last.date))}), ${points.length} lần mua.`
    : `Biểu đồ đơn giá ${itemName}`;

  return (
    <div className={className}>
      <Line data={data} options={options} plugins={[crosshairPlugin]} role="img" aria-label={summary} />
    </div>
  );
};
