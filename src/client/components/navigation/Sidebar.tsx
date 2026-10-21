import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { Sparkles, RefreshCw, Download, LogOut, Loader2 } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { Brand } from './Brand';

interface SidebarProps {
  increasedCount: number;
  totalBills: number;
  displayName: string;
  username: string;
  onResetSample: () => void;
  onExportData: () => void;
  onOpenAIInsights: () => void;
  onLogout: () => Promise<void> | void;
  className?: string;
}

const linkBase =
  'sidebar__link h-10 px-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 min-w-0';
const linkInactive = 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60';
const toolBase =
  'sidebar__tool w-full h-9 px-3 rounded-lg text-xs font-medium transition-colors flex items-center gap-2.5 text-left';

/** Desktop navigation (lg+): brand, pages, tools and the signed-in account. */
export const Sidebar: React.FC<SidebarProps> = ({
  increasedCount,
  totalBills,
  displayName,
  username,
  onResetSample,
  onExportData,
  onOpenAIInsights,
  onLogout,
  className = '',
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ctx = { totalBills };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`sidebar sticky top-0 h-screen w-64 shrink-0 flex-col bg-slate-900/95 border-r border-slate-800 ${className}`}
      aria-label="Điều hướng chính"
    >
      <div className="sidebar__header px-5 h-16 flex items-center border-b border-slate-800">
        <Brand className="shrink-0" />
      </div>

      {/* Pages */}
      <nav className="sidebar__nav flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="sidebar__section-title px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Trang
        </p>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${linkBase} sidebar__link--${item.key} ${isActive ? `is-active ${item.active}` : linkInactive}`
            }
          >
            <item.icon className={`sidebar__link-icon w-4 h-4 shrink-0 ${item.iconClass ?? ''}`} />
            <span className="sidebar__link-label truncate">{item.label(ctx)}</span>
            {item.badge === 'pulse' && (
              <span className="sidebar__pulse ml-auto flex h-2 w-2 relative shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            {item.badge === 'increased' && increasedCount > 0 && (
              <span
                className="sidebar__badge sidebar__badge--increased ml-auto px-1.5 py-px text-[10px] font-bold leading-4 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30"
                aria-label={`${increasedCount} mặt hàng tăng giá`}
              >
                +{increasedCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Tools */}
      <div className="sidebar__tools px-3 py-3 border-t border-slate-800 space-y-1">
        <p className="sidebar__section-title px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Công cụ
        </p>
        <button
          type="button"
          onClick={onOpenAIInsights}
          className={`${toolBase} sidebar__tool--ai bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
          AI Phân tích lạm phát
        </button>
        {/* <button
          type="button"
          onClick={onResetSample}
          className={`${toolBase} sidebar__tool--reset text-slate-400 hover:text-slate-200 hover:bg-slate-800`}
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
          Khôi phục hóa đơn mẫu
        </button> */}
        <button
          type="button"
          onClick={onExportData}
          className={`${toolBase} sidebar__tool--export text-slate-400 hover:text-slate-200 hover:bg-slate-800`}
        >
          <Download className="w-4 h-4 shrink-0" />
          Xuất dữ liệu JSON
        </button>
      </div>

      {/* Signed-in account */}
      <div className="sidebar__user px-4 py-3 border-t border-slate-800 flex items-center gap-3">
        <div
          className="sidebar__avatar w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-slate-200 shrink-0"
          aria-hidden="true"
        >
          {displayName.trim().charAt(0).toUpperCase() || '?'}
        </div>
        <div className="sidebar__user-text min-w-0 flex-1">
          <p className="sidebar__user-name text-sm font-semibold text-slate-100 truncate" title={displayName}>
            {displayName}
          </p>
          <p className="sidebar__user-handle text-[11px] text-slate-500 truncate">@{username}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          className="sidebar__logout p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors disabled:cursor-wait"
          title={isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          aria-label="Đăng xuất"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
