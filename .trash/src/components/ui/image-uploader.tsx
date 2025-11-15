'use client';

import { useState, useCallback } from 'react';
import { Button } from './button';
import { Loader2, Upload, X, Image } from 'lucide-react';
import { IKImage, IKContext, IKUpload } from 'imagekitio-react';

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, label = 'Image', className = '' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(Date.now()); // For resetting the uploader

  const handleSuccess = useCallback((response: any) => {
    setIsUploading(false);
    setError(null);
    // Get the URL from the response and call onChange
    console.log('ImageKit upload success response:', response);
    
    if (response?.url) {
      console.log('Setting image URL to:', response.url);
      onChange(response.url);
    } else {
      console.error('ImageKit response missing URL:', response);
      setError('Upload succeeded but image URL is missing');
    }
  }, [onChange]);

  const handleError = useCallback((err: any) => {
    setIsUploading(false);
    setError(err.message || 'Upload failed');
    console.error('ImageKit upload error:', err);
  }, []);

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    setError(null);
  }, []);

  const resetUpload = useCallback(() => {
    onChange('');
    setUploadKey(Date.now());
  }, [onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col gap-2">
        {label && <label className="text-gray-700 font-medium">{label}</label>}
        
        {!value ? (
          <IKContext
            publicKey="public_OY+jHX6VCdP+dslUONRoUQg3NCY="
            urlEndpoint="https://ik.imagekit.io/6ftxk3eun"
            authenticationEndpoint="/api/imagekit/auth"
            authenticator={async () => {
              try {
                // Fetch the authentication parameters from our API route
                const response = await fetch('/api/imagekit/auth');
                const data = await response.json();
                return data;
              } catch (error) {
                console.error('Failed to get ImageKit auth tokens:', error);
                throw new Error('Authentication failed');
              }
            }}>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <IKUpload
                      key={uploadKey}
                      fileName={`gallery_${Date.now()}`}
                      folder="/gallery"
                      onSuccess={handleSuccess}
                      onError={handleError}
                      onUploadStart={handleUploadStart}
                      className="hidden"
                      id="imagekit-upload"
                    />
                    <label 
                      htmlFor="imagekit-upload"
                      className="cursor-pointer bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors inline-block"
                    >
                      Select Image
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                </>
              )}
            </div>
          </IKContext>
        ) : (
          <div className="relative border rounded-md overflow-hidden">
            <img 
              src={value} 
              alt="Uploaded image" 
              className="w-full h-48 object-cover" 
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
              onClick={resetUpload}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Manual URL input option */}
        <div className="mt-2">
          <label className="text-xs text-gray-500 block mb-1">
            Or enter image URL directly:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 border-gray-300 rounded-md focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50 text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mt-1">{error}</div>
        )}
      </div>
    </div>
  );
}
