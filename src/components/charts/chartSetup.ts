import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  type Plugin,
} from 'chart.js';

// Register only the Chart.js parts the app uses (keeps the bundle small).
// Add controllers/scales here when a new chart type is introduced.
ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip
);

/** Dark-theme chart tokens, matching the app's Tailwind slate palette. */
export const chartTheme = {
  surface: '#0f172a', // slate-900, the card behind every chart
  grid: '#1e293b', // slate-800, one step off the surface
  crosshair: '#475569', // slate-600
  axisText: '#94a3b8', // slate-400
  tooltipBg: '#020617', // slate-950
  tooltipBorder: '#334155', // slate-700
  textPrimary: '#f8fafc', // slate-50
  textSecondary: '#cbd5e1', // slate-300
  zeroLine: '#64748b', // slate-500, the neutral midpoint of diverging charts
  series: {
    price: '#f43f5e', // rose-500, validated against the surface
  },
  // Diverging pair for price change. Validated together on the dark surface:
  // CVD ΔE 10.3 (emerald-500 failed at 5.6 for red-green colour blindness)
  change: {
    increase: '#f43f5e', // rose-500
    decrease: '#0d9488', // teal-600
  },
} as const;

// Canvas text doesn't inherit CSS fonts, so the chart font is set explicitly
export const CHART_FONT_FAMILY = 'Inter, sans-serif';
ChartJS.defaults.font.family = CHART_FONT_FAMILY;
ChartJS.defaults.font.size = 11;

// A canvas drawn before the web font arrives keeps the fallback font, so redraw once it's ready
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts
    .load(`11px ${CHART_FONT_FAMILY}`)
    .then(() => Object.values(ChartJS.instances).forEach(chart => chart.update('none')))
    .catch(() => {
      // Offline or blocked: charts keep the sans-serif fallback
    });
}
ChartJS.defaults.color = chartTheme.axisText;

/** '#f43f5e' + 0.1 → 'rgba(244, 63, 94, 0.1)' */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Vertical hairline at the hovered X, drawn under the data so markers stay on top. */
export const crosshairPlugin: Plugin<'line'> = {
  id: 'crosshair',
  beforeDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements();
    if (!active?.length) return;

    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = chartTheme.crosshair;
    ctx.stroke();
    ctx.restore();
  },
};
