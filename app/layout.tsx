import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LightDoc Studio — .lpdx Document Creator',
  description: 'Create, scan, and export documents in the .lpdx format — 65–80% smaller than scanned PDFs, readable in every PDF viewer.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'LightDoc',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F6E3A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
