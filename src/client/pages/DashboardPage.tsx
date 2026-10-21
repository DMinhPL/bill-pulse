import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAppData, usePageTitle } from '../context/AppDataContext';
import { DashboardView } from '../components/DashboardView';
import { billPath, itemPath, pathForTab } from '../../../shared/routes';

export const DashboardPage: React.FC = () => {
  const { bills, priceTrends, setAIInsightsOpen } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle('Tổng quan');

  return (
    <DashboardView
      bills={bills}
      priceTrends={priceTrends}
      onNavigateTab={tab => navigate(pathForTab(tab))}
      onSelectItemDeepDive={name => navigate(itemPath(name))}
      // Remember where the bill was opened from, so closing it comes back here
      onSelectBill={bill => navigate(billPath(bill.id), { state: { from: location.pathname } })}
      onOpenAIInsights={() => setAIInsightsOpen(true)}
    />
  );
};
