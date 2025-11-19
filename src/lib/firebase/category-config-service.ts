/**
 * Firebase service for managing category configurations (ordering, emojis)
 */

import { db } from '@/lib/firebase/config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';

export interface CategoryConfig {
  id: string; // category name without emoji
  order: number;
  emoji: string;
  name: string; // full name with emoji
  description?: string;
  createdAt: number;
  updatedAt: number;
}

const CATEGORIES_COLLECTION = 'categoryConfigs';

/**
 * Get all category configurations, sorted by order
 */
export async function getAllCategoryConfigs(): Promise<CategoryConfig[]> {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as CategoryConfig));
  } catch (error) {
    console.error('Error fetching category configs:', error);
    throw error;
  }
}

/**
 * Get a single category configuration
 */
export async function getCategoryConfig(categoryId: string): Promise<CategoryConfig | null> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id,
      } as CategoryConfig;
    }
    return null;
  } catch (error) {
    console.error('Error fetching category config:', error);
    throw error;
  }
}

/**
 * Create or update a category configuration
 */
export async function setCategoryConfig(
  categoryId: string,
  config: Omit<CategoryConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CategoryConfig> {
  try {
    const now = Date.now();
    const existing = await getCategoryConfig(categoryId);
    
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const data = {
      ...config,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    
    await setDoc(docRef, data, { merge: true });
    
    return {
      ...data,
      id: categoryId,
    } as CategoryConfig;
  } catch (error) {
    console.error('Error setting category config:', error);
    throw error;
  }
}

/**
 * Update multiple category configurations at once (for reordering)
 */
export async function updateCategoryOrder(
  configs: Partial<CategoryConfig>[]
): Promise<void> {
  try {
    const now = Date.now();
    
    for (const config of configs) {
      if (!config.id) continue;
      
      const docRef = doc(db, CATEGORIES_COLLECTION, config.id);
      const update: any = {
        updatedAt: now,
      };
      
      if (config.order !== undefined) update.order = config.order;
      if (config.emoji) update.emoji = config.emoji;
      if (config.name) update.name = config.name;
      
      await updateDoc(docRef, update);
    }
  } catch (error) {
    console.error('Error updating category order:', error);
    throw error;
  }
}

/**
 * Delete a category configuration
 */
export async function deleteCategoryConfig(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(docRef, {
      updatedAt: Date.now(),
      deleted: true,
    });
  } catch (error) {
    console.error('Error deleting category config:', error);
    throw error;
  }
}

/**
 * Check if emoji is already used by another category
 */
export async function isEmojiUsed(emoji: string, excludeId?: string): Promise<boolean> {
  try {
    const configs = await getAllCategoryConfigs();
    return configs.some(
      config => config.emoji === emoji && config.id !== excludeId
    );
  } catch (error) {
    console.error('Error checking emoji usage:', error);
    throw error;
  }
}

/**
 * Get used emojis (for avoiding duplicates)
 */
export async function getUsedEmojis(excludeId?: string): Promise<string[]> {
  try {
    const configs = await getAllCategoryConfigs();
    return configs
      .filter(config => config.id !== excludeId)
      .map(config => config.emoji)
      .filter(emoji => emoji && emoji.length > 0);
  } catch (error) {
    console.error('Error getting used emojis:', error);
    throw error;
  }
}

/**
 * Subscribe to category config changes in real-time
 */
export function subscribeToCategoryConfigs(
  callback: (configs: CategoryConfig[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    // Since Firestore doesn't have real-time on ordered queries efficiently,
    // we'll return a polling function instead
    const interval = setInterval(async () => {
      try {
        const configs = await getAllCategoryConfigs();
        callback(configs);
      } catch (error) {
        onError?.(error as Error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  } catch (error) {
    onError?.(error as Error);
    return () => {};
  }
}
