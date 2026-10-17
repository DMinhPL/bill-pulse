import React, { useState, useEffect, useMemo } from 'react';
import { Bill } from './types/bill';
import { computePriceHistoryMap } from './utils/priceTracker';
import { authApi, billsApi, ApiError, AuthUser } from './utils/api';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { BillScannerView } from './components/BillScannerView';
import { PriceWatchlistView } from './components/PriceWatchlistView';
import { BillsHistoryView } from './components/BillsHistoryView';
import { ItemDeepDiveView } from './components/ItemDeepDiveView';
import { BillDetailModal } from './components/BillDetailModal';
import { AIInsightsModal } from './components/AIInsightsModal';
import { useConfirm } from './components/ConfirmDialog';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type Toast = { message: string; tone: 'success' | 'error' };

export default function App() {
  // undefined = still checking the session, null = logged out
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive'>('dashboard');
  const [selectedBillForModal, setSelectedBillForModal] = useState<Bill | null>(null);
  const [selectedItemForDeepDive, setSelectedItemForDeepDive] = useState<string | null>(null);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const confirm = useConfirm();

  // Restore the session from the cookie
  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null));
  }, []);

  // Load this user's bills from the server
  useEffect(() => {
    if (!user) {
      setBills([]);
      return;
    }
    setBillsLoading(true);
    billsApi
      .list()
      .then(({ bills }) => setBills(bills))
      .catch(handleApiError)
      .finally(() => setBillsLoading(false));
  }, [user?.id]);

  // Compute price trend summaries
  const priceTrends = useMemo(() => {
    const map = computePriceHistoryMap(bills);
    return Array.from(map.values());
  }, [bills]);

  const increasedCount = useMemo(() => {
    return priceTrends.filter(t => t.status === 'INCREASED').length;
  }, [priceTrends]);

  // Toast notification helper
  const showToast = (message: string, tone: Toast['tone'] = 'success') => {
    setToast({ message, tone });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // An expired session sends the user back to the login screen
  function handleApiError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      setUser(null);
      return;
    }
    showToast(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.', 'error');
  }

  // Handlers

  /** Resolves true once the bill is stored; the scanner keeps its draft on false. */
  const handleSaveBill = async (newBill: Bill): Promise<boolean> => {
    try {
      const { bill: saved } = await billsApi.create(newBill);
      // The receipt preview isn't stored in the database, so keep it for this session
      setBills(prev => [{ ...saved, filePreview: newBill.filePreview }, ...prev]);
      showToast(`Đã lưu hóa đơn "${saved.merchantName}" và cập nhật biến động giá!`);
      return true;
    } catch (err) {
      handleApiError(err);
      return false;
    }
  };

  const handleDeleteBill = async (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    await confirm({
      tone: 'danger',
      title: 'Xóa hóa đơn này?',
      message: bill
        ? `Hóa đơn "${bill.merchantName}" ngày ${bill.date} sẽ bị xóa khỏi lịch sử theo dõi. Không thể hoàn tác.`
        : 'Hóa đơn sẽ bị xóa khỏi lịch sử theo dõi. Không thể hoàn tác.',
      confirmLabel: 'Xóa hóa đơn',
      busyLabel: 'Đang xóa...',
      action: async () => {
        try {
          await billsApi.remove(billId);
          setBills(prev => prev.filter(b => b.id !== billId));
          showToast('Đã xóa hóa đơn thành công.');
        } catch (err) {
          handleApiError(err);
        }
      },
    });
  };

  const handleResetSampleData = async () => {
    await confirm({
      tone: 'danger',
      title: 'Khôi phục hóa đơn mẫu?',
      message: `Toàn bộ ${bills.length} hóa đơn hiện tại của bạn sẽ bị xóa và thay bằng các hóa đơn mẫu (WinMart, Bách Hóa Xanh, Co.opmart...). Không thể hoàn tác.`,
      confirmLabel: 'Xóa và khôi phục',
      busyLabel: 'Đang khôi phục...',
      action: async () => {
        try {
          const { bills } = await billsApi.resetSample();
          setBills(bills);
          showToast('Đã khôi phục dữ liệu hóa đơn mẫu.');
        } catch (err) {
          handleApiError(err);
        }
      },
    });
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bills, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `billpulse_data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã xuất dữ liệu hóa đơn dạng JSON.');
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => { });
    setUser(null);
    setActiveTab('dashboard');
    setSelectedBillForModal(null);
    setSelectedItemForDeepDive(null);
    setIsAIInsightsOpen(false);
  };

  const handleSelectItemDeepDive = (itemName: string) => {
    setSelectedItemForDeepDive(itemName);
    setActiveTab('deepdive');
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (user === null) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        increasedCount={increasedCount}
        totalBills={bills.length}
        userName={user.displayName}
        onResetSample={handleResetSampleData}
        onExportData={handleExportData}
        onOpenAIInsights={() => setIsAIInsightsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {billsLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang tải hóa đơn...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                bills={bills}
                priceTrends={priceTrends}
                onNavigateTab={setActiveTab}
                onSelectItemDeepDive={handleSelectItemDeepDive}
                onSelectBill={setSelectedBillForModal}
                onOpenAIInsights={() => setIsAIInsightsOpen(true)}
              />
            )}

            {activeTab === 'scan' && (
              <BillScannerView
                existingBills={bills}
                onSaveBill={handleSaveBill}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'watchlist' && (
              <PriceWatchlistView
                priceTrends={priceTrends}
                onSelectItemDeepDive={handleSelectItemDeepDive}
                onOpenAIInsights={() => setIsAIInsightsOpen(true)}
              />
            )}

            {activeTab === 'bills' && (
              <BillsHistoryView
                bills={bills}
                onDeleteBill={handleDeleteBill}
                onSelectBill={setSelectedBillForModal}
                onNavigateScan={() => setActiveTab('scan')}
              />
            )}

            {activeTab === 'deepdive' && (
              <ItemDeepDiveView
                priceTrends={priceTrends}
                selectedItemName={selectedItemForDeepDive}
                onSelectItem={setSelectedItemForDeepDive}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            BillPulse75 — Giám sát hóa đơn & Theo dõi lạm phát giá từng mặt hàng bằng AI (VND ₫)
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Chuẩn hóa đơn vị: VND</span>
            <span>•</span>
            <span>Hỗ trợ tệp Ảnh & PDF</span>
          </div>
        </div>
      </footer>

      {/* Bill Detail Modal */}
      {selectedBillForModal && (
        <BillDetailModal
          bill={selectedBillForModal}
          allBills={bills}
          onClose={() => setSelectedBillForModal(null)}
        />
      )}

      {/* Gemini AI Inflation Insights Modal */}
      <AIInsightsModal
        isOpen={isAIInsightsOpen}
        onClose={() => setIsAIInsightsOpen(false)}
        priceTrends={priceTrends}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl font-semibold text-xs sm:text-sm flex items-center gap-2 ${toast.tone === 'success' ? 'bg-emerald-500 text-slate-950 animate-bounce' : 'bg-rose-500 text-white'
            }`}
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
