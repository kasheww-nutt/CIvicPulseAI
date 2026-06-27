import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0499069054",
  appId: "1:608148148817:web:82a7d819952930c9b6de70",
  apiKey: "AIzaSyC8meJYxZNjuzlGAh62T9VF0dHo9dYM-D8",
  authDomain: "gen-lang-client-0499069054.firebaseapp.com",
  storageBucket: "gen-lang-client-0499069054.firebasestorage.app",
  messagingSenderId: "608148148817",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, "ai-studio-civicpulseai-85d7672b-dd22-4c42-a32e-dd3970a78ff8");

export const googleProvider = new GoogleAuthProvider();
