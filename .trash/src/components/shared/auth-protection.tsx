'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface AuthProtectionProps {
  children: ReactNode;
}

export default function AuthProtection({ children }: AuthProtectionProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to homepage
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-stone-50 to-amber-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, don't show content
  if (user) {
    return null;
  }

  // If user is not logged in, show the page
  return <>{children}</>;
}
