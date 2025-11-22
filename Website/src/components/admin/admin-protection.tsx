'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { isUserAdmin } from '@/lib/firebase/auth-context-service';
import { Suspense } from 'react';

function AdminProtectionContent({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        const redirectPath = pathname || '/routes/admin';
        router.push(`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`);
        setIsLoading(false);
        return;
      }

      // Check if user is admin
      const adminStatus = await isUserAdmin(user.uid);
      
      if (!adminStatus) {
        router.push('/unauthorized');
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-b-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

export function AdminProtection({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-b-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying admin access...</p>
          </div>
        </div>
      }
    >
      <AdminProtectionContent>{children}</AdminProtectionContent>
    </Suspense>
  );
}
