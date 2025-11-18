'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { OTPVerificationWidget } from '@/components/auth/otp-verification-widget';
import { createOTP, verifyOTP, getOTPExpiryTime } from '@/lib/services/otp-service';
import { db, auth, signInWithGoogle } from '@/lib/firebase/config';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import crypto from 'crypto';

interface SignInState {
  stage: 'form' | 'otp';
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  signInMessage: { type: 'success' | 'error'; message: string } | null;
  isProcessingRedirect: boolean;
  otpExpiryTime: Date | null;
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';

  const [state, setState] = useState<SignInState>({
    stage: 'form',
    email: '',
    password: '',
    showPassword: false,
    isLoading: false,
    signInMessage: null,
    isProcessingRedirect: true,
    otpExpiryTime: null,
  });

  // Handle redirect result from Google Sign-In on mobile
  useEffect(() => {
    let isMounted = true;
    
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Sign-In Page: Checking for redirect result...');
        
        const isGoogleSignInInProgress = sessionStorage.getItem('google_signin_in_progress');
        console.log('Google sign-in in progress flag:', isGoogleSignInInProgress);
        
        if (isGoogleSignInInProgress) {
          console.log('✅ Returning from Google Sign-In...');
          sessionStorage.removeItem('google_signin_in_progress');
          
          // Mark that we need to wait for auth state change
          sessionStorage.setItem('waiting_for_auth_state', 'true');
        }
        
        const { getRedirectResult } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase/config');

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            console.warn('⚠️ Redirect result check timeout');
            reject(new Error('Redirect check timeout'));
          }, 5000)
        );

        const result = await Promise.race([
          getRedirectResult(auth),
          timeoutPromise
        ]);

        if (isMounted) {
          if (result && (result as any).user) {
            const user = (result as any).user;
            console.log('✓ Sign-In Page: Redirect sign-in successful:', user.email);
            console.log('✓ User UID:', user.uid);
            
            setState((prev) => ({
              ...prev,
              signInMessage: { type: 'success', message: '✓ Signed in with Google! Redirecting...' },
              isProcessingRedirect: false,
            }));
            setTimeout(() => {
              console.log('🔄 Redirecting to:', redirect);
              router.push(redirect);
            }, 1500);
          } else {
            console.log('✓ Sign-In Page: No redirect result (user came to page normally)');
            setState((prev) => ({
              ...prev,
              isProcessingRedirect: false,
            }));
          }
        }
      } catch (error: any) {
        console.error('❌ Error handling redirect result:', error);
        if (isMounted) {
          // If it's a timeout or no-auth-event, just continue (user came to page normally)
          if (error.code !== 'auth/no-auth-event' && error.message !== 'Redirect check timeout') {
            console.error('⚠️ Redirect error details:', error.code, error.message);
            setState((prev) => ({
              ...prev,
              signInMessage: { type: 'error', message: error.message || 'Sign in failed' },
              isProcessingRedirect: false,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              isProcessingRedirect: false,
            }));
          }
        }
      }
    };

    handleRedirectResult();
    
    return () => {
      isMounted = false;
    };
  }, [redirect, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email || !state.password) {
      setState((prev) => ({
        ...prev,
        signInMessage: { type: 'error', message: 'Please enter your email and password' },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, signInMessage: null }));

    try {
      // Find user by email to check if account exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', state.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          signInMessage: {
            type: 'error',
            message: 'Email not found. Please sign up first.',
          },
        }));
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Check if account is registered via Google
      if (userData.authMethod === 'google') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          signInMessage: {
            type: 'error',
            message: 'This account is registered with Google. Please use Google Sign-In instead.',
          },
        }));
        return;
      }

      // Verify password with Firebase Auth (don't use hashed password from Firestore)
      // This will throw an error if password is wrong
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        console.log('[SignIn] Verifying credentials with Firebase Auth...');
        await signInWithEmailAndPassword(auth, state.email, state.password);
        console.log('[SignIn] Credentials verified successfully');
      } catch (authError: any) {
        console.error('[SignIn] Firebase Auth verification failed:', authError.code);
        
        // If user doesn't exist in Firebase Auth (old Firestore-only account)
        // Fall back to password hash verification
        if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') {
          console.log('[SignIn] User not in Firebase Auth, checking Firestore password...');
          
          const hashedPassword = crypto
            .createHash('sha256')
            .update(state.password)
            .digest('hex');

          if (userData.password !== hashedPassword) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              signInMessage: {
                type: 'error',
                message: 'Invalid email or password',
              },
            }));
            return;
          }
          
          console.log('[SignIn] Firestore password verified, creating Firebase Auth account...');
        } else {
          // Other errors (wrong password, etc)
          setState((prev) => ({
            ...prev,
            isLoading: false,
            signInMessage: {
              type: 'error',
              message: 'Invalid email or password',
            },
          }));
          return;
        }
      }

      // Generate and send OTP
      const otpCode = await createOTP(state.email);

      // For dev: show OTP in console
      console.log(`[DEV] Login OTP for ${state.email}: ${otpCode}`);

      // Send OTP email via Gmail API
      try {
        const emailResponse = await fetch('/api/send-otp-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: state.email,
            otpCode: otpCode,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('❌ Email sending failed:', errorData);
          throw new Error(errorData.error || 'Failed to send email');
        }

        const emailResult = await emailResponse.json();
        console.log('✅ Email sent successfully:', emailResult);
      } catch (emailError: any) {
        console.error('❌ Error sending OTP email:', emailError);
        toast.error('Failed to send OTP email. Please try again.');
        setState((prev) => ({
          ...prev,
          isLoading: false,
          signInMessage: {
            type: 'error',
            message: 'Failed to send OTP email. Please try again.',
          },
        }));
        return;
      }

      toast.success(`OTP sent to ${state.email}`);

      // Calculate expiry time
      const expiryTime = await getOTPExpiryTime(state.email);

      setState((prev) => ({
        ...prev,
        stage: 'otp',
        isLoading: false,
        signInMessage: {
          type: 'success',
          message: 'Check your email for the login code',
        },
        otpExpiryTime: expiryTime,
      }));
    } catch (error: any) {
      console.error('Sign in error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        signInMessage: {
          type: 'error',
          message: error.message || 'Sign in failed',
        },
      }));
    }
  };

  const handleOTPVerify = async (otpCode: string) => {
    try {
      const isValid = await verifyOTP(state.email, otpCode);

      if (!isValid) {
        toast.error('Invalid OTP code. Please try again.');
        return;
      }

      // OTP verified! Now authenticate user with Firebase Auth
      try {
        console.log('[SignIn] Attempting to authenticate with Firebase Auth...');
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        
        try {
          await signInWithEmailAndPassword(auth, state.email, state.password);
          console.log('[SignIn] User authenticated successfully with Firebase Auth');
        } catch (authError: any) {
          console.error('[SignIn] Firebase Auth sign-in failed:', authError.code);
          
          // If user doesn't exist in Firebase Auth (old Firestore-only account)
          // we need to create them first, then sign in
          if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') {
            console.log('[SignIn] User not in Firebase Auth, creating account...');
            
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            try {
              await createUserWithEmailAndPassword(auth, state.email, state.password);
              console.log('[SignIn] Firebase Auth account created');
              
              // Now sign in
              await signInWithEmailAndPassword(auth, state.email, state.password);
              console.log('[SignIn] User signed in after account creation');
            } catch (createError: any) {
              console.error('[SignIn] Error creating/signing in:', createError);
              throw createError;
            }
          } else {
            // Other auth errors (wrong password, etc)
            throw authError;
          }
        }
      } catch (authError: any) {
        console.error('[SignIn] Final Firebase Auth error:', authError);
        toast.error('Authentication failed. Please check your email and password.');
        return;
      }

      // Update last login time
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', state.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await setDoc(
          userDoc.ref,
          {
            lastLogin: new Date(),
          },
          { merge: true }
        );
      }

      toast.success('✓ Login verified! Redirecting...');
      setState((prev) => ({
        ...prev,
        signInMessage: {
          type: 'success',
          message: '✓ Signed in successfully! Redirecting...',
        },
      }));

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push(redirect);
      }, 2000);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'OTP verification failed');
    }
  };

  const handleOTPResend = async () => {
    try {
      const otpCode = await createOTP(state.email);

      // For dev: show OTP in console
      console.log(`[DEV] Login OTP resent to ${state.email}: ${otpCode}`);

      // Send OTP email via Gmail API
      try {
        const emailResponse = await fetch('/api/send-otp-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: state.email,
            otpCode: otpCode,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error('❌ Email sending failed:', errorData);
          throw new Error(errorData.error || 'Failed to send email');
        }

        const emailResult = await emailResponse.json();
        console.log('✅ Email resent successfully:', emailResult);
      } catch (emailError: any) {
        console.error('❌ Error resending OTP email:', emailError);
        toast.error('Failed to resend OTP email. Please try again.');
        return;
      }

      toast.success('OTP resent to your email');

      const expiryTime = await getOTPExpiryTime(state.email);
      setState((prev) => ({
        ...prev,
        otpExpiryTime: expiryTime,
      }));
    } catch (error: any) {
      console.error('OTP resend error:', error);
      toast.error(error.message || 'Failed to resend OTP');
    }
  };

  const handleBackToForm = () => {
    setState((prev) => ({
      ...prev,
      stage: 'form',
      email: '',
      password: '',
      signInMessage: null,
    }));
  };

  const handleGoogleSignIn = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await signInWithGoogle();

      if (result) {
        setState((prev) => ({
          ...prev,
          signInMessage: { type: 'success', message: '✓ Signed in with Google! Redirecting...' },
        }));
        setTimeout(() => router.push(redirect), 1500);
      } else {
        setState((prev) => ({
          ...prev,
          signInMessage: { type: 'success', message: '✓ Redirecting to Google... Please wait' },
        }));
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        signInMessage: { type: 'error', message: error.message || 'Google sign-in failed' },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-amber-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300/5 rounded-full blur-3xl -z-10"></div>

      {/* Show loading while checking for redirect result */}
      {state.isProcessingRedirect ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="w-full max-w-md border border-amber-200 shadow-xl bg-white">
            <CardContent className="pt-20 pb-20 text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full mx-auto"
              />
              <p className="text-slate-600 font-medium">Checking sign-in status...</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : state.stage === 'form' ? (
        // Sign In Form
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border border-amber-200 shadow-2xl bg-white">
            <CardHeader className="space-y-4 pb-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center shadow-lg overflow-hidden">
                  <Image
                    src="/images/Logo/Logo seilerstubb.png"
                    alt="Seiler Stubb Logo"
                    width={50}
                    height={50}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
                  <CardDescription className="text-slate-600 text-base mt-2">
                    Sign in to your restaurant account
                  </CardDescription>
                </div>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Sign In Message (Success/Error) */}
              {state.signInMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-start gap-3 border ${
                    state.signInMessage.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      state.signInMessage.type === 'success'
                        ? 'bg-green-200'
                        : 'bg-red-200'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        state.signInMessage.type === 'success'
                          ? 'bg-green-600'
                          : 'bg-red-600'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      state.signInMessage.type === 'success'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {state.signInMessage.message}
                  </span>
                </motion.div>
              )}

              {/* Email Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={state.email}
                      onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
                      className="pl-10 bg-white border-2 border-amber-100 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      disabled={state.isLoading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                    <Input
                      id="password"
                      type={state.showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={state.password}
                      onChange={(e) => setState((prev) => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 bg-white border-2 border-amber-100 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      disabled={state.isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setState((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600/60 hover:text-amber-700 transition-colors"
                      tabIndex={-1}
                    >
                      {state.showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Forgot Password Link */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex justify-end"
                >
                  <Link
                    href="/auth/reset-password"
                    className="text-sm text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  type="submit"
                  disabled={state.isLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-amber-200/50"
                >
                  {state.isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative py-2"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-amber-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-600 font-medium">Or continue with</span>
                </div>
              </motion.div>

              {/* Google Sign In */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={handleGoogleSignIn}
                disabled={state.isLoading}
                className="w-full py-3 border-2 border-amber-200 hover:border-amber-400 text-slate-700 hover:text-slate-900 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </motion.button>

              {/* Sign Up Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="pt-4 border-t border-amber-100"
              >
                <p className="text-center text-slate-600 text-sm">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-amber-600 hover:text-amber-700 font-bold flex items-center justify-center gap-1 mt-3"
                  >
                    Create one now <ArrowRight className="w-4 h-4" />
                  </Link>
                </p>
              </motion.div>
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-slate-500 text-xs mt-6"
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </motion.p>

          {/* Back to home link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-4"
          >
            <Link
              href="/"
              className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        // OTP Verification Stage
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <OTPVerificationWidget
            email={state.email}
            onVerify={handleOTPVerify}
            onResend={handleOTPResend}
            isLoading={state.isLoading}
            expiryTime={state.otpExpiryTime || undefined}
          />

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6"
          >
            <button
              onClick={handleBackToForm}
              className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              ← Back to Sign In
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return <SignInContent />;
}
