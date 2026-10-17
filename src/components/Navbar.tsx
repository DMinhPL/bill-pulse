import React from 'react';
import {
  Receipt,
  ScanLine,
  TrendingUp,
  History as HistoryIcon,
  LineChart,
  RefreshCw,
  Sparkles,
  Download,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive';
  setActiveTab: (tab: 'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive') => void;
  increasedCount: number;
  totalBills: number;
  onResetSample: () => void;
  onExportData: () => void;
  onOpenAIInsights: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  increasedCount,
  totalBills,
  onResetSample,
  onExportData,
  onOpenAIInsights,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  BillPulse VN
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ₫ VND
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Quét hóa đơn & Theo dõi biến động giá hàng hóa
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Tổng quan
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative ${
                activeTab === 'scan'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ScanLine className="w-4 h-4 text-emerald-400" />
              <span>Quét hóa đơn</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'watchlist'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Biến động giá
              {increasedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  +{increasedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'bills'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              Hóa đơn ({totalBills})
            </button>

            <button
              onClick={() => setActiveTab('deepdive')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'deepdive'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LineChart className="w-4 h-4 text-amber-400" />
              Chi tiết mặt hàng
            </button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAIInsights}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30 transition-all shadow-sm"
              title="Phân tích tình hình giá cả bằng Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI Phân tích lạm phát
            </button>

            <button
              onClick={onResetSample}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Khôi phục hóa đơn mẫu (Demo data)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onExportData}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Xuất dữ liệu JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'dashboard' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'scan' ? 'bg-emerald-500/20 text-emerald-300' : 'text-emerald-400'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Quét bill
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'watchlist' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Biến động
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'bills' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            Hóa đơn
          </button>
          <button
            onClick={() => setActiveTab('deepdive')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'deepdive' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 text-amber-400" />
            Chi tiết
          </button>
        </div>
      </div>
    </header>
  );
};
