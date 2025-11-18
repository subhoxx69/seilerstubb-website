'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { createOTP, verifyOTP, getOTPExpiryTime } from '@/lib/services/otp-service';

interface ResetPasswordState {
  stage: 'request' | 'otp' | 'reset' | 'success';
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  resetMessage: { type: 'success' | 'error'; message: string } | null;
  otpExpiryTime: Date | null;
}

function ResetPasswordContent() {
  const router = useRouter();
  const [state, setState] = useState<ResetPasswordState>({
    stage: 'request',
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    resetMessage: null,
    otpExpiryTime: null,
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Bitte geben Sie Ihre E-Mail-Adresse ein',
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
          message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
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
            message: 'E-Mail nicht gefunden. Bitte registrieren Sie sich zuerst.',
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
            message: 'Dieses Konto ist mit Google registriert. Bitte verwenden Sie Google-Anmeldung.',
          },
        }));
        return;
      }

      // Generate OTP
      const otpCode = await createOTP(state.email);
      console.log(`OTP generated for ${state.email}: ${otpCode}`);
      
      // Send OTP via Gmail API
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
          throw new Error(errorData.error || 'Failed to send OTP email');
        }

        const emailData = await emailResponse.json();
        console.log('✅ OTP email sent successfully:', emailData);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          stage: 'otp',
          resetMessage: {
            type: 'success',
            message: `OTP wurde an ${state.email} gesendet. Bitte überprüfen Sie Ihren Posteingang.`,
          },
        }));

        const expiryTime = await getOTPExpiryTime(state.email);
        setState((prev) => ({
          ...prev,
          otpExpiryTime: expiryTime,
        }));

        toast.success('OTP gesendet! Bitte überprüfen Sie Ihre E-Mail.');
      } catch (emailError: any) {
        console.error('❌ Error sending OTP email:', emailError);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          resetMessage: {
            type: 'error',
            message: `Fehler beim Versenden der OTP: ${emailError.message}`,
          },
        }));
        toast.error('Fehler beim Versenden der OTP');
        return;
      }
    } catch (error: any) {
      console.error('Reset request error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        resetMessage: {
          type: 'error',
          message: error.message || 'Fehler bei der Passwort-Zurücksetzen-Anfrage',
        },
      }));
      toast.error('Fehler bei der Anfrage');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.otp) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Bitte geben Sie den OTP-Code ein',
        },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, resetMessage: null }));

    try {
      const isValid = await verifyOTP(state.email, state.otp);

      if (!isValid) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          resetMessage: {
            type: 'error',
            message: 'Ungültiger oder abgelaufener OTP-Code',
          },
        }));
        toast.error('OTP ungültig');
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        stage: 'reset',
        resetMessage: {
          type: 'success',
          message: 'OTP bestätigt. Geben Sie Ihr neues Passwort ein.',
        },
      }));

      toast.success('OTP bestätigt!');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        resetMessage: {
          type: 'error',
          message: error.message || 'Fehler bei der OTP-Verifikation',
        },
      }));
      toast.error('Fehler bei OTP-Verifikation');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.newPassword || !state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Bitte füllen Sie alle Felder aus',
        },
      }));
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Passwörter stimmen nicht überein',
        },
      }));
      return;
    }

    if (state.newPassword.length < 8) {
      setState((prev) => ({
        ...prev,
        resetMessage: {
          type: 'error',
          message: 'Passwort muss mindestens 8 Zeichen lang sein',
        },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, resetMessage: null }));

    try {
      // Call backend API to reset password
      const resetResponse = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
          newPassword: state.newPassword,
        }),
      });

      if (!resetResponse.ok) {
        const errorData = await resetResponse.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      const resetData = await resetResponse.json();
      console.log('✅ Password reset successfully:', resetData);

      toast.success('✓ Passwort erfolgreich zurückgesetzt! Umleitung zum Anmelden...');

      setState((prev) => ({
        ...prev,
        isLoading: false,
        stage: 'success',
        resetMessage: {
          type: 'success',
          message: '✓ Passwort erfolgreich zurückgesetzt!',
        },
      }));

      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        resetMessage: {
          type: 'error',
          message: error.message || 'Fehler beim Zurücksetzen des Passworts',
        },
      }));
      toast.error('Fehler beim Zurücksetzen des Passworts');
    }
  };

  const handleBackToEmail = () => {
    setState((prev) => ({
      ...prev,
      stage: 'request',
      otp: '',
      resetMessage: null,
    }));
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
                {state.stage === 'request' ? 'Passwort Zurücksetzen' : state.stage === 'otp' ? 'OTP Bestätigung' : 'Neues Passwort'}
              </motion.h1>
              <CardDescription className="text-center text-slate-600 mt-2">
                {state.stage === 'request'
                  ? 'Geben Sie Ihre E-Mail ein, um Ihr Passwort zurückzusetzen'
                  : state.stage === 'otp'
                  ? 'Geben Sie den OTP-Code ein, den wir an Ihre E-Mail gesendet haben'
                  : 'Geben Sie Ihr neues Passwort ein'}
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
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        OTP senden
                      </>
                    )}
                  </motion.button>
                </form>
              ) : state.stage === 'otp' ? (
                // OTP Verification Stage
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  {/* OTP Field */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="otp" className="text-slate-700 font-semibold text-sm">
                      OTP-Code
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={state.otp}
                        onChange={(e) => setState((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                        className="pl-10 bg-white border-2 border-amber-100 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-center text-2xl tracking-widest"
                        disabled={state.isLoading}
                      />
                    </div>
                    {state.otpExpiryTime && (
                      <p className="text-xs text-slate-500">
                        OTP gültig bis: {state.otpExpiryTime.toLocaleTimeString('de-DE')}
                      </p>
                    )}
                  </motion.div>

                  {/* Verify Button */}
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
                        Wird überprüft...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        OTP Bestätigen
                      </>
                    )}
                  </motion.button>

                  {/* Back Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={state.isLoading}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                  >
                    Zurück
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
                      Neues Passwort
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                      <Input
                        id="newPassword"
                        type={state.showPassword ? 'text' : 'password'}
                        placeholder="Geben Sie ein neues Passwort ein"
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
                    <p className="text-xs text-slate-500">Mindestens 8 Zeichen</p>
                  </motion.div>

                  {/* Confirm Password Field */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-sm">
                      Passwort Bestätigen
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600/60 pointer-events-none" />
                      <Input
                        id="confirmPassword"
                        type={state.showConfirmPassword ? 'text' : 'password'}
                        placeholder="Bestätigen Sie Ihr neues Passwort"
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
                        Wird zurückgesetzt...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Passwort Zurücksetzen
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
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
