import { NextRequest, NextResponse } from 'next/server';
import { MAIN_ADMIN_EMAILS } from '@/lib/firebase/admin-constants';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let uid = '';
    let email = '';

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString()
      );
      uid = payload.sub || payload.user_id;
      email = payload.email || '';

      if (!uid) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const threadId = formData.get('threadId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Initialize Admin SDK for thread verification
    let adminApp: any;
    let adminDb: any;

    try {
      const { initializeApp, getApp } = await import('firebase-admin/app');

      try {
        adminApp = getApp();
      } catch {
        const serviceAccount = {
          type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE,
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        } as any;

        const { cert } = await import('firebase-admin/app');
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      }

      const { getFirestore } = await import('firebase-admin/firestore');
      adminDb = getFirestore(adminApp);
    } catch (adminError) {
      console.error('Failed to initialize Admin SDK:', adminError);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify thread exists and user has access
    const threadRef = adminDb.collection('contactThreads').doc(threadId);
    const threadSnap = await threadRef.get();

    if (!threadSnap.exists) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    const threadData = threadSnap.data();
    const isAdmin = MAIN_ADMIN_EMAILS.includes(email);
    const isThreadOwner = threadData.userId === uid;

    if (!isAdmin && !isThreadOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to upload to this thread' },
        { status: 403 }
      );
    }

    // Upload to ImageKit
    const buffer = await file.arrayBuffer();
    const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const imageKitPublicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

    if (!imageKitPrivateKey || !imageKitPublicKey) {
      return NextResponse.json(
        { error: 'ImageKit credentials not configured' },
        { status: 500 }
      );
    }

    // Create FormData for ImageKit API
    const imageKitFormData = new FormData();
    imageKitFormData.append('file', new Blob([buffer], { type: file.type }), file.name);
    imageKitFormData.append('fileName', `${threadId}_${Date.now()}_${file.name}`);
    imageKitFormData.append('folder', `/contact-attachments/${threadId}`);
    imageKitFormData.append('tags', `contact,thread:${threadId}`);

    // Create authentication header for ImageKit
    const authString = `${imageKitPrivateKey}:`;
    const base64Auth = Buffer.from(authString).toString('base64');

    try {
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64Auth}`,
        },
        body: imageKitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ImageKit upload error:', errorData);
        return NextResponse.json(
          { error: 'Failed to upload image to ImageKit' },
          { status: 400 }
        );
      }

      const uploadResponse = await response.json();

      return NextResponse.json(
        {
          success: true,
          imageUrl: uploadResponse.url,
          imageName: file.name,
          imageSize: file.size,
          imageKitFileId: uploadResponse.fileId,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error uploading to ImageKit:', error);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in image upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
