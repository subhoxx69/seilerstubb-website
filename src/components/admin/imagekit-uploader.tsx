'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageKitUploadProps {
  onUploadSuccess: (uploadedData: {
    fileId: string;
    url: string;
    filePath: string;
    title: string;
    description: string;
    tags: string[];
  }) => void;
  onUploadError?: (error: Error) => void;
}

export function ImageKitUploader({ onUploadSuccess, onUploadError }: ImageKitUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get ImageKit auth parameters from backend
  const getAuthParams = async () => {
    try {
      const response = await fetch('/api/imagekit/auth', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to get auth parameters');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting auth params:', error);
      throw error;
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Datei ist zu groß (max 5MB)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !title) {
      toast.error('Bitte wählen Sie eine Datei und geben Sie einen Titel ein');
      return;
    }

    setIsUploading(true);

    try {
      // Use backend endpoint for authenticated upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `${Date.now()}-${file.name}`);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tags', tags);

      // Upload via our backend endpoint
      const uploadResponse = await fetch('/api/imagekit/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const responseText = await uploadResponse.text();
        console.error('Upload failed with status:', uploadResponse.status);
        console.error('Response:', responseText);
        
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.error || error.message || `Upload failed: ${uploadResponse.status}`);
        } catch {
          throw new Error(`Upload failed: ${uploadResponse.status} - ${responseText}`);
        }
      }

      const uploadedFile = await uploadResponse.json();

      // Call success callback with uploaded file info
      onUploadSuccess({
        fileId: uploadedFile.fileId,
        url: uploadedFile.url,
        filePath: uploadedFile.filePath,
        title,
        description,
        tags: tags.split(',').map((t) => t.trim()).filter((t) => t),
      });

      // Reset form
      setPreview(null);
      setTitle('');
      setDescription('');
      setTags('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Bild erfolgreich hochgeladen!');
    } catch (error) {
      console.error('Upload error:', error);
      const err = error instanceof Error ? error : new Error('Upload failed');
      toast.error(`Upload fehlgeschlagen: ${err.message}`);
      onUploadError?.(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 bg-slate-50 p-6 rounded-lg border-2 border-dashed border-slate-300">
      <h3 className="text-lg font-semibold text-slate-900">📸 Bild hochladen</h3>

      {/* Preview */}
      {preview && (
        <div className="relative">
          <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Input */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-100 transition"
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600">Klicken zum Bild auswählen oder ziehen Sie es hier hin</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Titel *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Unsere Spezialität"
            className="bg-white border-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreiben Sie das Bild..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Tags (kommagetrennt)</label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="z.B. Speisen, Dessert, Ambiente"
            className="bg-white border-slate-300"
          />
        </div>
      </div>

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!preview || !title || isUploading}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
      >
        {isUploading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Wird hochgeladen...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Bild hochladen
          </>
        )}
      </Button>
    </div>
  );
}
