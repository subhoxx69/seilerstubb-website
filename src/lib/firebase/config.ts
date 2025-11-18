import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword as signInWithEmail,
  createUserWithEmailAndPassword,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber as signInWithPhoneNum,
  signInWithCredential
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

// Initialize Analytics conditionally (browser only)
export const initializeAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// Auth providers
export const googleProvider = new GoogleAuthProvider();
// Configure Google provider with additional settings
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Helper: Check if device is iOS
export const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent);
};

export const signInWithGoogle = async () => {
  try {
    console.log('🔐 Starting Google Sign-In...');
    console.log('Current URL:', window.location.href);
    console.log('Current hostname:', window.location.hostname);
    
    // Detect if on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`Device: ${isMobile ? '📱 Mobile' : '🖥️ Desktop'}`);
    
    // For localhost and local IPs, ALWAYS use popup (most reliable for development)
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.');
    
    console.log(`Localhost/Local IP: ${isLocalhost}`);
    
    if (!isLocalhost && isMobile) {
      // 📱 MOBILE PRODUCTION: Use redirect flow
      console.log('📱 Production mobile - using redirect flow');
      
      // Store the current page so we return to it after auth
      const redirectUrl = window.location.href;
      sessionStorage.setItem('google_signin_redirect_url', redirectUrl);
      console.log('💾 Stored redirect URL:', redirectUrl);
      
      // Clear any previous auth attempt
      sessionStorage.removeItem('google_signin_in_progress');
      
      // Mark that we're starting auth
      sessionStorage.setItem('google_signin_in_progress', 'true');
      
      // IMPORTANT: Use redirect - this is the proper flow for mobile browsers
      await signInWithRedirect(auth, googleProvider);
      return null; // Never reached, page will redirect
    } else {
      // 🖥️ DESKTOP or LOCALHOST: Use popup flow (better UX for desktop/dev)
      console.log('🔄 Using popup flow (localhost/local or desktop)');
      try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('✅ Popup sign-in successful:', result.user.email);
        return result;
      } catch (popupError: any) {
        console.warn('Popup failed:', popupError.code);
        // Fallback to redirect if popup fails
        console.log('Falling back to redirect flow...');
        sessionStorage.setItem('google_signin_in_progress', 'true');
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
    }
  } catch (error: any) {
    console.error('❌ Google sign-in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific errors
    if (error.code === 'auth/popup-blocked') {
      console.log('Popup blocked, using redirect flow');
      try {
        sessionStorage.setItem('google_signin_in_progress', 'true');
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error('Redirect sign-in also failed:', redirectError);
        throw redirectError;
      }
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      console.error('⚠️ UNAUTHORIZED DOMAIN ERROR ⚠️');
      console.error('Current domain:', window.location.hostname);
      console.error('Current URL:', window.location.href);
      
      throw new Error(
        `❌ Domain not authorized in Firebase\n\n` +
        `Current: ${window.location.hostname}\n\n` +
        `📋 TO FIX THIS:\n` +
        `1. Go to https://console.firebase.google.com\n` +
        `2. Select project "seilerstubb-6731f"\n` +
        `3. Go to Authentication → Settings\n` +
        `4. Scroll to "Authorized domains"\n` +
        `5. Click "Add domain"\n` +
        `6. Add BOTH:\n` +
        `   • localhost:3000\n` +
        `   • 192.168.0.113:3000\n\n` +
        `After adding, refresh this page!`
      );
    }
    
    if (error.code === 'auth/operation-not-allowed') {
      console.error('Google Sign-In is not enabled in Firebase');
      throw new Error('Google-Anmeldung ist nicht aktiviert. Bitte kontaktieren Sie den Administrator.');
    }
    
    throw error;
  }
};

// Phone number authentication
export const sendPhoneVerificationCode = async (phoneNumber: string) => {
  try {
    // Create recaptcha verifier if not already created
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
      } as any);
    }

    const verifier = (window as any).recaptchaVerifier;
    const result = await signInWithPhoneNum(auth, phoneNumber, verifier as RecaptchaVerifier);
    return result;
  } catch (error: any) {
    console.error('Phone verification error:', error);
    
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number. Please check and try again.');
    }
    
    throw error;
  }
};

export const verifyPhoneOTP = async (confirmationResult: any, code: string) => {
  try {
    const result = await confirmationResult.confirm(code);
    return result;
  } catch (error: any) {
    console.error('OTP verification error:', error);
    
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please try again.');
    }
    
    throw error;
  }
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    return await signInWithEmail(auth, email, password);
  } catch (error: any) {
    console.error('Email/password sign-in error:', error);
    // Enhance the error message for common auth errors
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
