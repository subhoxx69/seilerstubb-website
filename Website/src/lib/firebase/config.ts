import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword as signInWithEmail,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZCHQpX6IMONGeECKOhQLJlhyfY5osbkY",
  authDomain: "seilerstubb-6731f.firebaseapp.com",
  projectId: "seilerstubb-6731f",
  storageBucket: "seilerstubb-6731f.firebasestorage.app",
  messagingSenderId: "951021513285",
  appId: "1:951021513285:web:4cf7bacdea3da39698512c",
  measurementId: "G-CW6K221EJE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence to LOCAL for all platforms (browser only)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Firebase persistence set to LOCAL');
    })
    .catch((error) => console.error('❌ Persistence error:', error));
}

// Initialize Analytics conditionally (browser only)
export const initializeAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// Email/password authentication
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    return await signInWithEmail(auth, email, password);
  } catch (error: any) {
    console.error('Email/password sign-in error:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please try again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw error;
    }
  }
};

export const createUser = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);
