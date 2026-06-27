import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Shield, Sun, Moon } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import { useTranslation } from '../lib/i18n';

import { getErrorMessage } from '../lib/errorMapping';

export function Signup() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signInWithGoogle, signUpWithEmail, language, demoLogin } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDemo();
  const navigate = useNavigate();
  const t = useTranslation(language);

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
      return; // prevent spamming
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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      setError('Please verify your email with OTP first.');
      return;
    }
    if (email === 'demo@civicpulse.ai' && password === 'pass123') {
      demoLogin();
      navigate('/');
      return;
    }
    
    try {
      await signUpWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans flex justify-center">
      <div className="w-full min-h-screen relative shadow-none lg:shadow-2xl flex flex-col mx-auto max-w-[430px] border-x-0 lg:border-x border-slate-200 dark:border-slate-800/50 justify-center px-6 py-6 z-10 bg-[#f8fbff] dark:bg-[#0a0f1c] overflow-hidden">
        
        {/* CSS Background Effects */}
        <div className="absolute top-[5%] left-[10%] w-72 h-72 bg-[#0a1930]/15 dark:bg-blue-400/30 rounded-full blur-[60px] pointer-events-none z-0" />
        <div className="absolute top-[30%] -right-[20%] w-80 h-80 bg-[#0f284b]/15 dark:bg-blue-300/25 rounded-full blur-[80px] pointer-events-none z-0" />
        
        {/* Dotted pattern (CSS) */}
        <div 
          className="absolute top-0 left-0 w-3/4 h-full opacity-[0.05] dark:opacity-[0.08] pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(#0f284b 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Tech wave lines (CSS low-opacity borders) */}
        <div className="absolute -top-[10%] -left-[20%] w-[150%] h-[150%] border-[1px] border-blue-600/40 dark:border-blue-500/15 rounded-[100%] pointer-events-none z-0" />
        <div className="absolute top-[5%] -left-[30%] w-[120%] h-[120%] border-[1px] border-blue-600/30 dark:border-blue-500/10 rounded-[100%] pointer-events-none z-0" />

        {/* Asset Graphics */}
        <img 
          src="/chatgpt_city_skyline.png" 
          alt="" 
          className="absolute bottom-0 left-0 w-full h-[180px] object-cover object-bottom opacity-100 dark:opacity-20 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen" 
        />
        <img 
          src="/chatgpt_right_network_graphic.png" 
          alt="" 
          className="absolute top-24 -right-16 w-[70%] max-w-[280px] object-contain opacity-80 dark:opacity-[0.15] pointer-events-none z-0" 
        />

        {/* Top Header */}
        <div className="absolute top-6 left-0 w-full px-6 flex justify-between items-center z-10">
          <img src="/chatgpt_logo_icon.png" alt="CivicPulse AI" className="w-12 h-12 object-contain" />
          <div className="flex items-center gap-2">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <LanguageSelector />
            </div>
            <button 
              onClick={toggleDarkMode}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-16 z-10"
        >
          <div className="flex justify-center mb-4">
            <img src="/chatgpt_logo_full.png" alt="CivicPulse AI" className="h-20 w-auto object-contain drop-shadow-sm dark:brightness-0 dark:invert" />
          </div>
          <h1 className="text-center text-[32px] leading-tight font-black text-[#0a1930] dark:text-white tracking-tight mb-2">
            Create Account
          </h1>
          <h2 className="text-center text-[15px] font-medium text-slate-500 dark:text-slate-400">
            {t('signup.title')}
          </h2>
        </motion.div>

        <div className="mt-8 w-full z-10">
          <form className="space-y-6" onSubmit={handleEmailSignup}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[13px] font-semibold text-[#0a1930] dark:text-slate-300 mb-1.5 ml-1">
                {t('signup.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                  <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f284b] dark:focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm text-[#0a1930] dark:text-white placeholder-slate-400 sm:text-sm transition-all shadow-sm relative z-0"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#0a1930] dark:text-slate-300 mb-1.5 ml-1">
                OTP Verification
              </label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={otpVerified || !otpSent}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f284b] dark:focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm text-[#0a1930] dark:text-white placeholder-slate-400 sm:text-sm transition-all shadow-sm relative z-0 disabled:opacity-50"
                    placeholder="Enter OTP"
                    required
                  />
                </div>
                {!otpSent ? (
                  <button 
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSending}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : !otpVerified ? (
                  <button 
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifying}
                    className="px-4 py-3 bg-[#0a1930] dark:bg-blue-600 border border-transparent rounded-xl text-sm font-semibold text-white hover:bg-opacity-90 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </button>
                ) : (
                  <div className="px-4 py-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-sm font-semibold text-green-700 dark:text-green-400 shrink-0 flex items-center justify-center">
                    Verified
                  </div>
                )}
              </div>
              {otpSent && !otpVerified && (
                <div className="mt-2 ml-1 flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0 || isSending}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50 disabled:no-underline"
                  >
                    {isSending ? 'Sending...' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#0a1930] dark:text-slate-300 mb-1.5 ml-1">
                {t('signup.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                  <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f284b] dark:focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm text-[#0a1930] dark:text-white placeholder-slate-400 sm:text-sm transition-all shadow-sm relative z-0"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-[56px] rounded-[10px] border-0 text-white text-[16px] font-bold tracking-[0.2px] flex items-center justify-center gap-[18px] cursor-pointer transition-all duration-200 shadow-[0_10px_22px_rgba(2,36,86,0.22),0_4px_10px_rgba(45,115,238,0.18)] hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(2,36,86,0.28),0_6px_14px_rgba(45,115,238,0.22)] active:translate-y-0 active:brightness-95 active:shadow-[0_7px_16px_rgba(2,36,86,0.2),0_3px_8px_rgba(45,115,238,0.16)] focus-visible:outline-[3px] focus-visible:outline-[rgba(45,115,238,0.28)] focus-visible:outline-offset-[3px] keep-original-color mt-2"
              style={{
                background: "linear-gradient(90deg, #022456 0%, #2d73ee 100%)",
              }}
            >
              <span>{t('signup.signup')}</span>
              <span className="text-[25px] leading-none font-medium">→</span>
            </button>
          </form>

          <div className="mt-8 mb-6 z-10 relative">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#f8fbff] dark:bg-[#0a0f1c] text-slate-400 font-semibold tracking-widest uppercase">
                  {t('signup.or')}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full inline-flex items-center justify-center py-3.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-[14px] font-semibold text-[#0a1930] dark:text-white hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('signup.google')}
              </button>

              <button
                type="button"
                onClick={() => { demoLogin(); navigate('/'); }}
                className="w-full inline-flex items-center justify-center py-3 px-4 border border-blue-200/50 dark:border-blue-800/50 rounded-xl shadow-sm bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm text-[14px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Continue as Guest
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-[14px] text-slate-500 dark:text-slate-400">
            {t('signup.hasaccount')}{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              {t('signup.signin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
