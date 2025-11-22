import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  onSnapshot,
  Timestamp,
  Unsubscribe,
  serverTimestamp,
  getDoc,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  itemNumber: number;              // Sequential item number (1, 2, 3...) - REQUIRED
  image?: string;
  imageUrl?: string;           // ImageKit URL
  imageKitFileId?: string;     // For deletion
  imagePath?: string;          // For transformations
  available: boolean;
  popularity?: number;         // Popularity score (0-100)
  
  // Enhanced liking system fields
  likes?: number;              // Total like count (from userLikes array length)
  userLikes?: string[];        // Array of user IDs who liked this item
  likeTimestamps?: string[];   // Timestamps of when likes were added (ISO strings)
  lastLikeTime?: Timestamp;    // Timestamp of most recent like
  
  // Additional analytics
  views?: number;              // View count
  orders?: number;             // Order count
  rating?: number;             // Average rating (1-5)
  ratingsCount?: number;       // Number of ratings
  
  // Allergens and Ingredients
  allergens?: string[];        // Array of allergen codes A-N
  ingredients?: number[];      // Array of ingredient codes 1-14
  
  // Image Info Flag
  isExampleImage?: boolean;    // True if image is an example from internet, not actual dish photo
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Real-time listener for all available menu items (for user menu)
export function subscribeToMenuItems(callback: (items: MenuItem[]) => void, onError?: (error: Error) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'menu'), where('available', '==', true));
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const items = querySnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                price: Number(data.price) || 0,
              } as MenuItem;
            })
            .filter(item => item.name && item.price >= 0); // Basic validation
          
          callback(items);
        } catch (error) {
          console.error('Error processing menu items:', error);
          if (onError) onError(new Error('Fehler beim Verarbeiten der Menüdaten'));
        }
      },
      (error) => {
        console.error('Error in menu listener:', error);
        if (onError) onError(error as Error);
      }
    );
  } catch (error) {
    console.error('Error setting up menu listener:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
}

// Real-time listener for all menu items including unavailable (for admin)
export function subscribeToAllMenuItems(callback: (items: MenuItem[]) => void, onError?: (error: Error) => void): Unsubscribe {
  try {
    const q = query(collection(db, 'menu'));
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const items = querySnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                price: Number(data.price) || 0,
              } as MenuItem;
            })
            .filter(item => item.name && item.price >= 0); // Basic validation
          
          callback(items);
        } catch (error) {
          console.error('Error processing menu items:', error);
          if (onError) onError(new Error('Fehler beim Verarbeiten der Menüdaten'));
        }
      },
      (error) => {
        console.error('Error in admin menu listener:', error);
        if (onError) onError(error as Error);
      }
    );
  } catch (error) {
    console.error('Error setting up admin menu listener:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
}

// Get all menu items (legacy - for backwards compatibility)
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const q = query(collection(db, 'menu'), where('available', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MenuItem[];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

// Get menu items by category (legacy - for backwards compatibility)
export async function getMenuByCategory(category: string): Promise<MenuItem[]> {
  try {
    const q = query(
      collection(db, 'menu'),
      where('category', '==', category),
      where('available', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MenuItem[];
  } catch (error) {
    console.error('Error fetching menu by category:', error);
    return [];
  }
}

// Add menu item (admin)
export async function addMenuItem(item: MenuItem): Promise<string | null> {
  try {
    // If itemNumber is provided, use it; otherwise auto-generate
    let itemNumber = item.itemNumber;
    
    if (!itemNumber || itemNumber <= 0) {
      // Get the next sequential item number
      const allItems = await getDocs(collection(db, 'menu'));
      const maxItemNumber = Math.max(
        0,
        ...allItems.docs.map(doc => (doc.data() as MenuItem).itemNumber || 0)
      );
      itemNumber = maxItemNumber + 1;
    }

    const docRef = await addDoc(collection(db, 'menu'), {
      ...item,
      itemNumber: itemNumber, // Use provided or auto-assigned number
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Menu item added with itemNumber:', itemNumber, 'ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding menu item:', error);
    return null;
  }
}

// Update menu item (admin)
export async function updateMenuItem(id: string, item: Partial<MenuItem>): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'menu', id), {
      ...item,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Menu item updated:', id);
    return true;
  } catch (error) {
    console.error('Error updating menu item:', error);
    return false;
  }
}

// Delete menu item (admin)
export async function deleteMenuItem(id: string): Promise<boolean> {
  try {
    // Get item data before deleting to retrieve image info
    const itemDoc = await getDoc(doc(db, 'menu', id));
    
    if (itemDoc.exists()) {
      const itemData = itemDoc.data();
      
      // Delete image from ImageKit if it exists
      if (itemData.imageKitFileId) {
        try {
          const response = await fetch('/api/imagekit/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: itemData.imageKitFileId,
            }),
          });
          
          if (response.ok) {
            console.log('✅ Image deleted from ImageKit:', itemData.imageKitFileId);
          } else {
            console.warn('⚠️ Failed to delete image from ImageKit');
          }
        } catch (error) {
          console.error('❌ Error deleting image from ImageKit:', error);
        }
      }
    }
    
    // Delete the menu item from Firestore
    await deleteDoc(doc(db, 'menu', id));
    console.log('✅ Menu item deleted:', id);
    return true;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return false;
  }
}

// Increment view count for analytics
export async function incrementMenuItemViews(id: string): Promise<boolean> {
  try {
    const itemRef = doc(db, 'menu', id);
    const itemDoc = await getDocs(collection(db, 'menu'));
    const currentItem = itemDoc.docs.find(d => d.id === id)?.data() as MenuItem | undefined;
    
    await updateDoc(itemRef, {
      views: (currentItem?.views || 0) + 1,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error incrementing views:', error);
    return false;
  }
}

// Update menu item popularity score
export async function updateMenuItemPopularity(id: string, score: number): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'menu', id), {
      popularity: Math.min(100, Math.max(0, score)),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating popularity:', error);
    return false;
  }
}

// ============================================================================
// 🔥 ENHANCED LIKING SYSTEM - VERY STRONG & ROBUST
// ============================================================================

// Like an item (with user tracking and duplicate prevention)
export async function likeMenuItem(itemId: string, userId: string): Promise<boolean> {
  if (!itemId || !userId) {
    console.error('❌ Invalid itemId or userId');
    return false;
  }

  try {
    const itemRef = doc(db, 'menu', itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      console.error('❌ Menu item not found:', itemId);
      return false;
    }

    const itemData = itemDoc.data();
    const userLikesArray = itemData.userLikes || [];

    // Check if user already liked this item (prevent duplicates)
    if (userLikesArray.includes(userId)) {
      console.warn('⚠️ User already liked this item');
      return false;
    }

    // Atomic update with user tracking - sync likes with userLikes array length
    const likeTimestamp = new Date().toISOString();
    const newLikeCount = userLikesArray.length + 1;
    
    await updateDoc(itemRef, {
      // Set like count to match userLikes array length + 1
      likes: newLikeCount,
      
      // Track which users liked this (for analytics and duplicate prevention)
      userLikes: arrayUnion(userId),
      
      // Track when each like happened (for trending analysis)
      likeTimestamps: arrayUnion(likeTimestamp),
      
      // Update last like time (for sorting trending items)
      lastLikeTime: serverTimestamp(),
      
      // Update overall timestamp
      updatedAt: serverTimestamp()
    });

    console.log('✅ Like added successfully:', { itemId, userId, newLikes: newLikeCount });
    return true;
  } catch (error) {
    console.error('❌ Error liking menu item:', error);
    return false;
  }
}

// Unlike an item (remove like with proper cleanup)
export async function unlikeMenuItem(itemId: string, userId: string): Promise<boolean> {
  if (!itemId || !userId) {
    console.error('❌ Invalid itemId or userId');
    return false;
  }

  try {
    const itemRef = doc(db, 'menu', itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      console.error('❌ Menu item not found:', itemId);
      return false;
    }

    const itemData = itemDoc.data();
    const userLikesArray = itemData.userLikes || [];

    // Check if user actually liked this item
    if (!userLikesArray.includes(userId)) {
      console.warn('⚠️ User has not liked this item');
      return false;
    }

    // Calculate new like count - set likes to match userLikes array length - 1
    const newLikeCount = Math.max(0, userLikesArray.length - 1);

    // Atomic update with user tracking removal - sync likes with userLikes array length
    await updateDoc(itemRef, {
      // Set like count to match userLikes array length - 1
      likes: newLikeCount,
      
      // Remove user from likes array
      userLikes: arrayRemove(userId),
      
      // Update timestamp
      updatedAt: serverTimestamp()
    });

    console.log('✅ Like removed successfully:', { itemId, userId, newLikes: newLikeCount });
    return true;
  } catch (error) {
    console.error('❌ Error unliking menu item:', error);
    return false;
  }
}

// Check if a user has already liked an item
export async function hasUserLikedItem(itemId: string, userId: string): Promise<boolean> {
  if (!itemId || !userId) {
    return false;
  }

  try {
    const itemDoc = await getDoc(doc(db, 'menu', itemId));
    
    if (!itemDoc.exists()) {
      return false;
    }

    const userLikesArray = itemDoc.data().userLikes || [];
    return userLikesArray.includes(userId);
  } catch (error) {
    console.error('❌ Error checking like status:', error);
    return false;
  }
}

// Get like count for an item
export async function getItemLikeCount(itemId: string): Promise<number> {
  if (!itemId) {
    return 0;
  }

  try {
    const itemDoc = await getDoc(doc(db, 'menu', itemId));
    
    if (!itemDoc.exists()) {
      return 0;
    }

    return itemDoc.data().likes || 0;
  } catch (error) {
    console.error('❌ Error getting like count:', error);
    return 0;
  }
}

// Get all likes for an item (user list)
export async function getItemLikers(itemId: string): Promise<string[]> {
  if (!itemId) {
    return [];
  }

  try {
    const itemDoc = await getDoc(doc(db, 'menu', itemId));
    
    if (!itemDoc.exists()) {
      return [];
    }

    return itemDoc.data().userLikes || [];
  } catch (error) {
    console.error('❌ Error getting likers:', error);
    return [];
  }
}

// Get user's liked items
export async function getUserLikedItems(userId: string): Promise<string[]> {
  if (!userId) {
    return [];
  }

  try {
    // Query all menu items where user is in userLikes array
    const q = query(
      collection(db, 'menu'),
      where('userLikes', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('❌ Error getting user liked items:', error);
    return [];
  }
}

// Batch like items (for migrations or bulk operations)
export async function batchLikeItems(
  itemIds: string[],
  userId: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  try {
    const batch = writeBatch(db);
    const likeTimestamp = new Date().toISOString();

    for (const itemId of itemIds) {
      try {
        const itemRef = doc(db, 'menu', itemId);
        const itemDoc = await getDoc(itemRef);

        if (itemDoc.exists()) {
          const userLikesArray = itemDoc.data().userLikes || [];
          
          // Only add if not already liked
          if (!userLikesArray.includes(userId)) {
            batch.update(itemRef, {
              likes: increment(1),
              userLikes: arrayUnion(userId),
              likeTimestamps: arrayUnion(likeTimestamp),
              lastLikeTime: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            success++;
          }
        }
      } catch (e) {
        console.error(`Failed to process item ${itemId}:`, e);
        failed++;
      }
    }

    await batch.commit();
    console.log(`✅ Batch like completed: ${success} success, ${failed} failed`);
    return { success, failed };
  } catch (error) {
    console.error('❌ Error in batch like operation:', error);
    return { success, failed };
  }
}

// Get trending items (sorted by recent likes and like count)
export async function getTrendingItems(limit: number = 6): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'menu'),
      where('available', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      likes: doc.data().likes || 0,
      lastLikeTime: doc.data().lastLikeTime || null
    }));

    // Sort by: recent likes first, then by like count
    return items
      .sort((a, b) => {
        const aTime = a.lastLikeTime?.toMillis?.() || 0;
        const bTime = b.lastLikeTime?.toMillis?.() || 0;
        
        if (aTime !== bTime) {
          return bTime - aTime; // Most recent first
        }
        
        return (b.likes || 0) - (a.likes || 0); // Then by like count
      })
      .slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting trending items:', error);
    return [];
  }
}

// Get most liked items of all time
export async function getMostLikedItems(limit: number = 10): Promise<any[]> {
  try {
    const q = query(collection(db, 'menu'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        likes: doc.data().likes || 0
      }))
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting most liked items:', error);
    return [];
  }
}

// Reset all likes for an item (admin only - use with caution)
export async function resetItemLikes(itemId: string): Promise<boolean> {
  if (!itemId) {
    console.error('❌ Invalid itemId');
    return false;
  }

  try {
    await updateDoc(doc(db, 'menu', itemId), {
      likes: 0,
      userLikes: [],
      likeTimestamps: [],
      lastLikeTime: null,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Item likes reset:', itemId);
    return true;
  } catch (error) {
    console.error('❌ Error resetting likes:', error);
    return false;
  }
}

// Validate and repair like counts (data integrity check)
export async function validateAndRepairLikeCounts(): Promise<{
  checked: number;
  fixed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let checked = 0;
  let fixed = 0;

  try {
    const querySnapshot = await getDocs(collection(db, 'menu'));
    const batch = writeBatch(db);

    for (const docSnapshot of querySnapshot.docs) {
      checked++;
      const data = docSnapshot.data();
      const likeCount = data.likes || 0;
      const userLikesArray = data.userLikes || [];

      // Check if like count matches user likes array length
      if (likeCount !== userLikesArray.length) {
        console.warn(
          `⚠️ Like count mismatch for ${docSnapshot.id}: count=${likeCount}, users=${userLikesArray.length}`
        );

        // Fix: set like count to match users array
        batch.update(docSnapshot.ref, {
          likes: userLikesArray.length,
          updatedAt: serverTimestamp()
        });

        fixed++;
        errors.push(
          `Fixed ${docSnapshot.id}: like count was ${likeCount}, corrected to ${userLikesArray.length}`
        );
      }
    }

    await batch.commit();
    console.log(`✅ Validation complete: checked=${checked}, fixed=${fixed}`);
    return { checked, fixed, errors };
  } catch (error) {
    console.error('❌ Error validating like counts:', error);
    errors.push(`Validation error: ${error}`);
    return { checked, fixed, errors };
  }
}
