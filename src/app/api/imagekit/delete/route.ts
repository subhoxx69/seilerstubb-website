import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Delete file from ImageKit
    await imagekit.deleteFile(fileId);

    console.log('✅ Image deleted from ImageKit:', fileId);
    return NextResponse.json(
      { message: 'Image deleted successfully', fileId },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting image from ImageKit:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
