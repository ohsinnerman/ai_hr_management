import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'NexusHR — AI-Powered HR Management', template: '%s | NexusHR' },
  description: 'AI-powered Human Resource Management System by FWC IT Services Pvt. Ltd.',
  keywords: ['HRMS', 'HR Management', 'Payroll', 'Attendance', 'AI HR'],
  authors: [{ name: 'FWC IT Services Pvt. Ltd.' }],
  robots: 'noindex, nofollow', // internal app
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
