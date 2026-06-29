import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  ArrowRight, 
  Shield, 
  Users, 
  LayoutDashboard, 
  ArrowLeft, 
  CheckCircle, 
  User, 
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import { useTranslation } from '../lib/i18n';
import { getErrorMessage } from '../lib/errorMapping';

export function Login() {
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'steward' | 'admin' | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  // Sign in states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | React.ReactNode>('');
  
  // Sign up states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, language, demoLogin, activePortal, setActivePortal } = useAuth();
  const { isDarkMode, toggleDarkMode, setRole } = useDemo();
  const navigate = useNavigate();
  const t = useTranslation(language);

  // Resend OTP cooldown timer
  useEffect(() => {
    let timer: number;
    if (resendCooldown > 0) {
      timer = window.setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter an email address first.');
      return;
    }
    
    if (resendCooldown > 0) {
      return;
    }

    setIsSending(true);
    setError('');
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setOtpSent(true);
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send email. Ensure server and RESEND_API_KEY are configured.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    setError('');
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify OTP');
      
      setOtpVerified(true);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === 'pass123') {
      let targetRole: 'citizen' | 'steward' | 'admin' | null = null;
      if (email === 'admin@civicpulse.ai') targetRole = 'admin';
      else if (email === 'steward@civicpulse.ai') targetRole = 'steward';
      else if (email === 'demo@civicpulse.ai') targetRole = 'citizen';

      if (!targetRole) {
        setError('Invalid demo credentials.');
        return;
      }

      if (selectedRole !== targetRole) {
        setError(
          <>
            Invalid for this role. You belong in the {targetRole} portal.{' '}
            <button
              type="button"
              onClick={() => { setError(''); setSelectedRole(targetRole as any); }}
              className="mt-1 font-bold underline text-red-700 dark:text-red-300 block hover:text-red-800"
            >
              Go to {targetRole} portal
            </button>
          </>
        );
        return;
      }

      if (targetRole === 'admin') demoLogin('admin@civicpulse.ai', 'Demo Admin', 'admin');
      else if (targetRole === 'steward') demoLogin('steward@civicpulse.ai', 'Demo Steward', 'steward');
      else demoLogin('demo@civicpulse.ai', 'Demo Citizen', 'citizen');
      return;
    }

    try {
      await signInWithEmail(email, password);
      // Navigation is handled by useEffect on user/dbRole
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      setError('Please verify your email with OTP first.');
      return;
    }
    
    try {
      await signUpWithEmail(email, password);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setIsResetting(true);
    setError('');
    setResetSuccess(null);

    // If it's a demo account, we don't send a real firebase reset link, we can simulate it beautifully.
    if (email === 'demo@civicpulse.ai' || email === 'steward@civicpulse.ai' || email === 'admin@civicpulse.ai') {
      setTimeout(() => {
        setIsResetting(false);
        setResetSuccess(`Demo Account Auto-Reset: For demo access, the password is always 'pass123'. You can sign in immediately!`);
      }, 800);
      return;
    }

    try {
      await resetPassword(email);
      setResetSuccess('If an account exists with this email address, a secure password reset link has been successfully sent! Please check your inbox and follow the instructions.');
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Failed to send password reset email. Please verify the email is registered.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleGuestLogin = () => {
    demoLogin();
  };

  // Listen for login and route based on role
  const { user, dbRole, signOut } = useAuth();

  const isAuthorizedForPortal = (roleInDb: string | null, targetRole: 'citizen' | 'steward' | 'admin') => {
    if (!roleInDb) return false;
    if (roleInDb === 'admin') return true;
    if (roleInDb === 'steward') return targetRole === 'steward' || targetRole === 'citizen';
    return targetRole === 'citizen';
  };

  const selectPortal = async (role: 'citizen' | 'steward' | 'admin') => {
    if (user && dbRole) {
      if (isAuthorizedForPortal(dbRole, role)) {
        setActivePortal(role);
      } else {
        await signOut();
        resetForm();
        setSelectedRole(role);
        setAuthMode('signin');
        setError('Your currently logged in account does not support this access. Please login with correct details.');
      }
    } else {
      resetForm();
      setSelectedRole(role);
      setAuthMode('signin');
    }
  };

  // Redirect to correct dashboard when authenticated and activePortal is set
  useEffect(() => {
    if (user && dbRole && activePortal) {
      navigate(activePortal === 'citizen' ? '/' : '/dashboard');
    }
  }, [user, dbRole, activePortal, navigate]);

  // Handle post-login authorization check
  useEffect(() => {
    if (user && dbRole && selectedRole && !activePortal) {
      if (isAuthorizedForPortal(dbRole, selectedRole)) {
        setActivePortal(selectedRole);
      } else {
        setError(
          <>
            Invalid for this role. You belong in the {dbRole} portal.{' '}
            <button
              type="button"
              onClick={() => { setError(''); setSelectedRole(dbRole as any); setActivePortal(dbRole); }}
              className="mt-1 font-bold underline text-red-700 dark:text-red-300 block hover:text-red-800"
            >
              Go to {dbRole} portal
            </button>
          </>
        );
      }
    }
  }, [user, dbRole, selectedRole, activePortal, setActivePortal]);

  const resetForm = () => {
    setError('');
    setEmail('');
    setPassword('');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans flex justify-center text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      
      {/* Background radial and grid patterns */}
      <div className="absolute top-[5%] left-[10%] w-72 h-72 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#0f284b 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Container */}
      <div className="w-full min-h-screen relative shadow-none lg:shadow-2xl flex flex-col mx-auto max-w-[430px] border-x-0 lg:border-x border-slate-200 dark:border-slate-800/50 justify-between px-5 py-6 z-10 bg-[#f8fbff] dark:bg-[#0a0f1c]">
        
        {/* Top Header Row */}
        <div className="w-full flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <img src="/chatgpt_logo_icon.png" alt="CivicPulse AI" className="w-8 h-8 object-contain" />
            <span className="font-black tracking-tight text-xs text-[#0a1930] dark:text-white">CIVICPULSE AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 scale-90">
              <LanguageSelector />
            </div>
            <button 
              onClick={toggleDarkMode}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Inner Container */}
        <div className="flex-1 flex flex-col justify-center py-6">
          <AnimatePresence mode="wait">
            {selectedRole === null ? (
              /* Portal Role Choice Screen */
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center"
              >
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <img src="/chatgpt_logo_full.png" alt="CivicPulse AI" className="h-16 w-auto object-contain drop-shadow-sm dark:brightness-0 dark:invert" />
                  </div>
                  <h1 className="text-[26px] leading-tight font-black text-[#0a1930] dark:text-white tracking-tight">
                    Access Portal
                  </h1>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[320px] mx-auto">
                    Select your system authorization tier to securely proceed to authenticate.
                  </p>
                </div>

                {/* Role Cards Grid */}
                <div className="w-full space-y-3.5 mt-2">
                  
                  {/* Card 1: Citizen (Normal User) */}
                  <motion.div 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectPortal('citizen')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 rounded-[20px] p-4 flex items-start gap-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.02] dark:bg-blue-400/[0.02] rounded-bl-full pointer-events-none group-hover:bg-blue-500/[0.04] transition-colors" />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h3 className="font-bold text-sm text-[#0a1930] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Normal User / Citizen</h3>
                        <span className="text-[9px] bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Level 1</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Log local complaints, track neighborhood bounties, verify issue states, and claim direct wallet deposits.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 self-center shrink-0 group-hover:translate-x-0.5 transition-all" />
                  </motion.div>

                  {/* Card 2: Steward / Reviewer */}
                  <motion.div 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectPortal('steward')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-[20px] p-4 flex items-start gap-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] dark:bg-emerald-400/[0.02] rounded-bl-full pointer-events-none group-hover:bg-emerald-500/[0.04] transition-colors" />
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h3 className="font-bold text-sm text-[#0a1930] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Reviewer / Steward</h3>
                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Level 2</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Analyze verification photo proof, inspect GPS coordinates, merge duplicate reports, and disburse community payouts.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 self-center shrink-0 group-hover:translate-x-0.5 transition-all" />
                  </motion.div>

                  {/* Card 3: Admin */}
                  <motion.div 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectPortal('admin')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-500 rounded-[20px] p-4 flex items-start gap-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] dark:bg-amber-400/[0.02] rounded-bl-full pointer-events-none group-hover:bg-amber-500/[0.04] transition-colors" />
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                      <LayoutDashboard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h3 className="font-bold text-sm text-[#0a1930] dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Platform Admin</h3>
                        <span className="text-[9px] bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Level 3</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        Manage global platform params, inspect escalation packets, configure thresholds, and override system database weights.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 self-center shrink-0 group-hover:translate-x-0.5 transition-all" />
                  </motion.div>

                </div>

                <div className="mt-8 text-center text-xs text-slate-400 max-w-[280px]">
                  CivicPulse AI platform provides decentralized validation of public infrastructure reports.
                </div>
              </motion.div>
            ) : (
              /* Beautiful Authenticate Popup Screen (Modal Card inside our Mobile Layout) */
              <motion.div
                key="auth-popup"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-[0_20px_50px_rgba(15,40,75,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-slate-800/80 mt-1 relative"
              >
                {/* Back button */}
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="absolute top-4 left-4 flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Role Badge Indicator */}
                <div className="self-end mb-2">
                  {selectedRole === 'citizen' && (
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" /> Citizen Level
                    </span>
                  )}
                  {selectedRole === 'steward' && (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Steward Level
                    </span>
                  )}
                  {selectedRole === 'admin' && (
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <LayoutDashboard className="w-3 h-3" /> Admin Level
                    </span>
                  )}
                </div>

                <div className="text-center mt-3">
                  <h2 className="text-xl font-black text-[#0a1930] dark:text-white tracking-tight">
                    {authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {authMode === 'forgot' ? 'Get a secure link to recover your account' : (
                      <>
                        {selectedRole === 'citizen' && 'Accessing Crowdsourced Pulse'}
                        {selectedRole === 'steward' && 'Steward operations & review'}
                        {selectedRole === 'admin' && 'System configuration & admin overrides'}
                      </>
                    )}
                  </p>
                </div>

                {/* Switcher Tab Header */}
                {selectedRole === 'citizen' && authMode !== 'forgot' && (
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full mt-4 border border-slate-200/20">
                    <button
                      onClick={() => { setError(''); setAuthMode('signin'); }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${authMode === 'signin' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setError(''); setAuthMode('signup'); }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${authMode === 'signup' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                    >
                      Register
                    </button>
                  </div>
                )}

                {/* Form Errors */}
                {error && (
                  <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 p-2.5 rounded-xl text-xs mt-3.5 shadow-sm text-left">
                    {error}
                  </div>
                )}

                {/* Conditional Form Render */}
                {authMode === 'signin' ? (
                  /* SIGN IN FORM */
                  <form className="space-y-3 mt-4" onSubmit={handleEmailLogin}>
                    <div>
                      <label className="block text-[11px] font-bold text-[#0a1930] dark:text-slate-300 uppercase tracking-wider ml-1 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-950/40 text-[#0a1930] dark:text-white placeholder-slate-400 text-xs transition-all shadow-sm"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center ml-1 mb-1">
                        <label className="block text-[11px] font-bold text-[#0a1930] dark:text-slate-300 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => { setError(''); setResetSuccess(null); setAuthMode('forgot'); }}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <Lock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-950/40 text-[#0a1930] dark:text-white placeholder-slate-400 text-xs transition-all shadow-sm"
                          placeholder="••••••••"
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 z-10"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-xl text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:brightness-95 transition-all mt-4 border-0 shadow-md"
                      style={{
                        background: selectedRole === 'citizen' 
                          ? "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)" 
                          : selectedRole === 'steward'
                            ? "linear-gradient(90deg, #065f46 0%, #10b981 100%)"
                            : "linear-gradient(90deg, #92400e 0%, #f59e0b 100%)"
                      }}
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : authMode === 'signup' ? (
                  /* SIGN UP FORM (With Resend API support & simulation) */
                  <form className="space-y-3 mt-4" onSubmit={handleEmailSignup}>
                    <div>
                      <label className="block text-[11px] font-bold text-[#0a1930] dark:text-slate-300 uppercase tracking-wider ml-1 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-950/40 text-[#0a1930] dark:text-white placeholder-slate-400 text-xs transition-all shadow-sm"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0a1930] dark:text-slate-300 uppercase tracking-wider ml-1 mb-1">
                        One-Time Password (OTP)
                      </label>
                      <div className="relative flex gap-1.5">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <Shield className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={otpVerified || !otpSent}
                            className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-950/40 text-[#0a1930] dark:text-white placeholder-slate-400 text-xs transition-all shadow-sm disabled:opacity-50"
                            placeholder="Enter OTP"
                            required
                          />
                        </div>
                        {!otpSent ? (
                          <button 
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSending}
                            className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isSending ? 'Sending' : 'Send'}
                          </button>
                        ) : !otpVerified ? (
                          <button 
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={isVerifying}
                            className="px-3 py-2.5 bg-blue-600 border border-transparent rounded-xl text-xs font-semibold text-white hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isVerifying ? 'Verifying' : 'Verify'}
                          </button>
                        ) : (
                          <div className="px-3 py-2.5 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-xs font-semibold text-green-700 dark:text-green-400 shrink-0 flex items-center justify-center">
                            Verified
                          </div>
                        )}
                      </div>
                      {otpSent && !otpVerified && (
                        <div className="mt-1 ml-1">
                          <button 
                            type="button" 
                            onClick={handleSendOtp}
                            disabled={resendCooldown > 0 || isSending}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold disabled:opacity-60 disabled:no-underline"
                          >
                            {isSending ? 'Sending' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0a1930] dark:text-slate-300 uppercase tracking-wider ml-1 mb-1">
                        Choose Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <Lock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-950/40 text-[#0a1930] dark:text-white placeholder-slate-400 text-xs transition-all shadow-sm"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-xl text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:brightness-95 transition-all mt-4 border-0 shadow-md"
                      style={{
                        background: selectedRole === 'citizen' 
                          ? "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)" 
                          : selectedRole === 'steward'
                            ? "linear-gradient(90deg, #065f46 0%, #10b981 100%)"
                            : "linear-gradient(90deg, #92400e 0%, #f59e0b 100%)"
                      }}
                    >
                      <span>Create Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  /* FORGOT PASSWORD FORM */
                  <form className="space-y-3 mt-4" onSubmit={handleForgotPassword}>
                    {resetSuccess ? (
                      <div className="bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-xs shadow-sm text-left font-semibold leading-relaxed">
                        {resetSuccess}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold text-[#0a1930] dark:text-slate-300 uppercase tracking-wider ml-1 mb-1">
                            Email Address
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                              <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-950/40 text-[#0a1930] dark:text-white placeholder-slate-400 text-xs transition-all shadow-sm"
                              placeholder="you@example.com"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isResetting}
                          className="w-full h-11 rounded-xl text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:brightness-95 transition-all mt-4 border-0 shadow-md disabled:opacity-50"
                          style={{
                            background: selectedRole === 'citizen' 
                              ? "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)" 
                              : selectedRole === 'steward'
                                ? "linear-gradient(90deg, #065f46 0%, #10b981 100%)"
                                : "linear-gradient(90deg, #92400e 0%, #f59e0b 100%)"
                          }}
                        >
                          <span>{isResetting ? "Sending Email..." : "Send Reset Link"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => { setError(''); setResetSuccess(null); setAuthMode('signin'); }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )}

                {/* Social continuing options inside popup */}
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
                    onClick={handleGoogleLogin}
                    className="w-full inline-flex items-center justify-center py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-slate-50 dark:bg-slate-950/50 text-[11px] font-bold text-[#0a1930] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="w-full inline-flex items-center justify-center py-2 px-3 border border-transparent rounded-xl shadow-sm bg-blue-50/60 dark:bg-blue-950/40 text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    Continue as Guest
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* City skyline vector footer background */}
        <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none opacity-40 dark:opacity-20 z-0">
          <img 
            src="/chatgpt_city_skyline.png" 
            alt="City Skyline" 
            className="w-full h-auto object-cover object-bottom mix-blend-multiply dark:mix-blend-screen translate-y-1" 
          />
        </div>

      </div>
    </div>
  );
}

