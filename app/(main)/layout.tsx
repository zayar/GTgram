'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import EmbeddedLayout from '@/components/layout/EmbeddedLayout';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Protect routes by redirecting to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green"></div>
      </div>
    );
  }

  // If not authenticated and not loading, don't render anything
  // (redirect will happen thanks to the useEffect above)
  if (!user) {
    return null;
  }

  // Render the embedded layout without navigation if authenticated
  return <EmbeddedLayout>{children}</EmbeddedLayout>;
} 