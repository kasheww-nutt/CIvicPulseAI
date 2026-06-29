import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  demoLogin: (customEmail?: string, customName?: string, customRole?: 'citizen' | 'steward' | 'admin') => void;
  signOut: () => Promise<void>;
  language: string;
  setLanguage: (lang: string) => void;
  dbRole: 'citizen' | 'steward' | 'admin' | null;
  setDbRole: (role: 'citizen' | 'steward' | 'admin') => Promise<void>;
  activePortal: 'citizen' | 'steward' | 'admin' | null;
  setActivePortal: (portal: 'citizen' | 'steward' | 'admin' | null) => void;
  updateProfileData: (displayName: string, photoURL: string | null) => Promise<void>;
  updateEmailAddress: (email: string) => Promise<void>;
  updatePasswordValue: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [dbRole, setDbRoleState] = useState<'citizen' | 'steward' | 'admin' | null>(null);
  const [activePortal, setActivePortal] = useState<'citizen' | 'steward' | 'admin' | null>(null);

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

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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
    setActivePortal(customRole);
  };

  const signOut = async () => {
    setActivePortal(null);
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

  const updateProfileData = async (displayName: string, photoURL: string | null) => {
    if (!user) return;
    if (user.uid.startsWith('demo-user-')) {
      setUser(prev => prev ? { ...prev, displayName, photoURL } as User : null);
    } else {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(auth.currentUser!, { displayName, photoURL });
      await setDoc(doc(db, 'users', user.uid), { displayName, photoURL }, { merge: true });
      setUser({
        ...auth.currentUser!,
        displayName,
        photoURL
      } as User);
    }
  };

  const updateEmailAddress = async (email: string) => {
    if (!user) return;
    if (user.uid.startsWith('demo-user-')) {
      setUser(prev => prev ? { ...prev, email } as User : null);
    } else {
      const { updateEmail } = await import('firebase/auth');
      await updateEmail(auth.currentUser!, email);
      await setDoc(doc(db, 'users', user.uid), { email }, { merge: true });
      setUser({
        ...auth.currentUser!,
        email
      } as User);
    }
  };

  const updatePasswordValue = async (password: string) => {
    if (!user) return;
    if (user.uid.startsWith('demo-user-')) {
      // Demo password change
    } else {
      const { updatePassword } = await import('firebase/auth');
      await updatePassword(auth.currentUser!, password);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, demoLogin, signOut, language, setLanguage, dbRole, setDbRole, activePortal, setActivePortal,
      updateProfileData, updateEmailAddress, updatePasswordValue
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
