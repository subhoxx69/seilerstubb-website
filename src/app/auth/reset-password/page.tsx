'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import crypto from 'crypto';
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';

interface ResetPasswordState {
  stage: 'request' | 'reset' | 'success';
  email: string;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  resetMessage: { type: 'success' | 'error'; message: string } | null;
  resetToken: string | null;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ResetPasswordState>({
    stage: 'request',
    email: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    resetMessage: null,
    resetToken: null,
  });

  // Check if reset token is provided in URL
  React.useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setState((prev) => ({
        ...prev,
        stage: 'reset',
        resetToken: token,
      }));
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Please enter your email address',
        },
      }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(state.email)) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Please enter a valid email address',
        },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, resetMessage: null }));

    try {
      // Check if email exists in our database
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', state.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          resetMessage: {
            type: 'error',
            message: 'Email not found. Please sign up first.',
          },
        }));
        return;
      }

      const userData = querySnapshot.docs[0].data();

      // Check if account is Google account
      if (userData.authMethod === 'google') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          resetMessage: {
            type: 'error',
            message: 'This account is registered with Google. Please use Google Sign-In instead.',
          },
        }));
        return;
      }

      // For now, we'll show a simplified message
      // In production, you would send an email with a reset link
      const resetToken = crypto.randomBytes(32).toString('hex');

      setState((prev) => ({
        ...prev,
        isLoading: false,
        stage: 'reset',
        resetToken: resetToken,
        resetMessage: {
          type: 'success',
          message: `Password reset link has been generated. Please enter your new password.`,
        },
      }));

      toast.success('Reset link generated. Please enter your new password.');
    } catch (error: any) {
      console.error('Reset request error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        resetMessage: {
          type: 'error',
          message: error.message || 'Failed to process password reset request',
        },
      }));
      toast.error('Failed to process password reset request');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.newPassword || !state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Please fill in all fields',
        },
      }));
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Passwords do not match',
        },
      }));
      return;
    }

    if (state.newPassword.length < 8) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Password must be at least 8 characters',
        },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, resetMessage: null }));

    try {
      // Hash the new password
      const hashedPassword = crypto
        .createHash('sha256')
        .update(state.newPassword)
        .digest('hex');

      // Update password in database
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', state.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocId = querySnapshot.docs[0].id;
        const userRef = doc(db, 'users', userDocId);

        await updateDoc(userRef, {
          password: hashedPassword,
          updatedAt: new Date(),
        });

        toast.success('✓ Password reset successfully! Redirecting to sign in...');

        setState((prev) => ({
          ...prev,
          isLoading: false,
          stage: 'success',
          resetMessage: {
            type: 'success',
            message: '✓ Password has been reset successfully!',
          },
        }));

        // Redirect to signin after 2 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        resetMessage: {
          type: 'error',
          message: error.message || 'Failed to reset password',
        },
      }));
      toast.error('Failed to reset password');
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
        {state.stage !== 'success' && (
          <Card className="border-2 border-amber-100 shadow-xl">
            {/* Header with Logo */}
            <CardHeader className="pb-6 bg-gradient-to-b from-white to-amber-50/50 border-b-2 border-amber-100">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-4"
              >
                <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center shadow-lg">
                  <Image
                    src="/images/Logo/Logo seilerstubb.png"
                    alt="Seiler Stubb Logo"
                    width={50}
                    height={50}
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-slate-900 text-center"
              >
                {state.stage === 'request' ? 'Reset Password' : 'New Password'}
              </motion.h1>
              <CardDescription className="text-center text-slate-600 mt-2">
                {state.stage === 'request'
                  ? 'Enter your email to reset your password'
                  : 'Enter your new password'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-8">
              {/* Reset Message (Success/Error) */}
              {state.resetMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-start gap-3 border mb-6 ${
                    state.resetMessage.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {state.resetMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      state.resetMessage.type === 'success'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {state.resetMessage.message}
                  </span>
                </motion.div>
              )}

              {state.stage === 'request' ? (
                // Request Reset Stage
                <form onSubmit={handleRequestReset} className="space-y-5">
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
                        onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
                        className="pl-10 bg-white border-2 border-amber-100 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                        disabled={state.isLoading}
                      />
                    </div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
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
                        Processing...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send Reset Link
                      </>
                    )}
                  </motion.button>
                </form>
              ) : (
                // Reset Password Stage
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* New Password Field */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="newPassword" className="text-slate-700 font-semibold text-sm">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                      <Input
                        id="newPassword"
                        type={state.showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={state.newPassword}
                        onChange={(e) => setState((prev) => ({ ...prev, newPassword: e.target.value }))}
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
                    transition={{ delay: 0.25 }}
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
                        placeholder="Confirm new password"
                        value={state.confirmPassword}
                        onChange={(e) => setState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
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

                  {/* Reset Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
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
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Reset Password
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* Back to Sign In Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-4 border-t border-amber-100 mt-6"
              >
                <p className="text-center text-slate-600 text-sm">
                  Remember your password?{' '}
                  <Link href="/auth/signin" className="text-amber-600 hover:text-amber-700 font-bold flex items-center justify-center gap-1 mt-3">
                    Sign in here <ArrowRight className="w-4 h-4" />
                  </Link>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        )}

        {state.stage === 'success' && (
          <Card className="border-2 border-green-200 bg-green-50 shadow-xl">
            <CardContent className="pt-12 pb-12 text-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="mb-6"
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-green-700 mb-2"
              >
                Password Reset Successful!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-green-600 mb-6"
              >
                Your password has been reset successfully. Redirecting to sign in...
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link href="/auth/signin" className="text-amber-600 hover:text-amber-700 font-bold inline-flex items-center gap-1 transition-colors">
                  Go to Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-500 text-xs mt-6"
        >
          Your password will be securely stored
        </motion.p>

        {/* Back to home link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-4"
        >
          <Link href="/" className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 transition-colors">
            ← Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
