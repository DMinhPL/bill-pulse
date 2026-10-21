import React from 'react';
import { CalendarRange } from 'lucide-react';
import { MonthRange, formatMonthKey } from './charts/SpendingShareChart';

export type MonthRangePreset = '3m' | '6m' | '12m' | 'all' | 'custom';

export const MONTH_RANGE_PRESETS: { id: Exclude<MonthRangePreset, 'custom'>; label: string; months?: number }[] = [
  { id: '3m', label: '3 tháng', months: 3 },
  { id: '6m', label: '6 tháng', months: 6 },
  { id: '12m', label: '12 tháng', months: 12 },
  { id: 'all', label: 'Tất cả' },
];

const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/** The month range a preset covers, counted back from the current month (inclusive). */
export function rangeForPreset(preset: Exclude<MonthRangePreset, 'custom'>, today = new Date()): MonthRange {
  const months = MONTH_RANGE_PRESETS.find(p => p.id === preset)?.months;
  if (!months) return {};
  const start = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  return { from: toMonthKey(start), to: toMonthKey(today) };
}

interface MonthRangePickerProps {
  availableMonths: string[];
  preset: MonthRangePreset;
  /** The months actually shown, used as the custom selects' values */
  from: string;
  to: string;
  onPresetChange: (preset: Exclude<MonthRangePreset, 'custom'>) => void;
  onCustomChange: (range: Required<MonthRange>) => void;
  className?: string;
}

const selectClass =
  'month-range__select h-8 bg-slate-950 text-xs text-slate-200 px-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500/50';

/** Presets first, then a custom from/to range limited to months that have data. */
export const MonthRangePicker: React.FC<MonthRangePickerProps> = ({
  availableMonths,
  preset,
  from,
  to,
  onPresetChange,
  onCustomChange,
  className = '',
}) => {
  // Keep from <= to: moving one end past the other drags it along
  const changeFrom = (value: string) => onCustomChange({ from: value, to: value > to ? value : to });
  const changeTo = (value: string) => onCustomChange({ from: value < from ? value : from, to: value });

  return (
    <div className={`month-range flex flex-wrap items-center gap-2 ${className}`}>
      <CalendarRange className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />

      <div className="month-range__presets inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800" role="group" aria-label="Khoảng thời gian nhanh">
        {MONTH_RANGE_PRESETS.map(p => {
          const active = preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPresetChange(p.id)}
              aria-pressed={active}
              className={`month-range__preset ${active ? 'is-active' : ''} h-7 px-2.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className={`month-range__custom flex items-center gap-1.5 ${preset === 'custom' ? 'is-active' : ''}`}>
        <label className="sr-only" htmlFor="month-range-from">Từ tháng</label>
        <select id="month-range-from" value={from} onChange={e => changeFrom(e.target.value)} className={selectClass}>
          {availableMonths.map(m => (
            <option key={m} value={m}>{formatMonthKey(m)}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500">–</span>
        <label className="sr-only" htmlFor="month-range-to">Đến tháng</label>
        <select id="month-range-to" value={to} onChange={e => changeTo(e.target.value)} className={selectClass}>
          {availableMonths.map(m => (
            <option key={m} value={m}>{formatMonthKey(m)}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
