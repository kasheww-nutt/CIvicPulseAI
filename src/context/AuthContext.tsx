import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  demoLogin: (customEmail?: string, customName?: string, customRole?: 'citizen' | 'steward' | 'admin') => void;
  signOut: () => Promise<void>;
  language: string;
  setLanguage: (lang: string) => void;
  dbRole: 'citizen' | 'steward' | 'admin' | null;
  setDbRole: (role: 'citizen' | 'steward' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [dbRole, setDbRoleState] = useState<'citizen' | 'steward' | 'admin' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.uid.startsWith('demo-user-')) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setDbRoleState(userDoc.data().role as any || 'citizen');
          } else {
            await setDoc(doc(db, 'users', currentUser.uid), {
              email: currentUser.email,
              role: 'citizen',
              createdAt: new Date().toISOString()
            });
            setDbRoleState('citizen');
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          setDbRoleState('citizen');
        }
      } else if (currentUser && currentUser.uid.startsWith('demo-user-')) {
        setDbRoleState('citizen'); // default demo role
      } else {
        setDbRoleState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const demoLogin = (customEmail?: string, customName?: string, customRole: 'citizen' | 'steward' | 'admin' = 'citizen') => {
    setUser({
      uid: 'demo-user-' + (customName || '123'),
      email: customEmail || 'demo@civicpulse.ai',
      displayName: customName || 'Demo Citizen',
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
    } as User);
    setDbRoleState(customRole);
  };

  const signOut = async () => {
    if (user?.uid && user.uid.startsWith('demo-user-')) {
      setUser(null);
      setDbRoleState(null);
      return;
    }
    await firebaseSignOut(auth);
  };

  const setDbRole = async (role: 'citizen' | 'steward' | 'admin') => {
    if (user && !user.uid.startsWith('demo-user-')) {
      try {
        await setDoc(doc(db, 'users', user.uid), { role }, { merge: true });
      } catch (e) {
        console.error("Failed to update role in DB", e);
      }
    }
    setDbRoleState(role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, demoLogin, signOut, language, setLanguage, dbRole, setDbRole
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
