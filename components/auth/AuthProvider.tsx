'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import placeholders from '@/lib/placeholders';

// Define a custom extended user type that can include Firestore fields
interface EnhancedUser extends User {
  firestorePhotoURL?: string;
}

// Define the auth context type
type AuthContextType = {
  user: EnhancedUser | null;
  isLoading: boolean;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Listen for auth state changes
  useEffect(() => {
    let isMounted = true;
    
    const handleAuthStateChange = async (authUser: User | null) => {
      try {
        if (!isMounted) return;
        
        if (authUser) {
          console.log('Auth user from onAuthStateChanged:', {
            uid: authUser.uid,
            displayName: authUser.displayName,
            email: authUser.email,
            photoURL: authUser.photoURL
          });
          
          try {
            const userDoc = doc(db, 'users', authUser.uid);
            const userSnap = await getDoc(userDoc);
            
            if (!userSnap.exists()) {
              const username = authUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 
                            authUser.email?.split('@')[0] || 
                            `user_${Math.random().toString(36).substring(2, 8)}`;
              
              const newUserData = {
                uid: authUser.uid,
                email: authUser.email,
                username: username,
                displayName: authUser.displayName || username,
                photoURL: authUser.photoURL || placeholders.avatar, // Fallback for new user doc
                bio: '',
                followers: [],
                following: [],
                joinedAt: serverTimestamp(),
              };
              await setDoc(userDoc, newUserData);
              
              // For a brand new user, their authUser might not have photoURL yet.
              // The photoURL in newUserData (which goes to Firestore) will use placeholder if authUser.photoURL is null.
              // So, construct the initial enhancedUser with this potentially placeholder URL.
              const initialEnhancedUser: EnhancedUser = {
                ...authUser,
                photoURL: newUserData.photoURL, // Use the photoURL we just decided for Firestore
                firestorePhotoURL: newUserData.photoURL
              };
              console.log('New user created in Firestore. Enhanced user for context:', initialEnhancedUser);
              setUser(initialEnhancedUser);
            } else {
              const userData = userSnap.data();
              console.log('Existing Firestore user data:', userData);

              const authUserPhoto = authUser.photoURL;
              const firestoreUserPhoto = userData.photoURL;

              let determinedPhotoURL = placeholders.avatar; // Ultimate fallback

              if (firestoreUserPhoto) {
                determinedPhotoURL = firestoreUserPhoto;
                console.log('Using Firestore photoURL as primary:', firestoreUserPhoto);
              } else if (authUserPhoto) {
                determinedPhotoURL = authUserPhoto;
                console.log('No Firestore photoURL, using Auth photoURL as fallback:', authUserPhoto);
              } else {
                console.log('No Firestore or Auth photoURL, using default placeholder avatar.');
              }
              
              const enhancedUser: EnhancedUser = {
                ...authUser,
                photoURL: determinedPhotoURL,
                firestorePhotoURL: firestoreUserPhoto || undefined 
              };

              console.log('AuthProvider - Determined photoURL for existing user:', determinedPhotoURL);
              console.log('AuthProvider - Enhanced user for context (existing user):', enhancedUser);
              setUser(enhancedUser);
            }
          } catch (firestoreError) {
            console.error('Firestore operation error:', firestoreError);
            // Fallback to authUser if Firestore fails, ensuring photoURL is at least authUser's or null
            const fallbackEnhancedUser: EnhancedUser = {
                ...authUser,
                photoURL: authUser.photoURL || placeholders.avatar // Ensure photoURL is not undefined
            };
            setUser(fallbackEnhancedUser);
            console.warn('Falling back to authUser due to Firestore error. User for context:', fallbackEnhancedUser);
          }
        } else {
          setUser(null);
          console.log('No auth user, context user set to null.');
        }
      } catch (error) {
        console.error('Auth state handling error:', error);
        if (authUser) {
            const errorFallbackUser: EnhancedUser = {
                ...authUser,
                photoURL: authUser.photoURL || placeholders.avatar
            };
            setUser(errorFallbackUser);
            console.warn('Falling back to authUser due to general error. User for context:', errorFallbackUser);
        } else {
            setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
} 