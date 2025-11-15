import { serverTimestamp } from "firebase/firestore";

// Collections constants to ensure consistent naming across services
export const COLLECTIONS = {
  USERS: 'users',
  MENU_ITEMS: 'menuItems',
  RESERVATIONS: 'reservations',
  GALLERY: 'gallery',
  ANNOUNCEMENTS: 'announcements',
  RESTAURANT_INFO: 'restaurantInfo'
};

// Helper for adding timestamps to documents
export const addTimestamps = (data: any, isNew = true) => {
  const timestamps: { 
    updatedAt: any; 
    createdAt?: any;
  } = {
    updatedAt: serverTimestamp(),
  };
  
  if (isNew) {
    timestamps.createdAt = serverTimestamp();
  }
  
  return {
    ...data,
    ...timestamps
  };
};
