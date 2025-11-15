// Notifications feature has been removed

export interface NotificationPayload {
  reservation_status_change?: {
    status: 'accepted' | 'declined';
    reservationId: string;
    reason?: string;
  };
  support_message?: {
    threadId: string;
    snippet: string;
  };
}

export interface Notification {
  id: string;
  uid: string;
  type: 'reservation_status_change' | 'support_message';
  payload: NotificationPayload;
  createdAt: any;
  read: boolean;
  readAt: any;
  source: 'system';
  ttlDays: number;
}

export async function createNotification(
  uid: string,
  type: 'reservation_status_change' | 'support_message',
  payload: NotificationPayload
): Promise<string> {
  return '';
}

export async function getUserNotifications(uid: string, pageSize: number = 20) {
  return [];
}

export async function getUnreadNotificationCount(uid: string) {
  return 0;
}

export async function markNotificationAsRead(id: string) {
  // No-op
}

export async function markNotificationsAsRead(ids: string[]) {
  // No-op
}

export async function markAllNotificationsAsRead(uid: string) {
  // No-op
}
