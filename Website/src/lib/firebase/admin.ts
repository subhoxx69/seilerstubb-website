import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: any;
let adminAuth: ReturnType<typeof getAuth>;
let adminDb: ReturnType<typeof getFirestore>;

export function initializeFirebaseAdmin() {
  try {
    // Try to get existing app first
    try {
      adminApp = getApp();
      console.log('[Firebase Admin] Using existing app instance');
    } catch (error: any) {
      if (error.code === 'app/no-app') {
        console.log('[Firebase Admin] No app instance found, creating new one');
        
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
        };

        // Validate all required fields
        const requiredFields = [
          'type',
          'project_id',
          'private_key_id',
          'private_key',
          'client_email',
          'client_id',
          'auth_uri',
          'token_uri',
          'auth_provider_x509_cert_url',
          'client_x509_cert_url',
        ];

        const missingFields = requiredFields.filter(
          (field) => !(serviceAccount as any)[field]
        );

        if (missingFields.length > 0) {
          console.error('[Firebase Admin] Missing required environment variables:', missingFields);
          throw new Error(`Missing Firebase config: ${missingFields.join(', ')}`);
        }

        adminApp = initializeApp({
          credential: cert(serviceAccount as any),
        });
        console.log('[Firebase Admin] App initialized successfully');
      } else {
        throw error;
      }
    }

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    
    console.log('[Firebase Admin] Auth and Firestore services initialized');
    return { adminAuth, adminDb };
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
    throw error;
  }
}

export function getFirebaseAdmin() {
  if (!adminAuth || !adminDb) {
    console.log('[Firebase Admin] Services not initialized, initializing now');
    initializeFirebaseAdmin();
  }
  return { auth: adminAuth, db: adminDb };
}
