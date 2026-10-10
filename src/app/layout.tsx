import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'The Bliss International Spa ERP - Multi-Branch Management System',
  description:
    'Enterprise-grade international spa, luxury wellness resort, and aesthetics clinic management platform.',
  icons: {
    icon: '/brand-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#fbf9f5] text-[#2d231c] antialiased selection:bg-[#b5915f]/25 selection:text-[#3e2c1e]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
