import React from 'react';
import { useNavigate } from 'react-router';
import { useAppData, usePageTitle } from '../context/AppDataContext';
import { BillScannerView } from '../components/BillScannerView';
import { pathForTab } from '../routes';

export const ScanPage: React.FC = () => {
  const { bills, saveBill } = useAppData();
  const navigate = useNavigate();
  usePageTitle('Quét hóa đơn');

  return <BillScannerView existingBills={bills} onSaveBill={saveBill} onNavigateTab={tab => navigate(pathForTab(tab))} />;
};
