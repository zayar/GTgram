'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import placeholders from '@/lib/placeholders';
import { createCleanUserObject } from '@/lib/utils/userValidation';

interface AutoActionProps {
  children: React.ReactNode;
}

export default function AutoAction({ children }: AutoActionProps) {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (isLoading || !searchParams) return;

    const processAutoActions = async () => {
      // Extract minimal query parameters
      const name = searchParams.get('name');
      const phone = searchParams.get('phone');
      const uid = searchParams.get('uid');
      const redirect = searchParams.get('redirect');

      // If no required parameters, skip processing
      if (!name && !phone && !uid) {
        return;
      }

      setIsProcessing(true);
      setActionMessage('Processing user data...');

      try {
        // Handle user creation/verification
        if (uid) {
          await handleUserCreation({ uid, name, phone, redirect });
        } else {
          setActionMessage('UID is required for user operations');
          setTimeout(() => setActionMessage(''), 3000);
        }

      } catch (error) {
        console.error('Auto action error:', error);
        setActionMessage('Failed to process user data');
        setTimeout(() => setActionMessage(''), 3000);
      } finally {
        setIsProcessing(false);
        // Clear query parameters immediately after processing completes
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
      }
    };

    processAutoActions();
  }, [searchParams, isLoading]);

  const handleUserCreation = async (params: any) => {
    const { uid, name, phone, redirect } = params;

    console.log('AutoAction: handleUserCreation called with params:', { uid, name, phone, redirect });

    try {
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log('AutoAction: Firestore user document exists:', userDoc.exists());
      
      if (!userDoc.exists()) {
        console.log('AutoAction: Creating new user path');
        // User doesn't exist, create new user
        setActionMessage('Creating new user...');
        
        const userData = {
          uid: uid,
          fullName: name || 'Unknown User',
          phoneNumber: phone || null,
          email: null,
          username: name ? name.toLowerCase().replace(/\s+/g, '_') : `user_${uid.substring(0, 8)}`,
          photoURL: placeholders.avatar,
          bio: '',
          followers: [],
          following: [],
          joinedAt: serverTimestamp(),
          createdVia: 'auto_action'
        };

        // Create user document in Firestore
        await setDoc(doc(db, 'users', uid), userData);
        
        setActionMessage('User created successfully!');
        console.log('New user created:', userData);

        // Auto-login the newly created user
        const userForLogin = createCleanUserObject({
          uid: uid,
          email: null,
          displayName: userData.fullName,
          photoURL: userData.photoURL,
          username: userData.username,
          fullName: userData.fullName,
          bio: userData.bio,
          followers: userData.followers,
          following: userData.following,
          phoneNumber: userData.phoneNumber,
          emailVerified: false,
          providerId: 'auto_action',
          metadata: { 
            creationTime: new Date().toISOString(), 
            lastSignInTime: new Date().toISOString() 
          },
          createdVia: 'auto_action'
        });

        if (userForLogin) {
          console.log('AutoAction: Creating clean userForLogin object:', userForLogin);
          console.log('AutoAction: userForLogin keys:', Object.keys(userForLogin));
          console.log('AutoAction: userForLogin.uid:', userForLogin.uid);
          console.log('AutoAction: About to call login function...');
          
          login(userForLogin);
          
          console.log('AutoAction: Login function called successfully');
          
          // Immediate redirect after successful login
          console.log('AutoAction: New user logged in successfully, redirecting to home...');
          setTimeout(() => {
            setActionMessage('');
            // Only redirect if not already on home page
            if (window.location.pathname !== '/home') {
              console.log('AutoAction: Redirecting to home from:', window.location.pathname);
              window.location.href = '/home';
            } else {
              console.log('AutoAction: Already on home page, no redirect needed');
            }
          }, 1000);
          
          return; // Exit early to avoid the complex redirect logic below
        } else {
          console.error('AutoAction: Failed to create clean user object');
        }
        
        // Check if we're on login/register page - let those pages handle their own redirects
        const isOnAuthPage = window.location.pathname === '/' || 
                            window.location.pathname === '/login' || 
                            window.location.pathname === '/register';
        
        console.log('AutoAction: Current pathname:', window.location.pathname);
        console.log('AutoAction: isOnAuthPage:', isOnAuthPage);
        
        if (isOnAuthPage) {
          // For root page, redirect immediately to home after login
          if (window.location.pathname === '/') {
            console.log('AutoAction: On root page, redirecting to home immediately');
            setTimeout(() => {
              console.log('AutoAction: Executing redirect to /home');
              setActionMessage('');
              // Use window.location for more reliable redirect
              window.location.href = '/home';
            }, 500);
          } else {
            // For login/register pages, just clear the popup and let them handle redirect
            console.log('AutoAction: On auth page, clearing popup');
            setTimeout(() => {
              setActionMessage('');
            }, 1500);
          }
        } else {
          // We're on a different page, handle redirect ourselves
          setTimeout(() => {
            console.log('AutoAction: Redirecting new user to:', redirect || '/home');
            setActionMessage('');
            window.location.href = redirect || '/home';
          }, 1500);
        }

      } else {
        console.log('AutoAction: Existing user path');
        // User already exists, update local user with latest Firestore data
        console.log('User already exists, updating with latest data...');
        setActionMessage('Updating user data...');
        
        const existingUserData = userDoc.data();
        console.log('AutoAction: Existing user data from Firestore:', existingUserData);
        
        // Always update the local user with latest Firestore data
        const userForLogin = createCleanUserObject({
          uid: uid,
          email: existingUserData.email,
          displayName: existingUserData.fullName,
          photoURL: existingUserData.photoURL,
          username: existingUserData.username,
          fullName: existingUserData.fullName,
          bio: existingUserData.bio,
          followers: existingUserData.followers,
          following: existingUserData.following,
          phoneNumber: existingUserData.phoneNumber || phone,
          emailVerified: !!existingUserData.emailVerified,
          providerId: existingUserData.providerId || 'auto_action',
          metadata: { 
            creationTime: existingUserData.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          },
          createdVia: existingUserData.createdVia || 'manual'
        });

        if (userForLogin) {
          console.log('AutoAction: Updating local user with latest Firestore data:', userForLogin);
          console.log('AutoAction: About to call login function for existing user...');
          // Always update localStorage with latest data, even if user is already logged in
          login(userForLogin);
          console.log('AutoAction: Login function called successfully for existing user');
          setActionMessage('User data updated successfully!');
          
          // Immediate redirect after successful login update
          console.log('AutoAction: Existing user logged in successfully, redirecting to home...');
          setTimeout(() => {
            setActionMessage('');
            // Only redirect if not already on home page
            if (window.location.pathname !== '/home') {
              console.log('AutoAction: Redirecting to home from:', window.location.pathname);
              window.location.href = '/home';
            } else {
              console.log('AutoAction: Already on home page, no redirect needed');
            }
          }, 1000);
          
          return; // Exit early to avoid the complex redirect logic below
        } else {
          console.error('AutoAction: Failed to create clean user object for existing user');
          setActionMessage('Failed to update user data');
        }
      }

    } catch (error) {
      console.error('User creation error:', error);
      setActionMessage('Failed to create user');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  return (
    <>
      {children}
      
      {/* Auto Action Status Overlay */}
      {(isProcessing || actionMessage) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full text-center">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gtgram-green mx-auto mb-4"></div>
                <p className="text-gtgram-dark">Processing...</p>
              </>
            ) : (
              <>
                <div className="text-gtgram-green text-2xl mb-2">✓</div>
                <p className="text-gtgram-dark">{actionMessage}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 