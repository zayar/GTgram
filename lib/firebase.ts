import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1T3Lr07V9z48ovR5goSDcF9hN8fYOv28",
  authDomain: "gtgram-7da22.firebaseapp.com",
  projectId: "gtgram-7da22",
  storageBucket: "gtgram-7da22.firebasestorage.app",
  messagingSenderId: "954656485979",
  appId: "1:954656485979:web:fc2d007dd8f6be15e1457e",
  measurementId: "G-F5E4C8NB0Z",
  databaseURL: "https://gtgram-7da22-default-rtdb.firebaseio.com"
};

// Initialize Firebase safely with error handling
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let realtimeDb: Database | null = null;

try {
  // Initialize Firebase - prevent multiple instances
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Only initialize realtime DB on client
  if (typeof window !== 'undefined') {
    realtimeDb = getDatabase(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Initialize with empty instances as fallback
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

// Initialize analytics only on the client side
let analytics = null;
if (typeof window !== 'undefined') {
  // Check if analytics is supported
  isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}

export { app, auth, db, storage, realtimeDb, analytics }; 