import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, X, ArrowRight, Shield, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../context/DemoContext';
import { getErrorMessage } from '../../lib/errorMapping';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface RoleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'steward' | 'admin';
}

export function RoleAuthModal({ isOpen, onClose, role }: RoleAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setRole } = useDemo();
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (password === 'pass123') {
        let targetRole: 'admin' | 'steward' | 'citizen' | null = null;
        if (email === 'admin@civicpulse.ai') targetRole = 'admin';
        else if (email === 'steward@civicpulse.ai') targetRole = 'steward';
        else if (email === 'demo@civicpulse.ai') targetRole = 'citizen';

        if (!targetRole) {
          throw new Error('Invalid demo credentials.');
        }

        if (role !== targetRole) {
          throw new Error(`Unauthorized: This credential is not valid for the ${role} portal. It belongs to the ${targetRole} portal.`);
        }

        demoLogin(email, `Demo ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}`, targetRole);
        setRole(targetRole);
        navigate('/dashboard');
        onClose();
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      const userData = userDoc.data();
      const userDbRole = userData?.role || 'citizen';
      
      if (role !== userDbRole) {
        throw new Error(`Unauthorized: This account does not have ${role} access. It has ${userDbRole} access.`);
      }

      setRole(role);
      navigate('/dashboard');
      onClose();
    } catch (err: any) {
      setError(err.message || getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] shadow-2xl pointer-events-auto overflow-hidden relative border border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <div className="p-5 flex items-start justify-between border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.03] dark:bg-blue-400/[0.03] rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {role === 'steward' ? (
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <LayoutDashboard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    )}
                    <h2 className="text-lg font-black text-[#0a1930] dark:text-white tracking-tight">
                      {role === 'steward' ? 'Steward Access' : 'Admin Access'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sign in with your authorized {role} account to continue.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs mb-4 border border-red-100 dark:border-red-900/50">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm transition-all"
                        placeholder="admin@civicpulse.ai"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm transition-all"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl text-white text-sm font-bold tracking-wide flex items-center justify-center gap-2 mt-2 disabled:opacity-70 transition-all shadow-md"
                    style={{
                      background: role === 'steward'
                        ? "linear-gradient(90deg, #065f46 0%, #10b981 100%)"
                        : "linear-gradient(90deg, #92400e 0%, #f59e0b 100%)"
                    }}
                  >
                    {isLoading ? 'Authenticating...' : 'Sign In to Proceed'}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[9px] font-bold tracking-widest uppercase text-slate-400">
                    <span className="px-2 bg-white dark:bg-slate-900">OR QUICK ACCESS</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      setError('');
                      try {
                        const { signInWithPopup } = await import('firebase/auth');
                        const { googleProvider } = await import('../../lib/firebase');
                        const prevUser = auth.currentUser;
                        const userCred = await signInWithPopup(auth, googleProvider);
                        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
                        const userData = userDoc.data();
                        const userDbRole = userData?.role || 'citizen';
                        
                        if (role === 'admin' && userDbRole !== 'admin') {
                          throw new Error('Unauthorized: Admin access required.');
                        }
                        
                        if (role === 'steward' && userDbRole !== 'steward' && userDbRole !== 'admin') {
                          throw new Error('Unauthorized: Steward access required.');
                        }

                        setRole(role);
                        navigate('/dashboard');
                        onClose();
                      } catch (err: any) {
                        setError(err.message || getErrorMessage(err));
                        if (err.message && err.message.includes('Unauthorized')) {
                          await signOut(auth);
                        }
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-slate-50 dark:bg-slate-950/50 text-[11px] font-bold text-[#0a1930] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-70"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
