// Admin constants and configurations

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export const MAIN_ADMIN_EMAILS = [
  'admin@seilerstubb.de',
  'subhoxyysexy@gmail.com',
  'subjeets83@gmail.com',
  'seilerstubbwiesbaden@gmail.com',
  'noreplyseilerstubb@gmail.com',
];

export const ADMIN_FEATURES = {
  USER_MANAGEMENT: 'user_management',
  MENU_MANAGEMENT: 'menu_management',
  RESERVATION_MANAGEMENT: 'reservation_management',
  ANALYTICS: 'analytics',
  GALLERY_MANAGEMENT: 'gallery_management',
  CONTACT_MESSAGES: 'contact_messages',
  SETTINGS: 'settings',
} as const;
