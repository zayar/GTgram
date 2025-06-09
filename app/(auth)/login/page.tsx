'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      console.log('User is already logged in, redirecting to home...');
      router.push('/home');
    }
  }, [user, isLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.uid);
      // Don't manually redirect here - let the auth state change handle it
      // router.push('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(
        error.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : error.message
      );
      setLoading(false); // Only set loading to false on error
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google login successful:', result.user.uid);
      // Don't manually redirect here - let the auth state change handle it
      // router.push('/home');
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message);
      setLoading(false); // Only set loading to false on error
    }
  };

  // Show loading if checking auth or in the process of logging in
  if (isLoading || (user && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gtgram-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gtgram-green mx-auto mb-4"></div>
          <p className="text-gtgram-dark">
            {user ? 'Redirecting...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gtgram-white px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gtgram-offwhite rounded-lg border border-gtgram-gray shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gtgram-green">GTgram</h1>
          <p className="text-gtgram-dark">Login to see photos and videos from your friends</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-500 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border border-gtgram-gray text-gtgram-dark rounded-lg p-3 w-full focus:outline-none focus:border-gtgram-gold"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white border border-gtgram-gray text-gtgram-dark rounded-lg p-3 w-full focus:outline-none focus:border-gtgram-gold"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-gtgram-green text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-gtgram-light-green transition duration-200"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-gtgram-gray" />
          <span className="px-4 text-gtgram-dark">OR</span>
          <hr className="flex-grow border-gtgram-gray" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full py-2 px-4 rounded-lg border border-gtgram-gray bg-white hover:bg-gtgram-offwhite transition duration-200"
          disabled={loading}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          Continue with Google
        </button>

        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-gtgram-green hover:text-gtgram-light-green">
            Forgot password?
          </Link>
        </div>

        <div className="text-center pt-4 border-t border-gtgram-gray">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-gtgram-gold hover:text-gtgram-light-gold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 