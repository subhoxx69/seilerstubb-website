/**
 * Secrets Manager
 * Centralized access to all sensitive credentials
 */

import { getVault } from './env-vault';

class SecretsManager {
  /**
   * Firebase Configuration
   */
  static getFirebaseConfig() {
    const vault = getVault();
    
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
  }

  /**
   * Firebase Admin SDK (Server-side only)
   */
  static getFirebaseAdminConfig() {
    const vault = getVault();
    
    return {
      type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE,
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: vault.getSecret('FIREBASE_PRIVATE_KEY') || process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };
  }

  /**
   * Gmail Configuration
   */
  static getGmailConfig() {
    const vault = getVault();
    
    return {
      userEmail: process.env.GMAIL_USER_EMAIL,
      appPassword: vault.getSecret('GMAIL_APP_PASSWORD') || process.env.GMAIL_APP_PASSWORD,
    };
  }

  /**
   * Google OAuth Configuration
   */
  static getGoogleOAuthConfig() {
    const vault = getVault();
    
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: vault.getSecret('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    };
  }

  /**
   * ImageKit Configuration
   */
  static getImageKitConfig() {
    const vault = getVault();
    
    return {
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: vault.getSecret('IMAGEKIT_PRIVATE_KEY') || process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    };
  }

  /**
   * Encryption Keys
   */
  static getEncryptionKeys() {
    const vault = getVault();
    
    return {
      masterKey: vault.getSecret('ENCRYPTION_MASTER_KEY') || process.env.ENCRYPTION_MASTER_KEY,
      hashSecret: vault.getSecret('HASH_SECRET') || process.env.HASH_SECRET,
    };
  }

  /**
   * Get all secrets safely
   */
  static getAllSecrets() {
    return {
      firebase: this.getFirebaseConfig(),
      firebaseAdmin: this.getFirebaseAdminConfig(),
      gmail: this.getGmailConfig(),
      googleOAuth: this.getGoogleOAuthConfig(),
      imageKit: this.getImageKitConfig(),
      encryption: this.getEncryptionKeys(),
    };
  }

  /**
   * Validate secrets are properly configured
   */
  static validateSecrets(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check Firebase
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      errors.push('Missing FIREBASE_PROJECT_ID');
    }

    // Check Gmail
    if (!process.env.GMAIL_USER_EMAIL) {
      errors.push('Missing GMAIL_USER_EMAIL');
    }

    // Check Google OAuth
    if (!process.env.GOOGLE_CLIENT_ID) {
      errors.push('Missing GOOGLE_CLIENT_ID');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Log which secrets are configured (safe logging)
   */
  static logSecretStatus(): void {
    console.log('✅ Configured Secrets:');
    console.log(`  • Firebase: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓' : '✗'}`);
    console.log(`  • Gmail: ${process.env.GMAIL_USER_EMAIL ? '✓' : '✗'}`);
    console.log(`  • Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✓' : '✗'}`);
    console.log(`  • ImageKit: ${process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ? '✓' : '✗'}`);
    console.log('⚠️  Never log actual secret values in production!');
  }
}

export default SecretsManager;
