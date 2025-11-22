import { auth } from './config';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// List of admin email addresses
const ADMIN_EMAILS = [
  'seilerstubbwiesbaden@gmail.com',
  'subhoxyysexy@gmail.com',
  'subjeets83@gmail.com',
];

// Monitor auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign out user
export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      return userSnapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Create user profile
export const createUserProfile = async (user: User): Promise<UserProfile> => {
  try {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, userProfile);
    
    return userProfile;
  } catch (error) {
    console.error('Create user profile error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

// Check if user is admin
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    
    // Check if user's email is in the admin whitelist
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      return true;
    }
    
    // Fallback to checking Firestore isAdmin flag
    const userProfile = await getUserProfile(uid);
    return userProfile?.isAdmin || false;
  } catch (error) {
    console.error('Check admin error:', error);
    return false;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Get current user's ID token (for backend requests)
export const getIdToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Get ID token error:', error);
    return null;
  }
};
