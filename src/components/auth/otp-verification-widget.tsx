'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

interface OTPVerificationWidgetProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string;
  successMessage?: string;
  expiryTime?: Date;
}

export function OTPVerificationWidget({
  email,
  onVerify,
  onResend,
  isLoading = false,
  errorMessage = '',
  successMessage = '',
  expiryTime,
}: OTPVerificationWidgetProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(errorMessage);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && !canResend && otp.some((digit) => digit)) {
      setCanResend(true);
    }
  }, [resendCountdown, canResend, otp]);

  // Start resend countdown on mount
  useEffect(() => {
    setResendCountdown(60); // 60 seconds
  }, []);

  // Update error message
  useEffect(() => {
    setError(errorMessage);
  }, [errorMessage]);

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      const newOTP = digits.split('');
      setOtp(newOTP);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otpCode);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setOtp(['', '', '', '', '', '']);
      setError('');
      setCanResend(false);
      setResendCountdown(60);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!expiryTime) return '';
    const now = new Date();
    const diff = expiryTime.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-200 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <motion.div
            animate={{ rotate: 0 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg"
          >
            <Mail className="w-8 h-8 text-white" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
            <p className="text-slate-600 text-sm mt-2">
              We sent a code to <span className="font-semibold text-amber-700">{email}</span>
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-green-50 border border-green-200"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-700">{successMessage}</p>
          </motion.div>
        )}

        {/* OTP Input Fields */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-4 text-center">
            Enter verification code
          </label>

          <div className="flex gap-3 justify-center mb-6">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isVerifying || isLoading}
                whileFocus={{ scale: 1.05 }}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-lg border-2 transition-all ${
                  digit
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-amber-200 bg-white text-slate-900 hover:border-amber-300'
                } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200`}
              />
            ))}
          </div>

          {/* Timer */}
          {timeRemaining && timeRemaining !== 'Expired' && (
            <p className="text-center text-sm font-medium text-slate-600">
              Code expires in: <span className="text-amber-600 font-bold">{timeRemaining}</span>
            </p>
          )}
          {timeRemaining === 'Expired' && (
            <p className="text-center text-sm font-medium text-red-600">
              Code has expired. Please request a new one.
            </p>
          )}
        </div>

        {/* Verify Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVerify}
          disabled={otp.some((digit) => !digit) || isVerifying || isLoading}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-amber-200/50 disabled:shadow-none"
        >
          {isVerifying || isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Verify Code
            </>
          )}
        </motion.button>

        {/* Resend Section */}
        <div className="mt-6 pt-6 border-t border-amber-200">
          <p className="text-center text-sm text-slate-600 mb-4">
            Didn't receive the code?
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResend}
            disabled={!canResend || isResending || isLoading}
            className="w-full py-2 border-2 border-amber-200 hover:border-amber-400 text-amber-700 hover:text-amber-900 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full"
                />
                Resending...
              </>
            ) : canResend ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Resend Code
              </>
            ) : (
              <>
                Resend in <span className="ml-1 font-bold">{resendCountdown}s</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-slate-500 mt-6">
          🔒 Your code is secure and will never be shared. Only paste codes from official emails.
        </p>
      </div>
    </motion.div>
  );
}
