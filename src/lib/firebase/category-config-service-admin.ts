/**
 * Firebase Admin SDK service for managing category configurations
 * This service uses server-side admin credentials for secure writes
 */

import admin from 'firebase-admin';
import type { CategoryConfig } from './category-config-service';

const CATEGORIES_COLLECTION = 'categoryConfigs';

/**
 * Get the admin Firestore instance
 */
function getAdminDb() {
  try {
    const app = admin.app();
    return app.firestore();
  } catch (error) {
    console.error('Firebase Admin SDK not initialized:', error);
    throw new Error('Firebase Admin SDK is not available. Make sure it\'s properly initialized.');
  }
}

/**
 * Set a category configuration using admin SDK
 */
export async function setCategoryConfigAdmin(
  categoryId: string,
  config: Omit<CategoryConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(CATEGORIES_COLLECTION).doc(categoryId);
    const now = Date.now();

    // Check if document exists
    const existing = await docRef.get();

    if (existing.exists) {
      // Update existing document
      await docRef.update({
        ...config,
        updatedAt: now,
      });
    } else {
      // Create new document
      await docRef.set({
        ...config,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error('Error setting category config (admin):', error);
    throw error;
  }
}

/**
 * Batch set multiple category configurations
 */
export async function batchSetCategoryConfigs(
  configs: Array<{
    id: string;
    config: Omit<CategoryConfig, 'id' | 'createdAt' | 'updatedAt'>;
  }>
): Promise<void> {
  try {
    const db = getAdminDb();
    const batch = db.batch();
    const now = Date.now();

    for (const { id, config } of configs) {
      const docRef = db.collection(CATEGORIES_COLLECTION).doc(id);
      batch.set(
        docRef,
        {
          ...config,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
  } catch (error) {
    console.error('Error batch setting category configs (admin):', error);
    throw error;
  }
}
