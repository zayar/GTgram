'use client';

import { useEffect } from 'react';

export default function ClearStorage() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Debug localStorage contents
      if (urlParams.get('debugStorage') === 'true') {
        console.log('=== localStorage Debug ===');
        console.log('gtgram_user:', localStorage.getItem('gtgram_user'));
        console.log('gtgram_login_time:', localStorage.getItem('gtgram_login_time'));
        console.log('gtgram_auto_login:', localStorage.getItem('gtgram_auto_login'));
        
        const userData = localStorage.getItem('gtgram_user');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            console.log('Parsed user data:', parsed);
            console.log('User data keys:', Object.keys(parsed || {}));
            console.log('User data uid:', parsed?.uid);
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }
        console.log('=== End Debug ===');
        
        // Remove the parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
      
      if (urlParams.get('clearStorage') === 'true') {
        console.log('Clearing localStorage...');
        localStorage.removeItem('gtgram_user');
        localStorage.removeItem('gtgram_login_time');
        localStorage.removeItem('gtgram_auto_login');
        localStorage.removeItem('pendingAutoAction');
        console.log('localStorage cleared');
        // Remove the parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
        // Reload the page to reset the app state
        window.location.reload();
      }
    }
  }, []);

  return null;
} 