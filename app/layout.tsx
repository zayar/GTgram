import './globals.css';
import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegistration from '@/components/utils/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'GTgram - Share your moments',
  description: 'A social media platform for sharing photos and videos with friends',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gtgram-dark min-h-screen no-horizontal-overflow">
        <Providers>
          {children}
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
} 