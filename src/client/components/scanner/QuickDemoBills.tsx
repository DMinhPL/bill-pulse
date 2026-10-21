import React from 'react';
import { Receipt } from 'lucide-react';
import { QUICK_DEMO_BILLS, SampleQuickBill } from '../../../../shared/seed/sampleBills';
import { formatVND } from '../../../../shared/currency';

/** Sample bills that skip the upload so the review flow can be tried instantly */
export const QuickDemoBills: React.FC<{ onPick: (demo: SampleQuickBill) => void }> = ({ onPick }) => (
  <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
        <h3 className="font-semibold text-white text-sm">Thử nghiệm nhanh với Hóa đơn thực tế mẫu</h3>
      </div>
      <span className="text-xs text-slate-400 pl-6 sm:pl-0">Không cần tải tệp ảnh lên</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
      {QUICK_DEMO_BILLS.map(demo => (
        <div
          key={demo.id}
          onClick={() => onPick(demo)}
          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-sm text-slate-200 group-hover:text-emerald-300 transition-colors">
                {demo.name}
              </span>
              <span className="text-xs font-bold text-amber-400 whitespace-nowrap shrink-0">
                {formatVND(demo.totalVND)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{demo.description}</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="min-w-0 truncate">
              {demo.merchant} • {demo.date}
            </span>
            <span className="text-emerald-400 font-medium group-hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
              Thử quét ngay →
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
