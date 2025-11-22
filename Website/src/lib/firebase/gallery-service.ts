import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { GalleryItem } from '@/types';
import { COLLECTIONS } from './service-utils';
import { deleteImageFromImageKit, generateSignedUrl } from '@/lib/imagekit-client';

const COLLECTION_NAME = COLLECTIONS.GALLERY;

// Real-time listener for gallery items
export const subscribeToGalleryItems = (callback: (items: GalleryItem[]) => void, onError?: (error: Error) => void): Unsubscribe => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    console.log('Setting up real-time gallery listener');
    return onSnapshot(q, (querySnapshot) => {
      const result = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as GalleryItem;
      });
      console.log('Gallery items updated:', result.length);
      callback(result);
    }, (error) => {
      console.error('Error in gallery listener:', error);
      if (onError) onError(error as Error);
    });
  } catch (error) {
    console.error('Error setting up gallery listener:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  console.log(`Fetching gallery items from collection: ${COLLECTION_NAME}`);
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    console.log('Created query with displayOrder sort');
    const querySnapshot = await getDocs(q);
    console.log(`Got ${querySnapshot.size} gallery items from Firestore`);
    
    const result = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Gallery item ${doc.id}:`, data);
      return {
        id: doc.id,
        ...data
      } as GalleryItem;
    });
    
    console.log('Processed gallery items:', result);
    return result;
  } catch (error) {
    console.error('Error getting gallery items:', error);
    throw error;
  }
};

export const getGalleryItem = async (id: string): Promise<GalleryItem | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as GalleryItem;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting gallery item with id:", error);
    throw error;
  }
};

export const createGalleryItem = async (galleryItem: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<string> => {
  try {
    console.log('Creating gallery item with data:', galleryItem);
    
    // Make sure we have the displayOrder field
    const itemToCreate = {
      ...galleryItem,
      displayOrder: galleryItem.displayOrder || 0,
      createdAt: serverTimestamp()
    };
    
    console.log('Final gallery item data to store:', itemToCreate);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), itemToCreate);
    console.log('Gallery item created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating gallery item:', error);
    throw error;
  }
};

export const updateGalleryItem = async (id: string, galleryItem: Partial<GalleryItem>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    await updateDoc(docRef, galleryItem);
  } catch (error) {
    console.error("Error updating gallery item with id:", error);
    throw error;
  }
};

export const deleteGalleryItem = async (id: string): Promise<void> => {
  try {
    // First get the item to retrieve the ImageKit file ID
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const galleryItem = docSnap.data() as GalleryItem;
      
      // Delete from ImageKit if fileId exists
      if (galleryItem.imageKitFileId) {
        try {
          await deleteImageFromImageKit(galleryItem.imageKitFileId);
          console.log(`✅ Image deleted from ImageKit: ${galleryItem.imageKitFileId}`);
        } catch (error) {
          console.warn('Could not delete from ImageKit, but continuing:', error);
        }
      }
    }
    
    // Delete from Firestore
    await deleteDoc(docRef);
    console.log(`✅ Gallery item deleted from Firestore: ${id}`);
  } catch (error) {
    console.error("Error deleting gallery item with id:", error);
    throw error;
  }
};
