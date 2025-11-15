// This file handles initializing the database with sample data if it doesn't exist
import { collection, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './service-utils';

console.log('Firebase initialize-db loaded, collections:', COLLECTIONS);

// Sample data for initial seeding
const sampleMenuItems = [
  {
    name: "Schnitzel Wiener Art",
    description: "Traditional German breaded veal cutlet served with lemon and parsley",
    price: 18.5,
    category: "German Main",
    imageUrl: "https://ik.imagekit.io/6ftxk3eun/schnitzel.jpg",
    isAvailable: true,
    isVegetarian: false,
    featured: true,
    order: 1
  },
  {
    name: "Chicken Tikka Masala",
    description: "Grilled chicken in creamy tomato sauce with Indian spices",
    price: 17.5,
    category: "Indian Main",
    imageUrl: "https://ik.imagekit.io/6ftxk3eun/tikka-masala.jpg",
    isAvailable: true,
    isVegetarian: false,
    featured: true,
    order: 2
  },
  {
    name: "Tandoori Mixed Grill",
    description: "Selection of meats marinated and cooked in the tandoor oven",
    price: 24.5,
    category: "Indian Main",
    imageUrl: "https://ik.imagekit.io/6ftxk3eun/tandoori-grill.jpg",
    isAvailable: true,
    isVegetarian: false,
    featured: true,
    order: 3
  }
];

const sampleReservations = [
  {
    userName: "Lukas Schmidt",
    userEmail: "lukas.schmidt@example.com",
    userPhone: "+49 176 12345678",
    date: new Date("2025-10-20"),
    time: "7:00 PM",
    people: 2,
    note: "Anniversary dinner",
    status: "confirmed"
  },
  {
    userName: "Maria Weber",
    userEmail: "maria.weber@example.com",
    userPhone: "+49 176 87654321",
    date: new Date("2025-10-18"),
    time: "8:00 PM",
    people: 4,
    note: "Birthday celebration",
    status: "pending"
  },
  {
    userName: "Thomas Müller",
    userEmail: "thomas.mueller@example.com",
    userPhone: "+49 176 23456789",
    date: new Date("2025-10-15"),
    time: "6:30 PM",
    people: 3,
    status: "pending"
  }
];

const sampleUsers = [
  {
    displayName: "Admin User",
    email: "admin@example.com",
    role: "admin",
    phoneNumber: "+49 176 11112222"
  },
  {
    displayName: "Regular User",
    email: "user@example.com",
    role: "user",
    phoneNumber: "+49 176 33334444"
  }
];

/**
 * Initializes collections with sample data if they are empty
 * This helps ensure that the admin dashboard always has something to display
 */
export async function initializeFirestoreCollections() {
  console.log('Starting database initialization check...');
  try {
    // Check and seed menu items
    console.log('Checking menu items collection...');
    const menuSnapshot = await getDocs(collection(db, COLLECTIONS.MENU_ITEMS));
    console.log('Menu items check complete:', menuSnapshot.empty ? 'empty' : `contains ${menuSnapshot.size} items`);
    if (menuSnapshot.empty) {
      console.log('Initializing menu items collection with sample data');
      for (const item of sampleMenuItems) {
        await addDoc(collection(db, COLLECTIONS.MENU_ITEMS), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Check and seed reservations
    console.log('Checking reservations collection...');
    const reservationsSnapshot = await getDocs(collection(db, COLLECTIONS.RESERVATIONS));
    console.log('Reservations check complete:', reservationsSnapshot.empty ? 'empty' : `contains ${reservationsSnapshot.size} items`);
    if (reservationsSnapshot.empty) {
      console.log('Initializing reservations collection with sample data');
      for (const reservation of sampleReservations) {
        await addDoc(collection(db, COLLECTIONS.RESERVATIONS), {
          ...reservation,
          date: Timestamp.fromDate(reservation.date),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Check and seed users
    console.log('Checking users collection...');
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    console.log('Users check complete:', usersSnapshot.empty ? 'empty' : `contains ${usersSnapshot.size} items`);
    if (usersSnapshot.empty) {
      console.log('Initializing users collection with sample data');
      for (const user of sampleUsers) {
        await addDoc(collection(db, COLLECTIONS.USERS), {
          ...user,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    console.log('Database initialization check complete');
  } catch (error) {
    console.error('Error initializing Firestore collections:', error);
  }
}
