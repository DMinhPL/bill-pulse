import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/client/index.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'BillPulse75 - Smart Bill & Price Inflation Monitor',
  description:
    'Scan and analyze Vietnamese bills and invoices from screenshots or PDFs. Track item price changes over time, detect price increases in VND, and monitor spending trends.',
  openGraph: {
    title: 'BillPulse75 - Smart Bill & Price Inflation Monitor',
    description:
      'Scan and analyze Vietnamese bills and invoices from screenshots or PDFs. Track item price changes over time, detect price increases in VND, and monitor spending trends.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function FrontendLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
