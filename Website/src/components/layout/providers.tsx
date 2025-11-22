'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { MaintenanceProvider } from '@/contexts/maintenance-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MaintenanceProvider>
        {children}
      </MaintenanceProvider>
    </AuthProvider>
  );
}
