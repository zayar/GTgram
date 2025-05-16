'use client';

import { useState } from 'react';
import { 
  auth, 
  db, 
  storage,
  realtimeDb 
} from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  limit, 
  serverTimestamp,
  doc, 
  setDoc 
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  uploadString, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  ref as rtdbRef, 
  set, 
  get 
} from 'firebase/database';

// Define result type
interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

// Define results state type
interface ResultsState {
  [key: string]: TestResult;
}

// Define loading state type
interface LoadingState {
  [key: string]: boolean;
}

export default function TestFirebasePage() {
  const [results, setResults] = useState<ResultsState>({});
  const [isLoading, setIsLoading] = useState<LoadingState>({});
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Test123!');

  // Helper to update results
  const updateResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults(prev => ({
      ...prev,
      [test]: { success, message, data }
    }));
    setIsLoading(prev => ({
      ...prev,
      [test]: false
    }));
  };

  // Test Authentication
  const testAuth = async () => {
    setIsLoading(prev => ({ ...prev, auth: true }));
    try {
      // Try to create a test user
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        updateResult('auth', true, 'Successfully created test user');
      } catch (createError: any) {
        // If user already exists, try to sign in
        if (createError.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            updateResult('auth', true, 'Successfully signed in with test user', {
              uid: userCredential.user.uid,
              email: userCredential.user.email
            });
          } catch (signInError: any) {
            updateResult('auth', false, `Sign-in failed: ${signInError.message}`);
          }
        } else {
          updateResult('auth', false, `Creation failed: ${createError.message}`);
        }
      }
    } catch (error: any) {
      updateResult('auth', false, `Authentication test failed: ${error.message}`);
    }
  };

  // Test Firestore
  const testFirestore = async () => {
    setIsLoading(prev => ({ ...prev, firestore: true }));
    try {
      // Create a test document
      const testCollection = collection(db, 'test_collection');
      const docData = {
        text: 'Hello from GTgram',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(testCollection, docData);
      
      // Fetch the test document
      const querySnapshot = await getDocs(query(testCollection, limit(1)));
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      updateResult('firestore', true, `Firestore test successful. Created document with ID: ${docRef.id}`, documents);
    } catch (error: any) {
      updateResult('firestore', false, `Firestore test failed: ${error.message}`);
    }
  };

  // Test Storage
  const testStorage = async () => {
    setIsLoading(prev => ({ ...prev, storage: true }));
    try {
      // Create a test file in Storage
      const testImageRef = storageRef(storage, 'test-images/test.jpg');
      
      // Sample base64 image (a small red dot)
      const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AL+AD/9k=';
      
      // Upload image
      await uploadString(testImageRef, base64Image, 'data_url');
      
      // Get the download URL
      const downloadURL = await getDownloadURL(testImageRef);
      
      updateResult('storage', true, 'Storage test successful', { downloadURL });
    } catch (error: any) {
      updateResult('storage', false, `Storage test failed: ${error.message}`);
    }
  };

  // Test Realtime Database
  const testRealtimeDb = async () => {
    setIsLoading(prev => ({ ...prev, realtimeDb: true }));
    try {
      // Check if Realtime Database is initialized
      if (!realtimeDb) {
        throw new Error('Realtime Database is not initialized');
      }
      
      // Create a test entry
      const testRef = rtdbRef(realtimeDb, 'test');
      const testData = {
        message: 'Hello from GTgram',
        timestamp: Date.now()
      };
      
      await set(testRef, testData);
      
      // Read the data back
      const snapshot = await get(testRef);
      const data = snapshot.val();
      
      updateResult('realtimeDb', true, 'Realtime Database test successful', data);
    } catch (error: any) {
      updateResult('realtimeDb', false, `Realtime Database test failed: ${error.message}`);
    }
  };

  // Test All Services
  const testAllServices = async () => {
    await testAuth();
    await testFirestore();
    await testStorage();
    await testRealtimeDb();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Firebase Connection Tests</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-4">Test Credentials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#121212] border border-[#262626] text-white rounded-lg p-3 w-full focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <button
          onClick={testAuth}
          disabled={isLoading.auth}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition"
        >
          {isLoading.auth ? 'Testing Authentication...' : 'Test Authentication'}
        </button>
        
        <button
          onClick={testFirestore}
          disabled={isLoading.firestore}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition"
        >
          {isLoading.firestore ? 'Testing Firestore...' : 'Test Firestore'}
        </button>
        
        <button
          onClick={testStorage}
          disabled={isLoading.storage}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition"
        >
          {isLoading.storage ? 'Testing Storage...' : 'Test Storage'}
        </button>
        
        <button
          onClick={testRealtimeDb}
          disabled={isLoading.realtimeDb}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition"
        >
          {isLoading.realtimeDb ? 'Testing Realtime DB...' : 'Test Realtime Database'}
        </button>
      </div>
      
      <div className="mb-8">
        <button
          onClick={testAllServices}
          disabled={Object.values(isLoading).some(Boolean)}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition w-full"
        >
          Test All Services
        </button>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Test Results:</h2>
        
        {Object.entries(results).map(([service, result]) => (
          <div 
            key={service}
            className={`p-4 rounded-lg ${
              result.success ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'
            }`}
          >
            <h3 className="text-lg font-bold mb-2 capitalize">{service} Test</h3>
            <p className="mb-2">{result.message}</p>
            
            {result.data && (
              <div className="mt-2">
                <p className="text-sm text-gray-400 mb-1">Response Data:</p>
                <pre className="bg-black/50 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
        
        {Object.keys(results).length === 0 && (
          <p className="text-gray-400">No tests run yet. Click the buttons above to test Firebase services.</p>
        )}
      </div>
      
      <div className="mt-12 pt-8 border-t border-gray-800">
        <p className="text-sm text-gray-400">
          Note: These tests will create temporary data in your Firebase project. The test data is minimal and stored in separate test collections.
        </p>
      </div>
    </div>
  );
} 