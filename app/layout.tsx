import './globals.css';
import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistration from '@/components/utils/ServiceWorkerRegistration';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/auth/AuthProvider';
import AutoAction from '@/components/AutoAction';
import ClearStorage from '@/components/debug/ClearStorage';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GTgram - Share your moments',
  description: 'A social media platform for sharing photos and videos with friends',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gtgram-dark min-h-screen no-horizontal-overflow`}>
        <ClearStorage />
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <AutoAction>
              <Providers>
                {children}
                <ServiceWorkerRegistration />
              </Providers>
            </AutoAction>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
} 