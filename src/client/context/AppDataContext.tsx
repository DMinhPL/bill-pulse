import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Bill, PriceTrendSummary } from '../../../shared/types/bill';
import { computePriceHistoryMap } from '../../../shared/priceTracker';
import { formatDateShort } from '../../../shared/date';
import { authApi, billsApi, bootstrapApi, ApiError, AuthUser } from '../utils/api';
import { useConfirm } from '../components/ConfirmDialog';

export type Toast = { message: string; tone: 'success' | 'error' };

interface AppData {
  /** undefined = still checking the session, null = logged out */
  user: AuthUser | null | undefined;
  setUser: (user: AuthUser | null) => void;
  bills: Bill[];
  /** True until this user's bills have been fetched (pages wait for it before resolving URLs) */
  billsLoading: boolean;
  priceTrends: PriceTrendSummary[];
  increasedCount: number;
  toast: Toast | null;
  showToast: (message: string, tone?: Toast['tone']) => void;
  /** Resolves true once stored; the scanner keeps its draft on false. */
  saveBill: (bill: Bill) => Promise<boolean>;
  /** Asks for confirmation; resolves true if the bill was deleted. */
  deleteBill: (billId: string) => Promise<boolean>;
  resetSampleData: () => Promise<void>;
  exportData: () => void;
  logout: () => Promise<void>;
  isAIInsightsOpen: boolean;
  setAIInsightsOpen: (open: boolean) => void;
  billCategories: Array<{ key: string; label: string; order: number }>;
  lookups: { paymentMethods: Array<{ value: string }>; units: Array<{ value: string }>; itemCategories: Array<{ value: string }> };
}

const AppDataContext = createContext<AppData | null>(null);

/** Session, bills and the actions on them, shared by every page. */
export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [bills, setBills] = useState<Bill[]>([]);
  // Which user the current bills belong to; anything else means "still loading"
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const [billCategories, setBillCategories] = useState<AppData['billCategories']>([]);
  const [lookups, setLookups] = useState<AppData['lookups']>({ paymentMethods: [], units: [], itemCategories: [] });
  const [toast, setToast] = useState<Toast | null>(null);
  const [isAIInsightsOpen, setAIInsightsOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const confirm = useConfirm();

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // An expired session sends the user back to the login page
  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        return;
      }
      showToast(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.', 'error');
    },
    [showToast]
  );

  // Restore the session from the cookie
  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    bootstrapApi().then(data => { setBillCategories(data.billCategories); setLookups(data.lookups); }).catch(handleApiError);
  }, [handleApiError]);

  // Load this user's bills from the server
  useEffect(() => {
    if (!user) {
      setBills([]);
      setLoadedForUserId(null);
      return;
    }
    const userId = user.id;
    billsApi
      .list()
      .then(({ bills }) => setBills(bills))
      .catch(handleApiError)
      .finally(() => setLoadedForUserId(userId));
  }, [user?.id]);

  const billsLoading = !!user && loadedForUserId !== user.id;

  const priceTrends = useMemo(() => Array.from(computePriceHistoryMap(bills).values()), [bills]);
  const increasedCount = useMemo(() => priceTrends.filter(t => t.status === 'INCREASED').length, [priceTrends]);

  const saveBill = async (newBill: Bill): Promise<boolean> => {
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

  const deleteBill = async (billId: string): Promise<boolean> => {
    const bill = bills.find(b => b.id === billId);
    let deleted = false;
    await confirm({
      tone: 'danger',
      title: 'Xóa hóa đơn này?',
      message: bill
        ? `Hóa đơn "${bill.merchantName}" ngày ${formatDateShort(bill.date)} sẽ bị xóa khỏi lịch sử theo dõi. Không thể hoàn tác.`
        : 'Hóa đơn sẽ bị xóa khỏi lịch sử theo dõi. Không thể hoàn tác.',
      confirmLabel: 'Xóa hóa đơn',
      busyLabel: 'Đang xóa...',
      action: async () => {
        try {
          await billsApi.remove(billId);
          setBills(prev => prev.filter(b => b.id !== billId));
          showToast('Đã xóa hóa đơn thành công.');
          deleted = true;
        } catch (err) {
          handleApiError(err);
        }
      },
    });
    return deleted;
  };

  const resetSampleData = async () => {
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

  const exportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bills, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `billpulse_data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã xuất dữ liệu hóa đơn dạng JSON.');
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setAIInsightsOpen(false);
    setUser(null);
  };

  const value: AppData = {
    user,
    setUser,
    bills,
    billsLoading,
    priceTrends,
    increasedCount,
    toast,
    showToast,
    saveBill,
    deleteBill,
    resetSampleData,
    exportData,
    logout,
    isAIInsightsOpen,
    setAIInsightsOpen,
    billCategories,
    lookups,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export function useAppData(): AppData {
  const data = useContext(AppDataContext);
  if (!data) throw new Error('useAppData must be used inside <AppDataProvider>');
  return data;
}

/** Sets the browser tab title for the current page. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · BillPulse75`;
  }, [title]);
}
