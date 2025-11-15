import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

try {
  // Check if already initialized
  try {
    adminApp = admin.app();
    console.log('✅ Firebase Admin SDK already initialized');
  } catch (notInitializedError) {
    // Not initialized yet, proceed with initialization
    
    // Initialize from environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    console.log('\n🔐 Firebase Admin SDK Initialization:');
    console.log('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID:', projectId ? '✅ Present' : '❌ Missing');
    console.log('   - FIREBASE_ADMIN_CLIENT_EMAIL:', clientEmail ? '✅ Present' : '❌ Missing');
    console.log('   - FIREBASE_ADMIN_PRIVATE_KEY:', privateKey ? '✅ Present' : '❌ Missing');

    if (!projectId || !clientEmail || !privateKey) {
      const missingVars: string[] = [];
      if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      if (!clientEmail) missingVars.push('FIREBASE_ADMIN_CLIENT_EMAIL');
      if (!privateKey) missingVars.push('FIREBASE_ADMIN_PRIVATE_KEY');
      
      throw new Error(
        `Missing Firebase Admin credentials in environment variables:\n` +
        `${missingVars.map(v => `   - ${v}`).join('\n')}\n\n` +
        `Please:\n` +
        `1. Create a .env.local file in the project root\n` +
        `2. Get credentials from Firebase Console → Project Settings → Service Accounts\n` +
        `3. Add FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY\n` +
        `4. Restart the development server`
      );
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      } as admin.ServiceAccount),
      databaseURL: `https://${projectId}.firebaseio.com`,
    });

    console.log('✅ Firebase Admin SDK initialized successfully\n');
  }
} catch (error) {
  console.error('\n❌ Firebase Admin SDK Initialization Failed:');
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  initError = error instanceof Error ? error : new Error(String(error));
}

function getAdminApp(): admin.app.App {
  if (!adminApp) {
    throw new Error(
      initError?.message || 
      'Firebase Admin SDK not initialized. Check server logs for details.'
    );
  }
  return adminApp;
}

export const adminDb = {
  collection: (path: string) => getAdminApp().firestore().collection(path),
  getApp: () => getAdminApp(),
} as any;

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminApp().auth().verifyIdToken(token),
} as any;
