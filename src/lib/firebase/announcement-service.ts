import { db } from './config';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface CurrentAnnouncement {
  active: boolean;
  title: string;
  message: string;
  updatedAt: Timestamp | null;
  version: string;
}

export const getCurrentAnnouncement = async (): Promise<CurrentAnnouncement | null> => {
  try {
    const docRef = doc(db, 'announcements', 'current');
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        active: data.active || false,
        title: data.title || '',
        message: data.message || '',
        updatedAt: data.updatedAt || null,
        version: data.version || '',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching current announcement:', error);
    return null;
  }
};

export const saveCurrentAnnouncement = async (
  announcement: Omit<CurrentAnnouncement, 'updatedAt' | 'version'>
): Promise<void> => {
  try {
    const docRef = doc(db, 'announcements', 'current');
    const version = Date.now().toString();
    
    await setDoc(docRef, {
      ...announcement,
      updatedAt: serverTimestamp(),
      version: version,
    });
  } catch (error) {
    console.error('Error saving current announcement:', error);
    throw error;
  }
};
