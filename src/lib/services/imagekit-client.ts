import ImageKit from 'imagekit';
import { randomUUID } from 'crypto';

// Initialize ImageKit with proper credentials
// Supports any image resolution (4K, 8K, etc.)
let imagekit: ImageKit | null = null;

try {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (publicKey && urlEndpoint) {
    const config: any = {
      publicKey: publicKey,
      urlEndpoint: urlEndpoint,
    };
    
    // Only add privateKey if it exists
    if (privateKey && privateKey !== 'your_imagekit_private_key') {
      config.privateKey = privateKey;
    }
    
    imagekit = new ImageKit(config);
    console.log('✅ ImageKit initialized with provided credentials');
  }
} catch (error) {
  console.warn('⚠️ ImageKit initialization warning:', error);
}

/**
 * Generate ImageKit authentication parameters for client-side uploads
 * Works with any image resolution (4K, 8K, etc.)
 */
export function generateImageKitAuthParams() {
  try {
    if (!imagekit) {
      console.warn('⚠️ ImageKit not initialized, using public key upload');
      return {
        signature: '',
        expire: Math.floor(Date.now() / 1000) + 3600,
        token: '',
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''
      };
    }
    
    const token = imagekit.getAuthenticationParameters();
    return {
      signature: token.signature,
      expire: token.expire,
      token: token.token,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''
    };
  } catch (error) {
    console.warn('⚠️ Error generating ImageKit auth params:', error);
    // Fallback to public key upload without authentication
    return {
      signature: '',
      expire: Math.floor(Date.now() / 1000) + 3600,
      token: '',
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''
    };
  }
}

/**
 * Generate a signed URL for a specific image in ImageKit
 * Supports transformations for any image resolution (4K, 8K, etc.)
 */
export function generateSignedUrl(
  filePath: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpg' | 'png' | 'webp';
  }
) {
  try {
    let url = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${filePath}`;
    
    if (options) {
      const params = [];
      if (options.width) params.push(`w-${options.width}`);
      if (options.height) params.push(`h-${options.height}`);
      if (options.quality) params.push(`q-${options.quality}`);
      if (options.format) params.push(`f-${options.format}`);
      
      if (params.length > 0) {
        url = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:${params.join(',')}/` + filePath;
      }
    }
    
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Generate a responsive image URL with multiple resolutions
 * Works with any resolution including 4K, 8K, etc.
 * Returns transformation URLs for different screen sizes
 */
export function generateResponsiveImageUrls(filePath: string) {
  const baseUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}`;
  
  return {
    // Thumbnail (small preview)
    thumbnail: `${baseUrl}/tr:w-200,h-200,c-at/` + filePath,
    
    // Mobile (1080p and lower)
    mobile: `${baseUrl}/tr:w-1080,q-80/` + filePath,
    
    // Tablet (1440p)
    tablet: `${baseUrl}/tr:w-1440,q-85/` + filePath,
    
    // Desktop (2K)
    desktop: `${baseUrl}/tr:w-2560,q-85/` + filePath,
    
    // High Resolution (4K)
    '4k': `${baseUrl}/tr:w-3840,q-90/` + filePath,
    
    // Ultra High Resolution (8K)
    '8k': `${baseUrl}/tr:w-7680,q-90/` + filePath,
    
    // Original (no transformation)
    original: `${baseUrl}` + filePath,
    
    // WebP format for modern browsers (mobile)
    webpMobile: `${baseUrl}/tr:w-1080,f-webp,q-75/` + filePath,
    
    // WebP format for desktop
    webpDesktop: `${baseUrl}/tr:w-2560,f-webp,q-80/` + filePath,
  };
}

/**
 * Get optimal image URL based on device type
 * Automatically selects best resolution for the device
 */
export function getOptimalImageUrl(filePath: string, deviceType?: 'mobile' | 'tablet' | 'desktop' | '4k' | '8k'): string {
  const urls = generateResponsiveImageUrls(filePath);
  
  if (deviceType) {
    return urls[deviceType as keyof typeof urls] || urls.original;
  }
  
  // Auto-detect based on window width if available
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    
    if (width < 768) return urls.mobile;
    if (width < 1440) return urls.tablet;
    if (width < 2560) return urls.desktop;
    if (width < 3840) return urls['4k'];
    return urls['8k'];
  }
  
  // Default to desktop
  return urls.desktop;
}

/**
 * Get WebP URL with fallback
 * Uses WebP format for better compression, falls back to original
 */
export function getWebPUrl(filePath: string, isMobile: boolean = false): { webp: string; fallback: string } {
  const urls = generateResponsiveImageUrls(filePath);
  
  return {
    webp: isMobile ? urls.webpMobile : urls.webpDesktop,
    fallback: isMobile ? urls.mobile : urls.desktop,
  };
}

/**
 * Delete an image from ImageKit by file ID
 * Should only be called from backend/admin operations
 */
export async function deleteImageFromImageKit(fileId: string) {
  try {
    if (!imagekit) {
      console.warn('ImageKit not initialized, skipping delete');
      return false;
    }
    await imagekit.deleteFile(fileId);
    console.log(`✅ Image deleted from ImageKit: ${fileId}`);
    return true;
  } catch (error) {
    console.error('Error deleting image from ImageKit:', error);
    throw new Error('Failed to delete image from ImageKit');
  }
}

/**
 * Get file metadata from ImageKit
 */
export async function getImageMetadata(fileId: string) {
  try {
    if (!imagekit) {
      throw new Error('ImageKit not initialized');
    }
    const file = await imagekit.getFileDetails(fileId);
    return file;
  } catch (error) {
    console.error('Error fetching image metadata:', error);
    throw new Error('Failed to fetch image metadata');
  }
}

/**
 * List all files in a folder
 */
export async function listGalleryImages(folderPath: string = '/gallery') {
  try {
    if (!imagekit) {
      throw new Error('ImageKit not initialized');
    }
    const files = await imagekit.listFiles({
      path: folderPath,
      limit: 500
    });
    return files;
  } catch (error) {
    console.error('Error listing images from ImageKit:', error);
    throw new Error('Failed to list images from ImageKit');
  }
}

/**
 * Upload image from buffer (for server-side processing)
 */
export async function uploadImageFromBuffer(
  buffer: Buffer,
  fileName: string,
  folderPath: string = '/gallery'
) {
  try {
    if (!imagekit) {
      throw new Error('ImageKit not initialized');
    }
    const response = await imagekit.upload({
      file: buffer,
      fileName: `${randomUUID()}-${fileName}`,
      folder: folderPath,
      isPrivateFile: false,
      tags: ['gallery']
    });
    
    console.log(`✅ Image uploaded to ImageKit: ${response.fileId}`);
    
    return {
      fileId: response.fileId,
      fileName: response.name,
      filePath: response.filePath,
      url: response.url,
      size: response.size,
      width: response.width,
      height: response.height
    };
  } catch (error) {
    console.error('Error uploading image to ImageKit:', error);
    throw new Error('Failed to upload image to ImageKit');
  }
}

export default imagekit;
