'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { handleAppleSignInCallback } from '@/lib/firebase/apple-callback';
import { Loader } from 'lucide-react';

export default function AppleCallbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Processing Apple Sign-In...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        setMessage('🍎 Processing Apple Sign-In...');
        console.log('📍 On callback page, processing redirect result');

        const result = await handleAppleSignInCallback();

        if (result.success && result.user) {
          setMessage('✅ Sign-In successful! Redirecting...');
          console.log('✅ Apple Sign-In completed:', result.user.email);
          
          // Wait a moment for auth context to update, then redirect
          setTimeout(() => {
            router.push('/');
          }, 1000);
        } else {
          setMessage('❌ Apple Sign-In failed. Redirecting...');
          console.log('❌ No auth result:', result);
          
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
        }
      } catch (error: any) {
        setMessage(`❌ Error: ${error.message}`);
        console.error('Callback error:', error);
        
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Loader className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🍎 Apple Sign-In
        </h1>
        
        <p className="text-gray-600 mb-2">{message}</p>
        
        {!loading && (
          <p className="text-sm text-gray-500 mt-4">
            If you are not redirected automatically, <a href="/" className="text-orange-600 hover:underline">click here</a>.
          </p>
        )}
      </div>
    </div>
  );
}
