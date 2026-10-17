import React, { useState, useEffect, useMemo } from 'react';
import { Bill } from './types/bill';
import { INITIAL_SAMPLE_BILLS } from './data/sampleBills';
import { computePriceHistoryMap } from './utils/priceTracker';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { BillScannerView } from './components/BillScannerView';
import { PriceWatchlistView } from './components/PriceWatchlistView';
import { BillsHistoryView } from './components/BillsHistoryView';
import { ItemDeepDiveView } from './components/ItemDeepDiveView';
import { BillDetailModal } from './components/BillDetailModal';
import { AIInsightsModal } from './components/AIInsightsModal';
import { CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'billpulse_vn_bills_v1';

export default function App() {
  // Load saved bills or default sample bills
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load bills from localStorage:', e);
    }
    return INITIAL_SAMPLE_BILLS;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'watchlist' | 'bills' | 'deepdive'>('dashboard');
  const [selectedBillForModal, setSelectedBillForModal] = useState<Bill | null>(null);
  const [selectedItemForDeepDive, setSelectedItemForDeepDive] = useState<string | null>(null);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    } catch (e) {
      console.error('Failed to save bills to localStorage:', e);
    }
  }, [bills]);

  // Compute price trend summaries
  const priceTrends = useMemo(() => {
    const map = computePriceHistoryMap(bills);
    return Array.from(map.values());
  }, [bills]);

  const increasedCount = useMemo(() => {
    return priceTrends.filter(t => t.status === 'INCREASED').length;
  }, [priceTrends]);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handlers
  const handleSaveBill = (newBill: Bill) => {
    setBills(prev => [newBill, ...prev]);
    showToast(`Đã lưu hóa đơn "${newBill.merchantName}" và cập nhật biến động giá!`);
  };

  const handleDeleteBill = (billId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này khỏi lịch sử theo dõi?')) {
      setBills(prev => prev.filter(b => b.id !== billId));
      showToast('Đã xóa hóa đơn thành công.');
    }
  };

  const handleResetSampleData = () => {
    if (window.confirm('Khôi phục danh sách các hóa đơn mẫu thực tế (WinMart, Bách Hóa Xanh, Co.opmart...)?')) {
      setBills(INITIAL_SAMPLE_BILLS);
      showToast('Đã khôi phục dữ liệu hóa đơn mẫu.');
    }
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

  const handleSelectItemDeepDive = (itemName: string) => {
    setSelectedItemForDeepDive(itemName);
    setActiveTab('deepdive');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        increasedCount={increasedCount}
        totalBills={bills.length}
        onResetSample={handleResetSampleData}
        onExportData={handleExportData}
        onOpenAIInsights={() => setIsAIInsightsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            BillPulse VN — Giám sát hóa đơn & Theo dõi lạm phát giá từng mặt hàng bằng AI (VND ₫)
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
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl shadow-xl font-semibold text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
