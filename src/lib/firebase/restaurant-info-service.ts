import { 
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { RestaurantInfo } from '@/types';

const COLLECTION_NAME = 'restaurantInfo';
const DOCUMENT_ID = 'info';

export const getRestaurantInfo = async (): Promise<RestaurantInfo | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    console.log('Getting restaurant info from:', COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Restaurant info retrieved successfully:', data);
      console.log('Opening hours data:', data.openingHours);
      return {
        ...data,
        id: DOCUMENT_ID
      } as RestaurantInfo;
    }
    
    console.warn('Restaurant info document does not exist. Please visit /setup to initialize.');
    return null;
  } catch (error) {
    console.error('Error getting restaurant info:', error);
    throw error;
  }
};

export const updateRestaurantInfo = async (info: Partial<RestaurantInfo>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    
    // Add validation and logging for important settings
    if (info.openingHours) {
      console.log('📝 Updating opening hours:', info.openingHours);
      
      // Special check for Sunday data
      if (info.openingHours.sonntag) {
        console.log('🔍 Sonntag data being saved:', info.openingHours.sonntag);
      } else if ((info.openingHours as any).sunday) {
        console.log('🔍 Sunday data being saved:', (info.openingHours as any).sunday);
        console.warn('⚠️ Found English "sunday" instead of German "sonntag". Converting...');
        info.openingHours.sonntag = (info.openingHours as any).sunday;
      } else {
        console.error('❌ No Sunday/Sonntag data found in the update!');
      }
    }
    
    if (info.reservationTimeSlots) {
      console.log('Updating reservation time slots:', info.reservationTimeSlots);
    }
    
    if (info.mondayClosed !== undefined) {
      console.log('Monday closed setting:', info.mondayClosed);
    }
    
    if (docSnap.exists()) {
      console.log('📤 Merging update with existing document...');
      await setDoc(docRef, {
        ...docSnap.data(),
        ...info,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Opening hours saved successfully to Firebase!');
    } else {
      console.log('📤 Creating new document with update...');
      await setDoc(docRef, {
        ...info,
        id: DOCUMENT_ID,
        updatedAt: serverTimestamp()
      });
      console.log('✅ New document created successfully!');
    }
  } catch (error: any) {
    console.error('Error updating restaurant info:', error);
    
    // Better error handling for permission issues
    if (error?.code === 'permission-denied') {
      console.error('Firebase permission denied error. User likely needs admin role:', error);
      throw new Error('Missing or insufficient permissions. Sie haben keine Berechtigung, diese Daten zu ändern. Bitte besuchen Sie /admin-helper um Admin-Rechte zu erhalten.');
    } else if (error?.message?.includes('permission')) {
      console.error('Firebase permission error:', error);
      throw new Error('Berechtigungsfehler: Sie haben keine ausreichenden Rechte für diesen Vorgang. Bitte besuchen Sie /admin-helper um Admin-Rechte zu erhalten.');
    } else {
      console.error('Unknown Firebase error:', error);
      throw error;
    }
  }
};
