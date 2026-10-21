'use client';

import dynamic from 'next/dynamic';

// BrowserRouter reads window, so the SPA renders only in the browser
const AppRoot = dynamic(() => import('./AppRoot'), { ssr: false });

export default function ClientApp() {
  return <AppRoot />;
}
