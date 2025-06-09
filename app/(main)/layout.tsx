'use client';

import { useEffect, useState } from 'react';
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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Protect routes by redirecting to login if not authenticated
  useEffect(() => {
    // Only check auth after loading is complete and we haven't checked yet
    if (!isLoading) {
      // Add a small delay to ensure auth state has fully propagated
      const timeoutId = setTimeout(() => {
        if (!user && !hasCheckedAuth) {
          setHasCheckedAuth(true);
          router.push('/login');
        } else if (user) {
          setHasCheckedAuth(true);
        }
      }, 100); // Small delay to prevent race conditions

      return () => clearTimeout(timeoutId);
    }
  }, [user, isLoading, router, hasCheckedAuth]);

  // Show loading indicator while checking auth
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green"></div>
      </div>
    );
  }

  // If not authenticated after checking, don't render anything
  // (redirect will happen thanks to the useEffect above)
  if (!user) {
    return null;
  }

  // Render the embedded layout without navigation if authenticated
  return <EmbeddedLayout>{children}</EmbeddedLayout>;
} 