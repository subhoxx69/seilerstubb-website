/**
 * Gallery Categories Service - Manage custom gallery categories
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

export interface GalleryCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all categories with real-time listener
 */
export const subscribeToCategories = (
  onSuccess: (categories: GalleryCategory[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const q = query(collection(db, 'galleryCategories'), orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categories: GalleryCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
        color: doc.data().color,
        icon: doc.data().icon,
        order: doc.data().order || 0,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));

      onSuccess(categories);
    });

    return unsubscribe;
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
    return () => {};
  }
};

/**
 * Get all categories (non-real-time)
 */
export const getCategories = async (): Promise<GalleryCategory[]> => {
  try {
    const q = query(collection(db, 'galleryCategories'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description,
      color: doc.data().color,
      icon: doc.data().icon,
      order: doc.data().order || 0,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Add new category
 */
export const addCategory = async (
  name: string,
  description?: string,
  color?: string,
  icon?: string
): Promise<string> => {
  try {
    // Get the next order number
    const categories = await getCategories();
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 1;

    const docRef = await addDoc(collection(db, 'galleryCategories'), {
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3b82f6',
      icon: icon || '📁',
      order: nextOrder,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

/**
 * Update category
 */
export const updateCategory = async (
  id: string,
  updates: Partial<Omit<GalleryCategory, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const categoryRef = doc(db, 'galleryCategories', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(categoryRef, updateData);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'galleryCategories', id));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

/**
 * Reorder categories
 */
export const reorderCategories = async (
  categoryIds: string[]
): Promise<void> => {
  try {
    const updates = categoryIds.map((id, index) =>
      updateDoc(doc(db, 'galleryCategories', id), {
        order: index,
        updatedAt: Timestamp.now(),
      })
    );

    await Promise.all(updates);
  } catch (error) {
    console.error('Error reordering categories:', error);
    throw error;
  }
};
