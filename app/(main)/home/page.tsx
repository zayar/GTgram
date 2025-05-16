'use client';

import { useEffect, useState, Suspense } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MainLayout from '@/components/layout/MainLayout';
import dynamic from 'next/dynamic';

// Dynamic imports for components with loading states
const StoryBar = dynamic(() => import('@/components/post/StoryBar'), {
  loading: () => (
    <div className="h-24 bg-white rounded-lg mb-4 animate-pulse"></div>
  ),
  ssr: false
});

const Feed = dynamic(() => import('@/components/post/Feed'), {
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gtgram-green"></div>
    </div>
  ),
  ssr: false // Disable server-side rendering for this component
});

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <MainLayout>
      <div className="max-w-xl mx-auto">
        <Suspense fallback={<div className="h-24 bg-white rounded-lg mb-4 animate-pulse"></div>}>
          <StoryBar />
        </Suspense>
        
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gtgram-green"></div>
          </div>
        }>
          <Feed />
        </Suspense>
      </div>
    </MainLayout>
  );
} 