'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import MainLayout from '@/components/layout/MainLayout';

// Dynamically import the CreatePostForm component
const CreatePostForm = lazy(() => import('./CreatePostForm'));

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <Suspense fallback={
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green mx-auto mb-4"></div>
            <p className="text-gtgram-dark">Loading form...</p>
          </div>
        </div>
      }>
        <CreatePostForm />
      </Suspense>
    </MainLayout>
  );
} 