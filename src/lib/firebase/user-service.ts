import { 
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { User as FirebaseUser, UserCredential } from 'firebase/auth';
import { db, auth } from './config';
import { User } from '@/types';
import { COLLECTIONS, addTimestamps } from './service-utils';

const COLLECTION_NAME = COLLECTIONS.USERS;

/**
 * Get all users
 * Only accessible by admin users
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    // Check current authentication state
    if (!auth.currentUser) {
      console.warn('No authenticated user found when getting users');
      return [];
    }
    
    // Create the query
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`✅ Retrieved ${querySnapshot.docs.length} users`);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('❌ Error getting users:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
    // Still return empty array to prevent UI break, but log the error
    return [];
  }
};

/**
 * Get user by ID
 */
export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`✅ User document found: ${uid}`);
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    
    console.warn(`⚠️ User document not found: ${uid}`);
    return null;
  } catch (error) {
    console.error(`❌ Error getting user ${uid}:`, error);
    throw error;
  }
};

/**
 * Create or update user data
 * This will be called after authentication to store additional user data
 */
export const createOrUpdateUser = async (
  uid: string,
  userData: Partial<User>
): Promise<void> => {
  try {
    // Remove undefined values from userData to prevent Firestore errors
    const cleanedUserData: Record<string, any> = {};
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanedUserData[key] = value;
      }
    });
    
    console.log(`📝 Creating or updating user: ${uid}`);
    console.log(`   Data:`, cleanedUserData);
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing user
      console.log(`   Updating existing user document`);
      await setDoc(
        docRef, 
        addTimestamps(cleanedUserData, false), 
        { merge: true }
      );
      console.log(`✅ User updated: ${uid}`);
    } else {
      // Create new user with default role
      console.log(`   Creating new user document with role: ${cleanedUserData.role || 'user'}`);
      await setDoc(
        docRef, 
        addTimestamps({
          ...cleanedUserData,
          role: userData.role || 'user',
        })
      );
      console.log(`✅ User created: ${uid}`);
    }
  } catch (error) {
    console.error(`❌ Error creating or updating user ${uid}:`, error);
    throw error;
  }
};

/**
 * Create a new user after registration
 */
export const createNewUser = async (
  uid: string, 
  email: string, 
  displayName: string | null = null,
  phoneNumber: string | null = null,
  photoURL: string | null = null,
): Promise<User> => {
  try {
    // Set admin role only for specific email (must match Firestore rules)
    const adminEmails = ['subhoxyysexy@gmail.com', 'subjeets83@gmail.com', 'seilerstubbwiesbaden@gmail.com'];
    const isAdmin = adminEmails.includes(email.toLowerCase());
    
    const userData: Partial<User> = {
      id: uid,
      email,
      role: isAdmin ? 'admin' : 'user',
    };
    
    // Only add fields if they're not null or undefined
    if (displayName) userData.displayName = displayName;
    if (phoneNumber) userData.phoneNumber = phoneNumber;
    if (photoURL) userData.photoURL = photoURL;
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, addTimestamps(userData));
    
    return userData as User;
  } catch (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (uid: string, role: 'user' | 'admin'): Promise<void> => {
  try {
    console.log(`🔄 Updating user role: ${uid} -> ${role}`);
    const docRef = doc(db, COLLECTION_NAME, uid);
    
    await setDoc(docRef, addTimestamps({ role }, false), { merge: true });
    console.log(`✅ User role updated: ${uid} is now ${role}`);
  } catch (error) {
    console.error(`❌ Error updating role for user ${uid}:`, error);
    throw error;
  }
};
