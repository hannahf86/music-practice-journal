// app/layout.tsx — root layout: global styles + client providers.
// (Each route group — (auth) / (app) — provides its own responsive container.)
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Fraunces } from 'next/font/google';
import { Providers } from './providers';

// Serif display face for headings/brand (the character in the dashboard design).
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

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
    <html lang="en" className={display.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
