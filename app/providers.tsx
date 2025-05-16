'use client';

import { useState, useEffect } from 'react';
import AuthProvider from '@/components/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { reportWebVitals } from '@/utils/webVitals';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client with cache configuration
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
        refetchOnWindowFocus: false,
      },
    },
  }));
  
  // Initialize web vitals tracking
  useEffect(() => {
    // Report initial page load web vitals
    reportWebVitals();
    
    // Set up navigation observer for SPA navigation
    const handleRouteChange = () => {
      reportWebVitals();
    };

    // For Next.js App Router, listen to route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
} 