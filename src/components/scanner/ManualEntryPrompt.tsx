import React from 'react';
import { PencilLine } from 'lucide-react';

/** Entry point for typing a bill by hand; deliberately low-key, scanning stays the primary path */
export const ManualEntryPrompt: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
    <div className="flex items-start gap-3">
      <PencilLine className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-slate-200">Không có ảnh hóa đơn?</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Nhập thủ công các món đã mua để vẫn theo dõi được biến động giá.
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onStart}
      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
    >
      Nhập thủ công
    </button>
  </div>
);
