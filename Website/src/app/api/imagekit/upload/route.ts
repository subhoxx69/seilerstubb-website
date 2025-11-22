import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: POST /api/imagekit/upload
 * Server-side upload handler using ImageKit private key for authentication
 * Supports any image format and file size
 */
export async function POST(request: NextRequest) {
  try {
    // Use hardcoded ImageKit credentials
    const privateKey = 'private_J7xg3TYgVqdSXh6QMODXIkhlOB8=';
    const publicKey = 'public_OY+jHX6VCdP+dslUONRoUQg3NCY=';
    const urlEndpoint = 'https://ik.imagekit.io/6ftxk3eun';

    console.log('🔍 === IMAGE UPLOAD START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('URL Endpoint:', urlEndpoint);

    // Parse the FormData from client
    console.log('📦 Parsing request FormData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      console.error('❌ No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!fileName) {
      console.error('❌ No fileName provided in request');
      return NextResponse.json(
        { error: 'No fileName provided' },
        { status: 400 }
      );
    }

    console.log('✅ File received:', {
      name: fileName,
      size: file.size,
      type: file.type,
      folder: folder || '/gallery',
    });

    // Validate ONLY image files
    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/avif',
      'image/heic',
      'image/heif',
    ];

    if (!validImageTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: `Invalid image type: ${file.type}` },
        { status: 400 }
      );
    }

    // No file size limit - ImageKit handles any size
    console.log(`📦 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    // Convert file to buffer
    console.log('🔄 Converting file to buffer...');
    const buffer = await file.arrayBuffer();

    // Create ImageKit FormData
    console.log('📝 Creating ImageKit FormData...');
    const imageKitFormData = new FormData();
    imageKitFormData.append('file', new Blob([buffer], { type: file.type }), fileName);
    imageKitFormData.append('fileName', fileName);
    imageKitFormData.append('folder', folder || '/gallery/');
    imageKitFormData.append('isPrivateFile', 'false');
    imageKitFormData.append('useUniqueFileName', 'true');

    // Create Basic Auth header
    const auth = Buffer.from(`${privateKey}:`).toString('base64');

    console.log('🚀 Uploading to ImageKit...');
    console.log('Endpoint:', 'https://upload.imagekit.io/api/v1/files/upload');

    // Upload to ImageKit
    const uploadResponse = await fetch(
      'https://upload.imagekit.io/api/v1/files/upload',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: imageKitFormData,
      }
    );

    console.log('📊 ImageKit response status:', uploadResponse.status);

    // Get response as text first for debugging
    const responseText = await uploadResponse.text();

    if (!uploadResponse.ok) {
      console.error('❌ ImageKit upload failed');
      console.error('Status:', uploadResponse.status);
      console.error('Response body:', responseText);

      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || errorData.error || `Upload failed with status ${uploadResponse.status}`;
        return NextResponse.json(
          { error: errorMessage },
          { status: uploadResponse.status }
        );
      } catch {
        return NextResponse.json(
          { error: `ImageKit Error (${uploadResponse.status}): ${responseText.substring(0, 200)}` },
          { status: uploadResponse.status }
        );
      }
    }

    // Parse successful response
    console.log('✅ Parsing ImageKit response...');
    const uploadedFile = JSON.parse(responseText);

    console.log('✅ Upload successful');
    console.log('File ID:', uploadedFile.fileId);
    console.log('URL:', uploadedFile.url);
    console.log('File Path:', uploadedFile.filePath);

    return NextResponse.json({
      fileId: uploadedFile.fileId,
      url: uploadedFile.url,
      filePath: uploadedFile.filePath,
      name: uploadedFile.name,
      size: uploadedFile.size,
      height: uploadedFile.height,
      width: uploadedFile.width,
      format: uploadedFile.fileType,
    });
  } catch (error) {
    console.error('❌ Upload endpoint error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', message);
    
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}

