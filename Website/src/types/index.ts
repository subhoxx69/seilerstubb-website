// Types for the application

// User type
export type User = {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  createdAt: Date;
};

// Menu item type
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  order?: number; // Optional order field with default value for sorting
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  featured?: boolean;
  createdAt: Date;
  updatedAt?: Date;
};

// Menu category type
export type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
};

// Reservation type
export type Reservation = {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  people: number;
  note?: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'modified';
  reasonForChange?: string;
  reasonForDecline?: string;
  createdAt: Date;
  updatedAt?: Date | null;
};

// Gallery item type
export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  imageKitFileId?: string; // ImageKit file ID for management
  imagePath?: string; // ImageKit file path
  tags?: string[];
  displayOrder?: number;
  createdAt: Date;
  updatedAt?: Date;
};

// Announcement type
export type Announcement = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  buttonText?: string;
  buttonLink?: string;
  createdAt: Date;
  updatedAt?: Date;
};

// Restaurant settings type
export type RestaurantSettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;  // Website URL
  aboutUs?: string;  // Restaurant description
  openingHours: {
    montag: { shifts: { open: string; close: string }[] } | { isClosed: true };
    dienstag: { shifts: { open: string; close: string }[] } | { isClosed: true };
    mittwoch: { shifts: { open: string; close: string }[] } | { isClosed: true };
    donnerstag: { shifts: { open: string; close: string }[] } | { isClosed: true };
    freitag: { shifts: { open: string; close: string }[] } | { isClosed: true };
    samstag: { shifts: { open: string; close: string }[] } | { isClosed: true };
    sonntag: { shifts: { open: string; close: string }[] } | { isClosed: true };
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    yelp?: string;
    youtube?: string;
    google?: string;
    tiktok?: string;
    // Visibility settings for social media links
    visiblePlatforms?: {
      facebook: boolean;
      instagram: boolean;
      twitter: boolean;
      yelp: boolean;
      youtube: boolean;
      google: boolean;
      tiktok: boolean;
    };
  };
  areas: {
    indoor: {
      title: string;      // "Innenbereich"
      description: string; // "Gemütliche Atmosphäre im Restaurant"
      capacity: number;    // "Platz für bis zu 60 Personen"
    };
    outdoor: {
      title: string;      // "Außenbereich"
      description: string; // "Schöne Terrasse unter freiem Himmel"
      capacity: number;    // "Platz für bis zu 40 Personen"
    };
  };
  logoUrl?: string;
  bannerUrl?: string;
  updatedAt?: Date;
};

// Restaurant info type (extended settings used in database)
export type RestaurantInfo = RestaurantSettings & {
  id: string; // Document ID
  specialClosures?: {
    id: string;
    date: string; // YYYY-MM-DD format
    reason?: string;
  }[];
  mondayClosed?: boolean; // Flag for Monday closed status
  reservationTimeSlots?: {
    intervalMinutes: number; // Default interval between reservation slots (e.g. 30 mins)
    firstSlot: string;      // First available slot time (e.g. "17:00")
    lastSlot: string;       // Last available slot time (e.g. "21:30")
  };
  maxReservationSizePerTable?: number; // Maximum number of people per table
  maxReservationTablesPerSlot?: number; // Maximum tables available per time slot
  
  // Default initialization for new required fields
  areas: {
    indoor: {
      title: string;
      description: string;
      capacity: number;
    };
    outdoor: {
      title: string;
      description: string;
      capacity: number;
    };
  };
};
