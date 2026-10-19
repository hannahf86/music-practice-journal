// app/layout.tsx — root layout: global styles + client providers.
// (Each route group — (auth) / (app) — provides its own responsive container.)
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
