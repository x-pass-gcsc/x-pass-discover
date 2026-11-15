import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/toast';
import { I18nProvider } from '@/i18n/client';
import { getLocale } from '@/i18n/server';
import { SenpaiWidget } from '@/features/senpai/senpai-widget';
import { getCurrentUser } from '@/lib/auth/session';
import { env } from '@/lib/env';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'X-PASS Discover — Step into the company. Do the work. Discover your fit.',
  description:
    'A 2D virtual-company career exploration platform. Join BITE, do real business work, and discover what fits.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  // The AI senpai is on every signed-in page. Reading the user leniently: a
  // database that is not set up yet must still render the page that says so.
  const user = await getCurrentUser().catch(() => null);
  return (
    <html lang={locale} className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <I18nProvider locale={locale}>
          <ToastProvider>
            {children}
            {user ? (
              <SenpaiWidget
                userId={user.id}
                displayName={user.displayName}
                provider={env.senpaiProvider}
              />
            ) : null}
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
