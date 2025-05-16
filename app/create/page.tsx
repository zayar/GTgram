'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new create-post path to avoid route conflicts
    router.replace('/create-post');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gtgram-green"></div>
    </div>
  );
} 