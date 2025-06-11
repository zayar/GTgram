'use client';

import { Suspense } from 'react';
import RegisterContent from './RegisterContent';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gtgram-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green mx-auto mb-4"></div>
          <p className="text-gtgram-dark">Loading...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
} 