'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkMaintenanceMode } from '@/lib/firebase/maintenance-service';
import MaintenancePage from '@/components/maintenance/maintenance-page';

interface MaintenanceContextType {
  isUnderMaintenance: boolean;
  message: string;
  estimatedEndTime: string;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceContextType>({
    isUnderMaintenance: false,
    message: '',
    estimatedEndTime: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const info = await checkMaintenanceMode();
        if (info) {
          setMaintenanceInfo(info);
        }
      } catch (error) {
        console.error('Error checking maintenance:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();

    // Check every 30 seconds for maintenance status changes
    const interval = setInterval(checkMaintenance, 30000);

    return () => clearInterval(interval);
  }, []);

  // Show maintenance page if under maintenance
  // But allow admin pages to still be accessible
  if (maintenanceInfo.isUnderMaintenance && !loading) {
    // Check if user is on admin route - allow access
    if (typeof window !== 'undefined') {
      const isAdminRoute = window.location.pathname.startsWith('/routes/admin');
      if (!isAdminRoute) {
        return (
          <MaintenancePage
            message={maintenanceInfo.message}
            estimatedEndTime={maintenanceInfo.estimatedEndTime}
          />
        );
      }
    }
  }

  return <>{children}</>;
}

export function useMaintenanceMode() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenanceMode must be used within MaintenanceProvider');
  }
  return context;
}
