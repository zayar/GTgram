'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  login: (userData: any) => void;
  logout: () => void;
  checkAutoLogin: () => Promise<boolean>;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  checkAutoLogin: async () => false,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check localStorage for saved user on component mount
  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if auto-login is enabled and user data exists in localStorage
      const autoLoginEnabled = localStorage.getItem('gtgram_auto_login') === 'true';
      const savedUserData = localStorage.getItem('gtgram_user');
      const loginTimestamp = localStorage.getItem('gtgram_login_time');
      
      if (!autoLoginEnabled || !savedUserData || !loginTimestamp) {
        console.log('Auto-login not available:', { autoLoginEnabled, hasUserData: !!savedUserData, hasTimestamp: !!loginTimestamp });
        setIsLoading(false);
        return false;
      }

      // Check if login is still valid (e.g., within 30 days)
      const loginTime = parseInt(loginTimestamp);
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      if (now - loginTime > thirtyDaysInMs) {
        console.log('Saved login expired, clearing localStorage');
        clearLocalStorage();
        setIsLoading(false);
        return false;
      }

      // Parse saved user data
      let userData;
      try {
        userData = JSON.parse(savedUserData);
      } catch (parseError) {
        console.error('Failed to parse saved user data:', parseError);
        clearLocalStorage();
        setIsLoading(false);
        return false;
      }

      console.log('Auto-login: Found saved user data:', userData);
      console.log('User data keys:', Object.keys(userData || {}));
      console.log('User data uid:', userData?.uid);
      console.log('User data type:', typeof userData);

      // Validate that userData has required properties
      if (!userData || typeof userData !== 'object' || !userData.uid || typeof userData.uid !== 'string') {
        console.error('Invalid saved user data - missing or invalid uid:', userData);
        console.error('Validation details:', {
          hasUserData: !!userData,
          isObject: typeof userData === 'object',
          hasUid: !!userData?.uid,
          uidType: typeof userData?.uid,
          objectKeys: userData ? Object.keys(userData) : []
        });
        clearLocalStorage();
        setIsLoading(false);
        return false;
      }

      // Optionally verify with Firestore (recommended for security)
      try {
        const userDoc = await getDoc(doc(db, 'users', userData.uid));
        if (!userDoc.exists()) {
          console.log('User no longer exists in Firestore, clearing localStorage');
          clearLocalStorage();
          setIsLoading(false);
          return false;
        }
        
        // Update with latest Firestore data
        const firestoreData = userDoc.data();
        const enhancedUser: EnhancedUser = {
          ...userData,
          photoURL: firestoreData.photoURL || userData.photoURL || placeholders.avatar,
          firestorePhotoURL: firestoreData.photoURL
        };
        
        setUser(enhancedUser);
        console.log('Auto-login successful:', enhancedUser);
        setIsLoading(false);
        return true;
      } catch (firestoreError) {
        console.error('Firestore verification failed during auto-login:', firestoreError);
        // Don't allow login with invalid user data
        clearLocalStorage();
        setUser(null);
        setIsLoading(false);
        return false;
      }
      
    } catch (error) {
      console.error('Auto-login error:', error);
      clearLocalStorage();
      setIsLoading(false);
      return false;
    }
  };

  const login = (userData: any) => {
    try {
      console.log('Manual login with userData:', userData);
      console.log('Login user data keys:', Object.keys(userData || {}));
      console.log('Login user data uid:', userData?.uid);
      
      // Validate userData has required properties
      if (!userData || !userData.uid || typeof userData.uid !== 'string' || userData.uid.length === 0) {
        console.error('Invalid user data provided to login:', userData);
        console.error('Login validation failed:', {
          hasUserData: !!userData,
          hasUid: !!userData?.uid,
          uidType: typeof userData?.uid,
          uidLength: userData?.uid?.length || 0,
          objectKeys: userData ? Object.keys(userData) : []
        });
        return;
      }
      
      // Create enhanced user object
      const enhancedUser: EnhancedUser = {
        ...userData,
        photoURL: userData.photoURL || placeholders.avatar,
        firestorePhotoURL: userData.photoURL
      };

      console.log('Enhanced user object created:', enhancedUser);
      console.log('Enhanced user keys:', Object.keys(enhancedUser));

      // Save to state first
      setUser(enhancedUser);
      setIsLoading(false); // Ensure loading is set to false

      // Save to localStorage for persistence
      const userDataToSave = JSON.stringify(enhancedUser);
      console.log('Saving to localStorage:', userDataToSave);
      
      localStorage.setItem('gtgram_user', userDataToSave);
      localStorage.setItem('gtgram_login_time', Date.now().toString());
      localStorage.setItem('gtgram_auto_login', 'true');

      console.log('User logged in and saved to localStorage. isLoading:', false);
      
    } catch (error) {
      console.error('Login save error:', error);
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      console.log('Logging out user');
      
      // Clear state
      setUser(null);
      
      // Clear localStorage
      clearLocalStorage();
      
      // Sign out from Firebase (optional, for complete cleanup)
      auth.signOut().catch(console.error);
      
      // Redirect to login page
      router.push('/login');
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('gtgram_user');
    localStorage.removeItem('gtgram_login_time');
    localStorage.removeItem('gtgram_auto_login');
    localStorage.removeItem('pendingAutoAction'); // Clear any pending actions
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      checkAutoLogin 
    }}>
      {children}
    </AuthContext.Provider>
  );
} 