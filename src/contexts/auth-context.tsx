'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUser,
  signInWithGoogle 
} from '@/lib/firebase/config';
import { 
  createNewUser, 
  getUser, 
  createOrUpdateUser 
} from '@/lib/firebase/user-service';
import { recordUserLogin } from '@/lib/firebase/user-tracking-service';
import { User } from '@/types';
import { COLLECTIONS } from '@/lib/firebase/service-utils';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleProvider: () => Promise<void>;
  signInWithPhoneNumber: (phoneNumber: string) => Promise<string>;
  verifyPhoneOTP: (verificationId: string, verificationCode: string) => Promise<void>;
  signUpWithPhone: (phoneNumber: string, name: string) => Promise<string>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle Google Sign-In redirect result FIRST
    let handleRedirectDone = false;
    
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Auth Context: Checking for redirect result...');
        
        // Check if we're returning from Google Sign-In
        const isGoogleSignInInProgress = sessionStorage.getItem('google_signin_in_progress');
        console.log('Google sign-in in progress flag:', isGoogleSignInInProgress);
        
        if (isGoogleSignInInProgress) {
          console.log('✅ Google sign-in redirect detected, processing...');
          sessionStorage.removeItem('google_signin_in_progress');
        }
        
        const { getRedirectResult } = await import('firebase/auth');
        
        // Add timeout to prevent hanging on redirect result
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('⚠️ getRedirectResult timeout - no result available');
            resolve(null);
          }, 5000); // 5 second timeout
        });

        const result = await Promise.race([
          getRedirectResult(auth),
          timeoutPromise
        ]) as any;
        
        if (result && result.user) {
          const fbUser = result.user;
          console.log('✓ Auth Context: Google redirect sign-in detected:', fbUser.email);
          console.log('✓ Auth Context: User UID:', fbUser.uid);
          console.log('✓ Auth Context: Display Name:', fbUser.displayName);
          
          // Create or update user in database
          try {
            await createOrUpdateUser(fbUser.uid, {
              email: fbUser.email || '',
              displayName: fbUser.displayName || undefined,
              photoURL: fbUser.photoURL || undefined,
              phoneNumber: fbUser.phoneNumber || undefined,
            });
            console.log('✓ Auth Context: User data created/updated from redirect');
          } catch (dbError) {
            console.error('⚠️ Auth Context: Error updating user in database:', dbError);
            // Continue anyway - user is authenticated even if DB update failed
          }
          
          // Get stored redirect URL and return path
          const redirectUrl = sessionStorage.getItem('google_signin_redirect_url');
          const returnPath = sessionStorage.getItem('google_signin_return_path');
          
          console.log('📍 Stored redirect URL:', redirectUrl);
          console.log('📍 Stored return path:', returnPath);
          
          // Clear stored URLs
          sessionStorage.removeItem('google_signin_redirect_url');
          sessionStorage.removeItem('google_signin_return_path');
          
          // Redirect back to original page or home
          let destinationUrl = '/';
          
          if (returnPath && returnPath !== '/auth/signin') {
            // User came from somewhere other than signin page - redirect back there
            destinationUrl = returnPath;
            console.log('🎯 Redirecting to original page:', destinationUrl);
          } else if (redirectUrl) {
            // Use the full stored URL
            try {
              const urlObj = new URL(redirectUrl);
              destinationUrl = urlObj.pathname + urlObj.search;
              console.log('🎯 Redirecting to stored URL:', destinationUrl);
            } catch (e) {
              console.warn('Invalid redirect URL, using home:', redirectUrl);
            }
          }
          
          // Use a small delay to ensure state is updated, then redirect
          setTimeout(() => {
            console.log('➡️ Performing redirect to:', destinationUrl);
            window.location.href = destinationUrl;
          }, 500);
          
        } else {
          console.log('✓ Auth Context: No redirect result (user came to page normally)');
        }
      } catch (error: any) {
        if (error.code !== 'auth/no-auth-event') {
          console.error('⚠️ Error handling redirect result:', error.code, error.message);
        }
      } finally {
        handleRedirectDone = true;
      }
    };

    // Set up the auth state listener
    let unsubscribe: (() => void) | null = null;
    
    const setupAuthListener = async () => {
      // Wait for redirect handling to complete
      while (!handleRedirectDone) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('🔐 Auth Context: Setting up auth state listener...');
      
      // Now set up the listener
      unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
        console.log('🔄 Auth State Changed:', fbUser ? `✅ User: ${fbUser.email}` : '❌ Not authenticated');
        
        setFirebaseUser(fbUser);
        
        if (fbUser) {
          try {
            console.log('📋 Auth Context: Fetching user data from Firestore...');
            const userData = await getUser(fbUser.uid);
            
            if (userData) {
              console.log('✅ Auth Context: User data found in Firestore');
              setUser(userData);
            } else {
              console.log('📝 Auth Context: No user data found, creating new user...');
              // Create a user document if it doesn't exist
              const newUser = await createNewUser(
                fbUser.uid,
                fbUser.email || '',
                fbUser.displayName,
                fbUser.phoneNumber,
                fbUser.photoURL
              );
              console.log('✅ Auth Context: New user created:', newUser);
              setUser(newUser);
            }

            // Record user login (IP address, timestamp)
            console.log('📊 Auth Context: Recording user login...');
            await recordUserLogin(fbUser.uid);
          } catch (error) {
            console.error('❌ Error fetching/creating user data:', error);
            setUser(null);
          }
        } else {
          console.log('🚪 Auth Context: User logged out');
          setUser(null);
        }
        
        console.log('✅ Auth Context: Loading complete');
        setIsLoading(false);
      });
    };

    // Start both processes
    handleRedirectResult();
    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    try {
      const userCredential = await createUser(email, password);
      const { uid } = userCredential.user;
      
      const newUser = await createNewUser(
        uid,
        email,
        name,
        phone
      );
      
      setUser(newUser);
    } catch (error) {
      console.error('Error during sign up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(email, password);
      
      // Get the current user after sign-in
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Record the login immediately
        await recordUserLogin(currentUser.uid);
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  };
  
  const signInWithGoogleProvider = async () => {
    try {
      const result = await signInWithGoogle();
      const fbUser = result?.user;
      
      // If this is their first Google sign-in, createOrUpdateUser will handle it
      if (fbUser) {
        await createOrUpdateUser(fbUser.uid, {
          email: fbUser.email || '',
          displayName: fbUser.displayName || undefined,
          photoURL: fbUser.photoURL || undefined,
          phoneNumber: fbUser.phoneNumber || undefined,
        });

        // Record the login
        await recordUserLogin(fbUser.uid);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithPhoneNumber = async (phoneNumber: string): Promise<string> => {
    try {
      const { sendPhoneVerificationCode } = await import('@/lib/firebase/phone-auth-service');
      const { initializeRecaptcha } = await import('@/lib/firebase/phone-auth-service');
      
      const recaptchaVerifier = initializeRecaptcha();
      if (!recaptchaVerifier) {
        throw new Error('Failed to initialize reCAPTCHA');
      }
      
      const verificationId = await sendPhoneVerificationCode(phoneNumber, recaptchaVerifier);
      return verificationId;
    } catch (error) {
      console.error('Error signing in with phone:', error);
      throw error;
    }
  };

  const verifyPhoneOTP = async (verificationId: string, verificationCode: string): Promise<void> => {
    try {
      const { verifyPhoneOTP: verifyOTP, trackPhoneAuthUsage } = await import('@/lib/firebase/phone-auth-service');
      const result = await verifyOTP(verificationId, verificationCode);
      
      if (result.user) {
        const { createOrUpdateUser } = await import('@/lib/firebase/user-service');
        await createOrUpdateUser(result.user.uid, {
          email: result.user.email || undefined,
          phoneNumber: result.user.phoneNumber || undefined,
          displayName: result.user.displayName || undefined,
          photoURL: result.user.photoURL || undefined,
        });

        // Record the login
        await recordUserLogin(result.user.uid);
        
        await trackPhoneAuthUsage(result.user.uid, 'signin');
      }
    } catch (error) {
      console.error('Error verifying phone OTP:', error);
      throw error;
    }
  };

  const signUpWithPhone = async (phoneNumber: string, name: string): Promise<string> => {
    try {
      const { sendPhoneVerificationCode, trackPhoneAuthUsage } = await import('@/lib/firebase/phone-auth-service');
      const { initializeRecaptcha } = await import('@/lib/firebase/phone-auth-service');
      
      const recaptchaVerifier = initializeRecaptcha();
      if (!recaptchaVerifier) {
        throw new Error('Failed to initialize reCAPTCHA');
      }
      
      const verificationId = await sendPhoneVerificationCode(phoneNumber, recaptchaVerifier);
      
      // Track that a signup attempt was made
      // We'll track the actual signup in the verification step
      
      return verificationId;
    } catch (error) {
      console.error('Error signing up with phone:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    isLoading,
    signUp,
    signIn,
    signInWithGoogleProvider,
    signInWithPhoneNumber,
    verifyPhoneOTP,
    signUpWithPhone,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
