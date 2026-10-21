import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useAppData, usePageTitle } from '../context/AppDataContext';
import { BillsHistoryView } from '../components/BillsHistoryView';
import { BillDetailModal } from '../components/BillDetailModal';
import { NotFoundState } from './NotFoundState';
import { ROUTES, billPath } from '../../../shared/routes';

/** /bills (history) and /bills/:billId (history with that bill's detail open). */
export const BillsPage: React.FC = () => {
  const { bills, deleteBill } = useAppData();
  const { billId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const bill = billId ? bills.find(b => b.id === billId) : undefined;
  usePageTitle(bill ? `Hóa đơn ${bill.merchantName}` : 'Hóa đơn');

  if (billId && !bill) {
    return (
      <NotFoundState
        title="Không tìm thấy hóa đơn"
        message="Hóa đơn này không tồn tại hoặc đã bị xóa."
        backTo={ROUTES.bills}
        backLabel="Xem lịch sử hóa đơn"
      />
    );
  }

  // Closing returns to the page the bill was opened from (e.g. the dashboard), else the list
  const closeTarget = (location.state as { from?: string } | null)?.from ?? ROUTES.bills;

  return (
    <>
      <BillsHistoryView
        bills={bills}
        onDeleteBill={deleteBill}
        onSelectBill={b => navigate(billPath(b.id), { state: { from: ROUTES.bills } })}
        onNavigateScan={() => navigate(ROUTES.scan)}
      />
      {bill && <BillDetailModal bill={bill} allBills={bills} onClose={() => navigate(closeTarget)} />}
    </>
  );
};
