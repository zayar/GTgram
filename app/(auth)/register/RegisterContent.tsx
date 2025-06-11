'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import placeholders from '@/lib/placeholders';
import { useAuth } from '@/components/auth/AuthProvider';
import { createCleanUserObject } from '@/lib/utils/userValidation';

export default function RegisterContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    console.log('Register page useEffect triggered:', { user: !!user, isLoading, userUid: user?.uid });
    
    if (!isLoading && user) {
      console.log('User is already logged in, redirecting to home...', user.uid);
      setTimeout(() => {
        router.push('/home');
      }, 100);
    }
  }, [user, isLoading, router]);

  // Handle prefill data from query parameters
  useEffect(() => {
    if (!searchParams) return;

    const prefillEmail = searchParams.get('email');
    const prefillFullName = searchParams.get('fullName') || searchParams.get('name');
    const prefillUsername = searchParams.get('username');
    const referralCode = searchParams.get('ref');
    const source = searchParams.get('source');

    if (prefillEmail || prefillFullName || prefillUsername) {
      if (prefillEmail) setEmail(prefillEmail);
      if (prefillFullName) setFullName(prefillFullName);
      if (prefillUsername) setUsername(prefillUsername);
      
      let message = 'Form pre-filled';
      if (source) {
        message += ` from ${source}`;
      }
      if (referralCode) {
        message += ` with referral code: ${referralCode}`;
      }
      setPrefillMessage(message);
      
      // Clear message after 5 seconds
      setTimeout(() => setPrefillMessage(''), 5000);
    }
  }, [searchParams]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // 1. Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // 2. Update profile with username
      await updateProfile(firebaseUser, {
        displayName: fullName,
        photoURL: placeholders.avatar
      });
      
      // 3. Prepare user data
      const userData: any = {
        uid: firebaseUser.uid,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        fullName,
        email,
        phoneNumber: null,
        photoURL: placeholders.avatar,
        bio: '',
        followers: [],
        following: [],
        joinedAt: serverTimestamp(),
      };

      // 4. Add referral information if present
      const referralCode = searchParams?.get('ref');
      const source = searchParams?.get('source');
      if (referralCode) {
        userData.referredBy = referralCode;
        userData.referralSource = source || 'unknown';
        userData.referralProcessedAt = serverTimestamp();
      }
      
      // 5. Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // 6. Create user object for localStorage (similar structure to login)
      const userForStorage = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: placeholders.avatar,
        // Add Firestore data
        username: userData.username,
        fullName: userData.fullName,
        bio: userData.bio,
        followers: userData.followers,
        following: userData.following,
        // Add Firebase User methods and properties that might be needed
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber,
        providerId: firebaseUser.providerId,
        metadata: firebaseUser.metadata,
        providerData: firebaseUser.providerData,
        refreshToken: firebaseUser.refreshToken,
        tenantId: firebaseUser.tenantId,
        // Add methods as needed
        delete: firebaseUser.delete.bind(firebaseUser),
        getIdToken: firebaseUser.getIdToken.bind(firebaseUser),
        getIdTokenResult: firebaseUser.getIdTokenResult.bind(firebaseUser),
        reload: firebaseUser.reload.bind(firebaseUser),
        toJSON: firebaseUser.toJSON.bind(firebaseUser)
      };

      // 7. Use the new login method from AuthProvider
      login(userForStorage);
      
      router.push('/home');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      
      // Check if user already exists in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      // Create a username from display name or email
      const defaultUsername = firebaseUser.displayName 
        ? firebaseUser.displayName.toLowerCase().replace(/\s+/g, '_')
        : firebaseUser.email?.split('@')[0];
      
      // Prepare user data
      const userData: any = {
        uid: firebaseUser.uid,
        username: defaultUsername,
        fullName: firebaseUser.displayName || defaultUsername,
        email: firebaseUser.email,
        phoneNumber: null,
        photoURL: firebaseUser.photoURL || placeholders.avatar,
        bio: '',
        followers: [],
        following: [],
        joinedAt: serverTimestamp(),
      };

      // Add referral information if present
      const referralCode = searchParams?.get('ref');
      const source = searchParams?.get('source');
      if (referralCode) {
        userData.referredBy = referralCode;
        userData.referralSource = source || 'unknown';
        userData.referralProcessedAt = serverTimestamp();
      }
      
      // Create user document in Firestore
      await setDoc(userDocRef, userData, { merge: true });
      
      // Create user object for localStorage
      const userForStorage = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: userData.photoURL,
        // Add Firestore data
        username: userData.username,
        fullName: userData.fullName,
        bio: userData.bio,
        followers: userData.followers,
        following: userData.following,
        // Add Firebase User methods and properties that might be needed
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber,
        providerId: firebaseUser.providerId,
        metadata: firebaseUser.metadata,
        providerData: firebaseUser.providerData,
        refreshToken: firebaseUser.refreshToken,
        tenantId: firebaseUser.tenantId,
        // Add methods as needed
        delete: firebaseUser.delete.bind(firebaseUser),
        getIdToken: firebaseUser.getIdToken.bind(firebaseUser),
        getIdTokenResult: firebaseUser.getIdTokenResult.bind(firebaseUser),
        reload: firebaseUser.reload.bind(firebaseUser),
        toJSON: firebaseUser.toJSON.bind(firebaseUser)
      };

      // Use the new login method from AuthProvider
      login(userForStorage);
      
      router.push('/home');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gtgram-white px-2 sm:px-4">
      <div className="w-full max-w-md p-4 sm:p-8 space-y-6 sm:space-y-8 bg-gtgram-offwhite rounded-lg border border-gtgram-gray shadow-md">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gtgram-green">GTgram</h1>
          <p className="text-gtgram-dark text-sm sm:text-base">Sign up to see photos and videos from your friends</p>
        </div>

        {/* Prefill notification */}
        {prefillMessage && (
          <div className="bg-blue-100 border border-blue-500 text-blue-700 p-3 rounded text-sm">
            ℹ️ {prefillMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-500 text-red-700 p-3 rounded text-sm break-words">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleRegister}
          className="flex items-center justify-center w-full py-2 px-4 rounded-lg border border-gtgram-gray bg-white hover:bg-gtgram-offwhite transition duration-200 text-sm sm:text-base"
          disabled={loading}
        >
          <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 sm:w-[18px] sm:h-[18px]">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-gtgram-gray" />
          <span className="px-4 text-gtgram-dark text-sm sm:text-base">OR</span>
          <hr className="flex-grow border-gtgram-gray" />
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-4 sm:space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border border-gtgram-gray text-gtgram-dark rounded-lg p-3 w-full focus:outline-none focus:border-gtgram-gold text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-white border border-gtgram-gray text-gtgram-dark rounded-lg p-3 w-full focus:outline-none focus:border-gtgram-gold text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white border border-gtgram-gray text-gtgram-dark rounded-lg p-3 w-full focus:outline-none focus:border-gtgram-gold text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white border border-gtgram-gray text-gtgram-dark rounded-lg p-3 w-full focus:outline-none focus:border-gtgram-gold text-sm sm:text-base"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-gtgram-green text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-gtgram-light-green transition duration-200 text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gtgram-gray">
          <p className="text-sm sm:text-base">
            Have an account?{' '}
            <Link href="/login" className="text-gtgram-gold hover:text-gtgram-light-gold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 