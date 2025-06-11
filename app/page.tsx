'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        console.log('Root page: User exists, redirecting to /home');
        router.push('/home');
      } else {
        console.log('Root page: No user, redirecting to /login');
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show loading screen while checking auth state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold font-cursive mb-4">GTgram</h1>
      </div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      <p className="mt-4 text-sm text-gray-300">Loading...</p>
    </div>
  );
} 