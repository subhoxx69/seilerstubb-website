import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import axios from 'axios';

const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/6ftxk3eun';
const IMAGEKIT_PUBLIC_KEY = 'public_OY+jHX6VCdP+dslUONRoUQg3NCY=';

// Backend API endpoint for server-side operations
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Gallery Image type
 */
export interface GalleryImage {
  id: string;
  title: string;
  description: string;
  imageKitUrl: string;
  imageKitFileId: string;
  imageKitPath: string;
  category: 'restaurant' | 'dishes' | 'events' | 'ambiance';
  order: number;
  uploadedAt: Timestamp;
  updatedAt?: Timestamp;
  alt: string;
  featured?: boolean;
}

/**
 * Upload image to ImageKit and save metadata to Firebase
 */
export const uploadGalleryImage = async (
  file: File,
  title: string,
  description: string,
  category: 'restaurant' | 'dishes' | 'events' | 'ambiance',
  alt: string,
): Promise<GalleryImage> => {
  try {
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    // Upload to ImageKit via backend API (no file size limit)
    // Supports: JPG, PNG, WebP, GIF, SVG, BMP, TIFF, AVIF, and more
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', `gallery_${Date.now()}_${file.name}`);
    formData.append('folder', `/restaurant-gallery/${category}/`);

    const uploadResponse = await axios.post(`${API_BASE_URL}/imagekit/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Allow large file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000, // 5 minute timeout for large files
    });

    const imageKitData = uploadResponse.data;

    if (!imageKitData.url) {
      throw new Error('ImageKit upload failed');
    }

    // Get next order number
    const galleryRef = collection(db, 'gallery');
    const snapshot = await getDocs(galleryRef);
    const nextOrder = snapshot.size + 1;

    // Save metadata to Firebase
    const docRef = await addDoc(collection(db, 'gallery'), {
      title,
      description,
      imageKitUrl: imageKitData.url,
      imageKitFileId: imageKitData.fileId,
      imageKitPath: imageKitData.filePath,
      category,
      order: nextOrder,
      alt,
      featured: false,
      uploadedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Store image metadata
      imageMetadata: {
        width: imageKitData.width,
        height: imageKitData.height,
        size: imageKitData.size,
        format: imageKitData.format,
      },
    });

    return {
      id: docRef.id,
      title,
      description,
      imageKitUrl: imageKitData.url,
      imageKitFileId: imageKitData.fileId,
      imageKitPath: imageKitData.filePath,
      category,
      order: nextOrder,
      alt,
      featured: false,
      uploadedAt: Timestamp.now(),
    };
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    throw error;
  }
};

/**
 * Delete gallery image from Firebase and ImageKit
 */
export const deleteGalleryImage = async (imageId: string, imageKitFileId: string): Promise<void> => {
  try {
    // Delete from Firebase
    await deleteDoc(doc(db, 'gallery', imageId));

    // Delete from ImageKit via backend API
    await axios.post(`${API_BASE_URL}/imagekit/delete`, {
      fileId: imageKitFileId,
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    throw error;
  }
};

/**
 * Get all gallery images
 */
export const getGalleryImages = async (
  category?: 'restaurant' | 'dishes' | 'events' | 'ambiance',
): Promise<GalleryImage[]> => {
  try {
    let q = query(collection(db, 'gallery'), orderBy('order', 'asc'));

    // Add category filter if provided
    if (category) {
      q = query(
        collection(db, 'gallery'),
        ...([
          orderBy('order', 'asc'),
          // Add where clause for category if available
        ] as QueryConstraint[]),
      );
    }

    const snapshot = await getDocs(q);
    const images: GalleryImage[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!category || data.category === category) {
        images.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          imageKitUrl: data.imageKitUrl,
          imageKitFileId: data.imageKitFileId,
          imageKitPath: data.imageKitPath,
          category: data.category,
          order: data.order,
          alt: data.alt,
          featured: data.featured || false,
          uploadedAt: data.uploadedAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    return images;
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time gallery updates
 */
export const subscribeToGalleryImages = (
  callback: (images: GalleryImage[]) => void,
  category?: 'restaurant' | 'dishes' | 'events' | 'ambiance',
): (() => void) => {
  const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const images: GalleryImage[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!category || data.category === category) {
        images.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          imageKitUrl: data.imageKitUrl,
          imageKitFileId: data.imageKitFileId,
          imageKitPath: data.imageKitPath,
          category: data.category,
          order: data.order,
          alt: data.alt,
          featured: data.featured || false,
          uploadedAt: data.uploadedAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    callback(images);
  });
};

/**
 * Update gallery image metadata
 */
export const updateGalleryImage = async (
  imageId: string,
  updates: Partial<GalleryImage>,
): Promise<void> => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.imageKitFileId;
    delete updateData.imageKitPath;
    delete updateData.uploadedAt;

    await updateDoc(doc(db, 'gallery', imageId), updateData);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    throw error;
  }
};

/**
 * Reorder gallery images
 */
export const reorderGalleryImages = async (
  imageIds: string[],
): Promise<void> => {
  try {
    const promises = imageIds.map((id, index) =>
      updateDoc(doc(db, 'gallery', id), {
        order: index + 1,
        updatedAt: Timestamp.now(),
      }),
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error reordering gallery images:', error);
    throw error;
  }
};

/**
 * Get featured gallery images
 */
export const getFeaturedGalleryImages = async (limit: number = 6): Promise<GalleryImage[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'gallery'));
    const images: GalleryImage[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      images.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        imageKitUrl: data.imageKitUrl,
        imageKitFileId: data.imageKitFileId,
        imageKitPath: data.imageKitPath,
        category: data.category,
        order: data.order,
        alt: data.alt,
        featured: data.featured || false,
        uploadedAt: data.uploadedAt,
        updatedAt: data.updatedAt,
      });
    });

    // Sort by featured status first, then by order
    return images
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.order - b.order;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching featured gallery images:', error);
    throw error;
  }
};
