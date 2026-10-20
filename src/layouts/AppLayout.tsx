import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/navigation/Sidebar';
import { AIInsightsModal } from '../components/AIInsightsModal';
import { ROUTES } from '../routes';

const FullScreenSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
  </div>
);

/** Shell for every signed-in page: navbar, page content, footer, toast and AI popup. */
export const AppLayout: React.FC = () => {
  const {
    user,
    billsLoading,
    bills,
    priceTrends,
    increasedCount,
    toast,
    resetSampleData,
    exportData,
    logout,
    isAIInsightsOpen,
    setAIInsightsOpen,
  } = useAppData();
  const location = useLocation();

  // Start at the top when moving to another section (not when opening a bill inside /bills)
  const section = location.pathname.split('/')[1];
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  if (user === undefined) return <FullScreenSpinner />;
  if (user === null) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.login}?redirect=${redirect}`} replace />;
  }

  const navProps = {
    increasedCount,
    totalBills: bills.length,
    onResetSample: resetSampleData,
    onExportData: exportData,
    onOpenAIInsights: () => setAIInsightsOpen(true),
    onLogout: logout,
  };

  return (
    <div className="app-shell min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white flex font-sans">
      {/* Desktop: navigation lives in a sidebar so the content keeps the full width of its column */}
      <Sidebar
        {...navProps}
        displayName={user.displayName}
        username={user.username}
        className="hidden lg:flex"
      />

      <div className="app-shell__main flex-1 min-w-0 flex flex-col">
        {/* Below lg: compact top header with a scrollable page menu */}
        <Navbar {...navProps} userName={user.displayName} className="lg:hidden" />

        <main className="app-shell__content flex-1 max-w-7xl 2xl:max-w-360 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {billsLoading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải hóa đơn...
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        <footer className="app-shell__footer mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>BillPulse75 — Giám sát hóa đơn & Theo dõi lạm phát giá từng mặt hàng bằng AI (VND ₫)</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Chuẩn hóa đơn vị: VND</span>
              <span>•</span>
              <span>Hỗ trợ tệp Ảnh & PDF</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Gemini AI Inflation Insights Modal (an action, not a page) */}
      <AIInsightsModal isOpen={isAIInsightsOpen} onClose={() => setAIInsightsOpen(false)} priceTrends={priceTrends} />

      {toast && (
        <div
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-xl font-semibold text-xs sm:text-sm flex items-center gap-2 ${toast.tone === 'success' ? 'bg-emerald-500 text-slate-950 animate-bounce' : 'bg-rose-500 text-white'
            }`}
        >
          {toast.tone === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export { FullScreenSpinner };
