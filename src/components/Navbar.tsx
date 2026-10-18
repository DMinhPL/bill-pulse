import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { RefreshCw, Sparkles, Download, LogOut, Loader2 } from 'lucide-react';
import { NAV_ITEMS } from './navigation/navItems';
import { Brand } from './navigation/Brand';
import { useHeightVar } from '../hooks/useHeightVar';

interface NavbarProps {
  increasedCount: number;
  totalBills: number;
  userName: string;
  onResetSample: () => void;
  onExportData: () => void;
  onOpenAIInsights: () => void;
  onLogout: () => Promise<void> | void;
  className?: string;
}

const mobileItemBase =
  'px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 shrink-0';
const iconAction = 'p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors';

/** Top header for screens below lg; larger screens use the Sidebar instead. */
export const Navbar: React.FC<NavbarProps> = ({
  increasedCount,
  totalBills,
  userName,
  onResetSample,
  onExportData,
  onOpenAIInsights,
  onLogout,
  className = '',
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  // Lets sticky page headers sit right below this bar (it is hidden, so 0px, on lg+)
  useHeightVar(headerRef, '--app-header-h');

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const ctx = { totalBills };

  return (
    <header ref={headerRef} className={`navbar sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl ${className}`}>
      <div className="navbar__inner px-4 sm:px-6">
        <div className="navbar__bar flex items-center justify-between gap-3 h-16">
          <Brand withTagline className="navbar__brand min-w-0" />

          {/* Action buttons */}
          <div className="navbar__actions flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenAIInsights}
              className="navbar__action navbar__action--ai flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium whitespace-nowrap bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30 transition-all shadow-sm"
              title="Phân tích tình hình giá cả bằng Gemini AI"
              aria-label="AI Phân tích"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span className="navbar__action-label hidden sm:inline">AI Phân tích</span>
            </button>

            <button onClick={onResetSample} className={`navbar__action navbar__action--reset ${iconAction}`} title="Khôi phục hóa đơn mẫu (Demo data)">
              <RefreshCw className="w-4 h-4" />
            </button>

            <button onClick={onExportData} className={`navbar__action navbar__action--export ${iconAction}`} title="Xuất dữ liệu JSON">
              <Download className="w-4 h-4" />
            </button>

            <div className="navbar__divider w-px h-6 bg-slate-800 mx-1" />

            {/* Signed-in user */}
            <div
              className="navbar__avatar w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0"
              title={userName}
            >
              {userName.trim().charAt(0).toUpperCase() || '?'}
            </div>

            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              className="navbar__action navbar__action--logout p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors disabled:cursor-wait disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              title={isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              aria-label="Đăng xuất"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Compact page menu */}
        <nav
          className="navbar__menu navbar__menu--mobile flex items-center justify-start sm:justify-around py-2 border-t border-slate-800 overflow-x-auto gap-2"
          aria-label="Điều hướng chính"
        >
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `navbar__link navbar__link--${item.key} ${isActive ? 'is-active' : ''} ${mobileItemBase} ${
                  isActive ? item.mobileActive : item.mobileInactive ?? 'text-slate-400'
                }`
              }
            >
              <item.icon className={`navbar__link-icon w-3.5 h-3.5 ${item.iconClass ?? ''}`} />
              <span className="navbar__link-label">{item.shortLabel(ctx)}</span>
              {item.badge === 'increased' && increasedCount > 0 && (
                <span className="navbar__badge navbar__badge--increased px-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300">
                  +{increasedCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};
