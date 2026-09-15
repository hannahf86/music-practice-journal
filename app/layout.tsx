// app/layout.tsx — root layout: global styles + client providers + centered app shell.
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Music Practice Journal',
  description: 'Plan, reflect, and track your music practice — week by week.',
};

export const viewport: Viewport = {
  themeColor: '#534AB7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
