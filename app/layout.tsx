import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';
import ServiceWorkerRegistration from '@/components/utils/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'GTgram - Share your moments',
  description: 'A social media platform for sharing photos and videos with friends',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gtgram-dark min-h-screen">
        <Providers>
          {children}
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
} 