import React from 'react';
import { Route, Routes } from 'react-router';
import { ROUTE_PATTERNS } from './routes';
import { AppLayout } from './layouts/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScanPage } from './pages/ScanPage';
import { PricesPage } from './pages/PricesPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { BillsPage } from './pages/BillsPage';
import { ItemsPage } from './pages/ItemsPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Every page has its own URL. Keep this list in sync with ROUTE_PATTERNS in
 * routes.ts, which the server uses to decide which URLs serve the app.
 */
export default function App() {
  return (
    <Routes>
      <Route path={ROUTE_PATTERNS.login} element={<AuthPage mode="login" />} />
      <Route path={ROUTE_PATTERNS.register} element={<AuthPage mode="register" />} />

      {/* Signed-in pages share the navbar/footer layout */}
      <Route element={<AppLayout />}>
        <Route path={ROUTE_PATTERNS.dashboard} element={<DashboardPage />} />
        <Route path={ROUTE_PATTERNS.scan} element={<ScanPage />} />
        <Route path={ROUTE_PATTERNS.prices} element={<PricesPage />} />
        <Route path={ROUTE_PATTERNS.categories} element={<CategoriesPage />} />
        <Route path={ROUTE_PATTERNS.bills} element={<BillsPage />} />
        <Route path={ROUTE_PATTERNS.items} element={<ItemsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
