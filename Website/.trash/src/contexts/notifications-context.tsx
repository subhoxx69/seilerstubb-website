'use client';

import { createContext, useContext, ReactNode } from 'react';

// Notifications feature has been removed

interface NotificationsContextType {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsReadMultiple: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const value: NotificationsContextType = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    refetch: async () => {},
    markAsRead: async () => {},
    markAsReadMultiple: async () => {},
    markAllAsRead: async () => {},
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
