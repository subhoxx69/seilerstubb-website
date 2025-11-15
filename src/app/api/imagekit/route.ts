import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';

// Initialize ImageKit SDK - ONLY for images
const imagekit = new ImageKit({
  publicKey: 'public_OY+jHX6VCdP+dslUONRoUQg3NCY=',
  privateKey: 'private_J7xg3TYgVqdSXh6QMODXIkhlOB8=',
  urlEndpoint: 'https://ik.imagekit.io/6ftxk3eun',
});

/**
 * POST /api/imagekit/upload
 * Handle ONLY image uploads to ImageKit
 * Supports any image format and resolution
 */
export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  try {
    if (pathname.includes('/imagekit/upload')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const fileName = formData.get('fileName') as string;
      const folder = formData.get('folder') as string;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate ONLY image files are accepted
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
        return NextResponse.json(
          { error: `Invalid image type: ${file.type}. Only image files are accepted.` },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      console.log(`Uploading image: ${fileName}, Size: ${buffer.length} bytes, Type: ${file.type}`);

      try {
        // Upload to ImageKit using the proper SDK method
        const response = await imagekit.upload({
          file: buffer,
          fileName: fileName || file.name,
          folder: folder || '/gallery/',
          useUniqueFileName: true,
          isPrivateFile: false,
        });

        console.log('ImageKit upload successful:', response.fileId);

        return NextResponse.json({
          url: response.url,
          fileId: response.fileId,
          filePath: response.filePath,
          name: response.name,
          size: response.size,
          height: response.height,
          width: response.width,
          format: response.fileType,
        });
      } catch (uploadError: any) {
        console.error('ImageKit upload error details:', {
          message: uploadError.message,
          status: uploadError.statusCode,
          response: uploadError.response,
        });

        return NextResponse.json(
          { error: `ImageKit upload failed: ${uploadError.message}` },
          { status: uploadError.statusCode || 500 }
        );
      }
    } else if (pathname.includes('/imagekit/delete')) {
      const { fileId } = await request.json();

      if (!fileId) {
        return NextResponse.json(
          { error: 'No fileId provided' },
          { status: 400 }
        );
      }

      try {
        // Delete from ImageKit
        await imagekit.deleteFile(fileId);

        return NextResponse.json({ success: true });
      } catch (deleteError: any) {
        console.error('ImageKit delete error:', deleteError);
        return NextResponse.json(
          { error: `ImageKit delete failed: ${deleteError.message}` },
          { status: deleteError.statusCode || 500 }
        );
      }
    } else if (pathname.includes('/imagekit/auth')) {
      try {
        // Generate authentication parameters for client-side image upload
        const result = imagekit.getAuthenticationParameters();

        return NextResponse.json(result);
      } catch (authError: any) {
        console.error('ImageKit auth error:', authError);
        return NextResponse.json(
          { error: `Authentication failed: ${authError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unknown endpoint' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('ImageKit API error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Image upload failed',
      },
      { status: error.statusCode || 500 }
    );
  }
}