'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Suspense } from 'react';

function UserProtectionContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to signin with the current path as redirect
      const redirectPath = pathname || '/routes/user/menu';
      router.push(`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export function UserProtection({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-amber-600 mb-4"></div>
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <UserProtectionContent>{children}</UserProtectionContent>
    </Suspense>
  );
}
