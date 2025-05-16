'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import placeholders from '@/lib/placeholders';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const user = userCredential.user;
      
      // 2. Update profile with username
      await updateProfile(user, {
        displayName: fullName,
        photoURL: placeholders.avatar
      });
      
      // 3. Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        fullName,
        email,
        photoURL: placeholders.avatar,
        bio: '',
        followers: [],
        following: [],
        joinedAt: serverTimestamp(),
      });
      
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
      const user = userCredential.user;
      
      // Check if user already exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      
      // Create a username from display name or email
      const defaultUsername = user.displayName 
        ? user.displayName.toLowerCase().replace(/\s+/g, '_')
        : user.email?.split('@')[0];
      
      // Create user document in Firestore
      await setDoc(userDocRef, {
        uid: user.uid,
        username: defaultUsername,
        fullName: user.displayName || defaultUsername,
        email: user.email,
        photoURL: user.photoURL || placeholders.avatar,
        bio: '',
        followers: [],
        following: [],
        joinedAt: serverTimestamp(),
      }, { merge: true });
      
      router.push('/home');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-[#121212] rounded-lg border border-[#262626]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">GTgram</h1>
          <p className="text-gray-400">Sign up to see photos and videos from your friends</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-white p-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleRegister}
          className="flex items-center justify-center w-full py-2 px-4 rounded-lg border border-[#262626] hover:bg-[#262626] transition duration-200"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-[#262626]" />
          <span className="px-4 text-gray-400">OR</span>
          <hr className="flex-grow border-[#262626]" />
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#0095F6] text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-blue-600 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-[#262626]">
          <p>
            Have an account?{' '}
            <Link href="/login" className="text-[#0095F6]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 