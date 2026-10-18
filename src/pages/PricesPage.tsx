import React from 'react';
import { useNavigate } from 'react-router';
import { useAppData, usePageTitle } from '../context/AppDataContext';
import { PriceWatchlistView } from '../components/PriceWatchlistView';
import { itemPath } from '../routes';

export const PricesPage: React.FC = () => {
  const { priceTrends, setAIInsightsOpen } = useAppData();
  const navigate = useNavigate();
  usePageTitle('Biến động giá');

  return (
    <PriceWatchlistView
      priceTrends={priceTrends}
      onSelectItemDeepDive={name => navigate(itemPath(name))}
      onOpenAIInsights={() => setAIInsightsOpen(true)}
    />
  );
};
