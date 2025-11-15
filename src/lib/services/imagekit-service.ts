// src/lib/imagekit-service.ts

/**
 * This service handles image uploads and management with ImageKit
 * 
 * We'll use the ImageKit JavaScript SDK on the client side for uploads
 * and the REST API for server-side operations
 */

// Environment variables for ImageKit
const IMAGEKIT_ID = '6ftxk3eun';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/6ftxk3eun';
const IMAGEKIT_PUBLIC_KEY = 'public_OY+jHX6VCdP+dslUONRoUQg3NCY=';

/**
 * Get ImageKit client-side configuration
 * Use this in your client components for direct uploads
 */
export const getImageKitConfig = () => {
  return {
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: '/api/imagekit/auth', // You'll need to create this API route
  };
};

/**
 * Format an ImageKit URL with transformations
 */
export const formatImageUrl = (
  path: string,
  {
    width,
    height,
    quality = 80,
    blur = 0,
    format = 'webp',
  }: {
    width?: number;
    height?: number;
    quality?: number;
    blur?: number;
    format?: 'webp' | 'jpg' | 'png' | 'auto';
  } = {}
) => {
  if (!path) return '';

  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  // Build transformation string
  const transformations: string[] = [];

  if (width) transformations.push(`w-${width}`);
  if (height) transformations.push(`h-${height}`);
  if (quality) transformations.push(`q-${quality}`);
  if (blur > 0) transformations.push(`bl-${blur}`);
  if (format) transformations.push(`f-${format}`);

  const transformationString = transformations.length > 0 
    ? `tr:${transformations.join(',')}` 
    : '';

  // Construct the URL
  return `${IMAGEKIT_URL_ENDPOINT}/${transformationString}${path.startsWith('/') ? path : `/${path}`}`;
};
