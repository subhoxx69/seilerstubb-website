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
  where
} from 'firebase/firestore';
import { db } from './config';
import { MenuItem } from '@/types';
import { COLLECTIONS } from './service-utils';

const COLLECTION_NAME = COLLECTIONS.MENU_ITEMS;

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    // Get all menu items
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MenuItem[];
    
    // Deduplicate items by name
    const uniqueItems = Array.from(
      new Map(items.map(item => [item.name + "-" + item.category, item]))
    ).map(([_, item]) => item);
    
    return uniqueItems;
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
};

export const getAvailableMenuItems = async (): Promise<MenuItem[]> => {
  try {
    // First try to get all menu items with compound query
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('isAvailable', '==', true),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
    } catch (compoundQueryError) {
      // If compound query fails (likely due to missing index), fall back to simple query
      console.warn('Compound query failed, falling back to simple query:', compoundQueryError);
      
      // Get all menu items then filter in memory
      const simpleQuery = query(collection(db, COLLECTION_NAME));
      const allItems = await getDocs(simpleQuery);
      
      const menuItems = allItems.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      
      return menuItems
        .filter(item => item.isAvailable === true)
        .sort((a, b) => ((a.order || 0) - (b.order || 0)));
    }
  } catch (error) {
    console.error('Error getting available menu items:', error);
    throw error;
  }
};

export const getMenuItem = async (id: string): Promise<MenuItem | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as MenuItem;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting menu item with id:", error);
    throw error;
  }
};

export const createMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...menuItem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
};

export const updateMenuItem = async (id: string, menuItem: Partial<MenuItem>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    await updateDoc(docRef, {
      ...menuItem,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating menu item with id:", error);
    throw error;
  }
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting menu item with id:", error);
    throw error;
  }
};
