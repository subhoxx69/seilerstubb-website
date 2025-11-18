'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { OTPVerificationWidget } from '@/components/auth/otp-verification-widget';
import { createOTP, verifyOTP, getOTPExpiryTime } from '@/lib/services/otp-service';
import { generateOTPEmailTemplate } from '@/lib/services/email-otp-template';
import { db, signInWithGoogle, auth } from '@/lib/firebase/config';
import { collection, doc, setDoc, query, where, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

interface SignUpState {
  stage: 'form' | 'otp';
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  signUpMessage: { type: 'success' | 'error'; message: string } | null;
  otpExpiryTime: Date | null;
}

// Temporary signup data (not saved to DB until OTP verified)
interface TempSignupData {
  email: string;
  password: string;
}

function SignUpContent() {
  const router = useRouter();
  const tempSignupDataRef = React.useRef<TempSignupData | null>(null);
  
  const [state, setState] = useState<SignUpState>({
    stage: 'form',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    signUpMessage: null,
    otpExpiryTime: null,
  });

  const handleInputChange = (field: string, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!state.email || !state.password || !state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        signUpMessage: {
          type: 'error',
          message: 'Please fill in all fields',
        },
      }));
      return;
    }

    if (state.password !== state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        signUpMessage: {
          type: 'error',
          message: 'Passwords do not match',
        },
      }));
      return;
    }

    if (state.password.length < 8) {
      setState((prev) => ({
        ...prev,
        signUpMessage: {
          type: 'error',
          message: 'Password must be at least 8 characters',
        },
      }));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(state.email)) {
      setState((prev) => ({
        ...prev,
        signUpMessage: {
          type: 'error',
          message: 'Please enter a valid email address',
        },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, signUpMessage: null }));

    try {
      // Check if email already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', state.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingUser = querySnapshot.docs[0].data();
        const authMethod = existingUser.authMethod || 'email';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          signUpMessage: {
            type: 'error',
            message:
              authMethod === 'google'
                ? 'This email is already registered with Google. Please sign in with Google instead.'
                : 'Email already registered with password. Please sign in instead.',
          },
        }));
        return;
      }

      // Store signup data temporarily (NOT in database yet)
      const hashedPassword = crypto
        .createHash('sha256')
        .update(state.password)
        .digest('hex');

      tempSignupDataRef.current = {
        email: state.email,
        password: hashedPassword,
      };

      // Generate OTP
      const otpCode = await createOTP(state.email);

      // Send OTP via email using Google Email API
      await fetch('/api/send-otp-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          otpCode: otpCode,
        }),
      });

      // Move to OTP verification stage
      toast.success(`OTP sent to ${state.email}`);

      // Calculate expiry time
      const expiryTime = await getOTPExpiryTime(state.email);

      setState((prev) => ({
        ...prev,
        stage: 'otp',
        isLoading: false,
        otpExpiryTime: expiryTime,
      }));
    } catch (error: any) {
      console.error('Signup error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        signUpMessage: {
          type: 'error',
          message: error.message || 'Failed to create account',
        },
      }));
      toast.error(error.message || 'Failed to create account');
    }
  };

  const handleOTPVerify = async (otpCode: string) => {
    try {
      const isValid = await verifyOTP(state.email, otpCode);

      if (!isValid) {
        toast.error('Invalid OTP code. Please try again.');
        return;
      }

      // OTP verified! Now create user in Firebase Auth AND Firestore
      if (!tempSignupDataRef.current) {
        toast.error('Signup data not found. Please try again.');
        return;
      }

      const plainPassword = state.password; // Use original password
      let firebaseUid = '';

      // Step 1: Create account in Firebase Auth first
      try {
        console.log('[Signup] Creating Firebase Auth account...');
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const authResult = await createUserWithEmailAndPassword(auth, state.email, plainPassword);
        firebaseUid = authResult.user.uid;
        console.log('[Signup] Firebase Auth account created:', firebaseUid);
      } catch (authError: any) {
        console.error('[Signup] Firebase Auth creation error:', authError);
        
        // Check if user already exists
        if (authError.code === 'auth/email-already-in-use') {
          toast.error('This email is already registered. Please sign in instead.');
          setState((prev) => ({
            ...prev,
            stage: 'form',
            signUpMessage: {
              type: 'error',
              message: 'Email already registered',
            },
          }));
          return;
        }
        
        throw authError;
      }

      // Step 2: Create user document in Firestore with Firebase UID
      const userDocId = `${state.email}_${Date.now()}`;
      const userRef = doc(db, 'users', userDocId);

      await setDoc(userRef, {
        email: tempSignupDataRef.current.email,
        password: tempSignupDataRef.current.password,
        firebaseUid: firebaseUid, // Store the Firebase UID
        authMethod: 'email',
        verified: true,
        status: 'active',
        createdAt: new Date(),
        verifiedAt: new Date(),
      });

      console.log('[Signup] Firestore user document created:', userDocId);

      // Step 3: Sign in the user with Firebase Auth
      try {
        console.log('[Signup] Signing in user...');
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, state.email, plainPassword);
        console.log('[Signup] User signed in successfully');
      } catch (signInError: any) {
        console.error('[Signup] Sign-in error:', signInError);
        throw signInError;
      }

      // Clear temp data
      tempSignupDataRef.current = null;

      toast.success('✓ Email verified successfully! Signing you in...');
      setState((prev) => ({
        ...prev,
        signUpMessage: {
          type: 'success',
          message: '✓ Account created and verified! Redirecting...',
        },
      }));

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setState((prev) => ({
        ...prev,
        signUpMessage: {
          type: 'error',
          message: error.message || 'OTP verification failed',
        },
      }));
      toast.error(error.message || 'OTP verification failed');
    }
  };

  const handleOTPResend = async () => {
    try {
      const otpCode = await createOTP(state.email);

      // Send OTP via email using Google Email API
      await fetch('/api/send-otp-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          otpCode: otpCode,
        }),
      });

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

  const handleGoogleSignUp = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, signUpMessage: null }));

      // Initiate Google Sign-In (returns null on redirect, or {user: ...})
      const result = await signInWithGoogle() as any;

      if (result === null) {
        // Redirect flow initiated - user will be redirected back here
        setState((prev) => ({
          ...prev,
          isLoading: false,
          signUpMessage: {
            type: 'success',
            message: 'Redirecting to Google... please complete sign-in',
          },
        }));
        return;
      }

      if (!result?.user) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          signUpMessage: {
            type: 'error',
            message: 'Google Sign-In failed. Please try again.',
          },
        }));
        return;
      }

      const userEmail = result.user.email;

      if (!userEmail) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          signUpMessage: {
            type: 'error',
            message: 'Unable to retrieve email from Google account.',
          },
        }));
        return;
      }

      // Check if email already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingUser = querySnapshot.docs[0].data();
        const authMethod = existingUser.authMethod || 'email';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          signUpMessage: {
            type: 'error',
            message:
              authMethod === 'google'
                ? 'This Google account is already registered. Please sign in with Google.'
                : 'This email is already registered with password. Please sign in with your email and password.',
          },
        }));
        return;
      }

      // Create user document with Google auth method
      const userDocId = `${userEmail}_${Date.now()}`;
      const userRef = doc(db, 'users', userDocId);

      await setDoc(userRef, {
        email: userEmail,
        authMethod: 'google',
        firebaseUid: result.user.uid,
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        createdAt: serverTimestamp(),
        verified: true,
        status: 'active',
        verifiedAt: serverTimestamp(),
      });

      toast.success('✓ Account created successfully! Signing you in...');

      setState((prev) => ({
        ...prev,
        signUpMessage: {
          type: 'success',
          message: '✓ Account created! Redirecting...',
        },
      }));

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Google sign-up error:', error);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        signUpMessage: {
          type: 'error',
          message: error.message || 'Google Sign-Up failed. Please try again.',
        },
      }));

      toast.error(error.message || 'Google Sign-Up failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-amber-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300/5 rounded-full blur-3xl -z-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {state.stage === 'form' ? (
          // Sign Up Form
          <Card className="border border-amber-200 shadow-2xl bg-white">
            <CardHeader className="space-y-4 pb-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Restaurant Logo */}
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
                  <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
                  <CardDescription className="text-slate-600 text-base mt-2">
                    Join Seiler Stubb community
                  </CardDescription>
                </div>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Sign Up Message (Success/Error) */}
              {state.signUpMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-start gap-3 border ${
                    state.signUpMessage.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      state.signUpMessage.type === 'success'
                        ? 'bg-green-200'
                        : 'bg-red-200'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        state.signUpMessage.type === 'success'
                          ? 'bg-green-600'
                          : 'bg-red-600'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      state.signUpMessage.type === 'success'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {state.signUpMessage.message}
                  </span>
                </motion.div>
              )}

              {/* Email and Password Form */}
              <form onSubmit={handleSignUpSubmit} className="space-y-5">
                {/* Email Field */}
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
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 bg-white border-2 border-amber-100 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      disabled={state.isLoading}
                    />
                  </div>
                </motion.div>

                {/* Password Field */}
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
                      onChange={(e) => handleInputChange('password', e.target.value)}
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
                  <p className="text-xs text-slate-500">At least 8 characters</p>
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-sm">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={state.showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={state.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 bg-white border-2 border-amber-100 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      disabled={state.isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setState((prev) => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600/60 hover:text-amber-700 transition-colors"
                      tabIndex={-1}
                    >
                      {state.showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Sign Up Button */}
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Create Account
                    </>
                  )}
                </motion.button>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-100 to-transparent"></div>
                  <span className="text-sm text-slate-500 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-amber-100 to-transparent"></div>
                </motion.div>

                {/* Google Sign-Up Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={state.isLoading}
                  className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {state.isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full"
                      />
                      <span>Signing up...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Sign up with Google
                    </>
                  )}
                </motion.button>
              </form>

              {/* Sign In Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-4 border-t border-amber-100"
              >
                <p className="text-center text-slate-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-amber-600 hover:text-amber-700 font-bold flex items-center justify-center gap-1 mt-3">
                    Sign in here <ArrowRight className="w-4 h-4" />
                  </Link>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        ) : (
          // OTP Verification Stage
          <OTPVerificationWidget
            email={state.email}
            onVerify={handleOTPVerify}
            onResend={handleOTPResend}
            isLoading={state.isLoading}
            expiryTime={state.otpExpiryTime || undefined}
          />
        )}

        {/* Footer */}
        {state.stage === 'form' && (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-slate-500 text-xs mt-6"
            >
              By signing up, you agree to our Terms of Service and Privacy Policy
            </motion.p>

            {/* Back to home link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mt-4"
            >
              <Link href="/" className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 transition-colors">
                ← Back to Home
              </Link>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function SignUpPage() {
  return <SignUpContent />;
}
