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
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import crypto from 'crypto';

interface SignInState {
  stage: 'form' | 'otp';
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  signInMessage: { type: 'success' | 'error'; message: string } | null;
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
    otpExpiryTime: null,
  });

  // Handle redirect result from Google Sign-In on mobile
  useEffect(() => {
    let isMounted = true;
    

    
    return () => {
      isMounted = false;
    };
  }, [redirect, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email || !state.password) {
      setState((prev) => ({
        ...prev,
        signInMessage: { type: 'error', message: 'Bitte geben Sie Ihre E-Mail und Ihr Passwort ein' },
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
            message: 'E-Mail nicht gefunden. Bitte registrieren Sie sich zuerst.',
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
            message: 'Dieses Konto ist mit Google registriert. Bitte verwenden Sie Google-Anmeldung.',
          },
        }));
        return;
      }

      // Verify password against Firestore hashed password
      // This works for both old Firestore-only accounts and new Firebase Auth accounts
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
            message: 'Ungültige E-Mail oder Passwort',
          },
        }));
        return;
      }

      console.log('[SignIn] Firestore password verified successfully');

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
          throw new Error(errorData.error || 'Fehler beim Senden der E-Mail');
        }

        const emailResult = await emailResponse.json();
        console.log('✅ Email sent successfully:', emailResult);
      } catch (emailError: any) {
        console.error('❌ Error sending OTP email:', emailError);
        toast.error('Fehler beim Senden der OTP-E-Mail. Bitte versuchen Sie es erneut.');
        setState((prev) => ({
          ...prev,
          isLoading: false,
          signInMessage: {
            type: 'error',
            message: 'Fehler beim Senden der OTP-E-Mail. Bitte versuchen Sie es erneut.',
          },
        }));
        return;
      }

      toast.success(`OTP an ${state.email} gesendet`);

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

      // OTP verified! Call backend to authenticate and create Firebase Auth account if needed
      try {
        console.log('[SignIn] Calling backend authentication API...');
        const authResponse = await fetch('/api/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: state.email,
            password: state.password,
          }),
        });

        console.log(`[SignIn] Backend response status: ${authResponse.status}`);
        const authData = await authResponse.json();
        console.log(`[SignIn] Backend response data:`, authData);

        if (!authResponse.ok) {
          const errorMessage = authData.error || authData.details || `HTTP ${authResponse.status}`;
          console.error('[SignIn] Backend authentication failed:', errorMessage);
          throw new Error(errorMessage);
        }

        console.log('[SignIn] Backend authentication successful');

        // If we got a custom token, sign in with it
        if (authData.customToken) {
          try {
            const { signInWithCustomToken } = await import('firebase/auth');
            await signInWithCustomToken(auth, authData.customToken);
            console.log('[SignIn] User signed in with custom token');
          } catch (tokenError: any) {
            console.error('[SignIn] Error signing in with custom token:', tokenError);
            // Continue anyway - user is verified via backend
          }
        }
      } catch (authError: any) {
        console.error('[SignIn] Final authentication error:', authError);
        toast.error(`Authentication failed: ${authError.message}`);
        return;
      }

      toast.success('✓ Anmeldung bestätigt! Umleitung läuft...');
      setState((prev) => ({
        ...prev,
        signInMessage: {
          type: 'success',
          message: '✓ Erfolgreich angemeldet! Umleitung läuft...',
        },
      }));

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push(redirect);
      }, 2000);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'OTP-Verifikation fehlgeschlagen');
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
          throw new Error(errorData.error || 'Fehler beim Senden der E-Mail');
        }

        const emailResult = await emailResponse.json();
        console.log('✅ Email resent successfully:', emailResult);
      } catch (emailError: any) {
        console.error('❌ Error resending OTP email:', emailError);
        toast.error('Fehler beim erneuten Senden der OTP-E-Mail. Bitte versuchen Sie es erneut.');
        return;
      }

      toast.success('OTP erneut an Ihre E-Mail gesendet');

      const expiryTime = await getOTPExpiryTime(state.email);
      setState((prev) => ({
        ...prev,
        otpExpiryTime: expiryTime,
      }));
    } catch (error: any) {
      console.error('OTP resend error:', error);
      toast.error(error.message || 'Fehler beim erneuten Senden der OTP');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-amber-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-300/5 rounded-full blur-3xl -z-10"></div>

      {state.stage === 'form' ? (
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
                  <h1 className="text-3xl font-bold text-slate-900">Willkommen zurück</h1>
                  <CardDescription className="text-slate-600 text-base mt-2">
                    Melden Sie sich bei Ihrem Restaurant-Konto an
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
                    E-Mail-Adresse
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="sie@beispiel.com"
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
                    Passwort
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                    <Input
                      id="password"
                      type={state.showPassword ? 'text' : 'password'}
                      placeholder="Geben Sie Ihr Passwort ein"
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
                    Passwort vergessen?
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
                      Wird angemeldet...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Anmelden
                    </>
                  )}
                </motion.button>
              </form>

              {/* Sign Up Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="pt-4 border-t border-amber-100"
              >
                <p className="text-center text-slate-600 text-sm">
                  Haben Sie noch kein Konto?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-amber-600 hover:text-amber-700 font-bold flex items-center justify-center gap-1 mt-3"
                  >
                    Jetzt erstellen <ArrowRight className="w-4 h-4" />
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
            Durch die Anmeldung akzeptieren Sie unsere Nutzungsbedingungen und Datenschutzrichtlinie
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
              ← Zurück zur Startseite
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
