import { NextRequest, NextResponse } from 'next/server';
import { generateImageKitAuthParams } from '@/lib/imagekit-client';

/**
 * API Route: POST /api/imagekit/auth
 * Generates ImageKit authentication parameters for client-side uploads
 * Should be called by frontend before uploading images
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated (optional - add if needed)
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const authParams = generateImageKitAuthParams();
    
    return NextResponse.json({
      ...authParams,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '6ftxk3eun'
    }, { status: 200 });
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication parameters' },
      { status: 500 }
    );
  }
}
