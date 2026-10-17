import React, { useState } from 'react';
import {
  Receipt,
  ScanLine,
  TrendingUp,
  History as HistoryIcon,
  LineChart,
  RefreshCw,
  Sparkles,
  Download,
  AlertTriangle,
  LogOut,
  Loader2
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive';
  setActiveTab: (tab: 'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive') => void;
  increasedCount: number;
  totalBills: number;
  userName: string;
  onResetSample: () => void;
  onExportData: () => void;
  onOpenAIInsights: () => void;
  onLogout: () => Promise<void> | void;
}

// Shared styles: a transparent border on inactive items keeps every item the same size as the active one
const navItemBase =
  'h-9 px-3 rounded-lg border text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 shrink-0';
const navItemInactive = 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60';

const mobileItemBase =
  'px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 shrink-0';

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  increasedCount,
  totalBills,
  userName,
  onResetSample,
  onExportData,
  onOpenAIInsights,
  onLogout,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight whitespace-nowrap bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  BillPulse75
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ₫ VND
                </span>
              </div>
              {/* Tagline only shows when the desktop nav is hidden, so it never squeezes the menu */}
              <p className="text-xs text-slate-400 whitespace-nowrap hidden sm:block xl:hidden">
                Quét hóa đơn & Theo dõi biến động giá hàng hóa
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${navItemBase} ${activeTab === 'dashboard'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-500/10'
                  : navItemInactive
                }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              Tổng quan
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`${navItemBase} relative ${activeTab === 'scan'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : navItemInactive
                }`}
            >
              <ScanLine className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Quét hóa đơn</span>
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('watchlist')}
              className={`${navItemBase} ${activeTab === 'watchlist'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : navItemInactive
                }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              Biến động giá
              {increasedCount > 0 && (
                <span className="px-1.5 py-px text-[10px] font-bold leading-4 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  +{increasedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`${navItemBase} ${activeTab === 'bills'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : navItemInactive
                }`}
            >
              <HistoryIcon className="w-4 h-4 shrink-0" />
              Hóa đơn ({totalBills})
            </button>

            <button
              onClick={() => setActiveTab('deepdive')}
              className={`${navItemBase} ${activeTab === 'deepdive'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : navItemInactive
                }`}
            >
              <LineChart className="w-4 h-4 shrink-0 text-amber-400" />
              Chi tiết mặt hàng
            </button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenAIInsights}
              className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium whitespace-nowrap bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30 transition-all shadow-sm"
              title="Phân tích tình hình giá cả bằng Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              AI Phân tích
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

            <div className="w-px h-6 bg-slate-800 mx-1" />

            {/* Signed-in user */}
            <div
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0"
              title={userName}
            >
              {userName.trim().charAt(0).toUpperCase() || '?'}
            </div>

            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors disabled:cursor-wait disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              title={isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Compact sub-navigation for screens narrower than xl */}
        <div className="flex xl:hidden items-center justify-start sm:justify-around py-2 border-t border-slate-800 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`${mobileItemBase} ${activeTab === 'dashboard' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
              }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`${mobileItemBase} font-semibold ${activeTab === 'scan' ? 'bg-emerald-500/20 text-emerald-300' : 'text-emerald-400'
              }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Quét bill
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`${mobileItemBase} ${activeTab === 'watchlist' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
              }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Biến động
            {increasedCount > 0 && (
              <span className="px-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300">
                +{increasedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`${mobileItemBase} ${activeTab === 'bills' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            Hóa đơn ({totalBills})
          </button>
          <button
            onClick={() => setActiveTab('deepdive')}
            className={`${mobileItemBase} ${activeTab === 'deepdive' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
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
