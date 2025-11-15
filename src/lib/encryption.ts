/**
 * Encryption Utility Module
 * Provides AES-256-GCM encryption/decryption and HMAC-SHA256 hashing
 * for secure server-side data storage and deterministic lookups.
 */

import crypto from 'crypto';

// Initialize master key and hash secret from environment
const ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY;
const HASH_SECRET = process.env.HASH_SECRET;

if (!ENCRYPTION_MASTER_KEY || !HASH_SECRET) {
  throw new Error(
    'Missing required encryption keys. Set ENCRYPTION_MASTER_KEY and HASH_SECRET in .env.local'
  );
}

// Decode base64 keys
const masterKeyBuffer = Buffer.from(ENCRYPTION_MASTER_KEY, 'base64');
const hashSecretBuffer = Buffer.from(HASH_SECRET, 'base64');

// Validate key lengths
if (masterKeyBuffer.length !== 32) {
  throw new Error('ENCRYPTION_MASTER_KEY must be 32 bytes (256 bits)');
}

if (hashSecretBuffer.length < 32) {
  console.warn('HASH_SECRET should be at least 32 bytes for security');
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Plain object to encrypt
 * @returns Encrypted blob with IV and auth tag
 */
export function encrypt(data: any): string {
  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKeyBuffer, iv);

    const jsonString = JSON.stringify(data);
    const encrypted = cipher.update(jsonString, 'utf-8', 'hex');
    const finalEncrypted = encrypted + cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Combine: iv + authTag + encrypted data
    const combined = Buffer.concat([iv, authTag, Buffer.from(finalEncrypted, 'hex')]);
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Base64-encoded encrypted blob
 * @returns Decrypted object
 */
export function decrypt(encryptedData: string): any {
  try {
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const iv = combined.slice(0, 12);
    const authTag = combined.slice(12, 28);
    const ciphertext = combined.slice(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKeyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate deterministic HMAC-SHA256 hash
 * Used for searchable fields like email, IP, user-agent
 * @param value - Value to hash
 * @returns Base64-encoded hash
 */
export function hashValue(value: string): string {
  try {
    const hmac = crypto.createHmac('sha256', hashSecretBuffer);
    hmac.update(value);
    return hmac.digest('base64url');
  } catch (error) {
    console.error('Hashing failed:', error);
    throw new Error('Failed to hash value');
  }
}

/**
 * Generate a deterministic date index (YYYY-MM-DD)
 * Used for admin queries without decryption overhead
 * @param date - Date object or ISO string
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateIndex(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    return d.toISOString().split('T')[0];
  } catch (error) {
    console.error('Date indexing failed:', error);
    throw new Error('Failed to generate date index');
  }
}

/**
 * Extract meta information from request
 * @param req - Node.js request object
 * @returns Object with ipHash and uaHash
 */
export function extractAndHashMeta(req: any): { ipHash: string; uaHash: string } {
  try {
    // Extract IP from headers (priority: CF-Connecting-IP > X-Forwarded-For > remoteAddress)
    let ip =
      req.headers?.['cf-connecting-ip'] ||
      req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    if (typeof ip !== 'string') {
      ip = 'unknown';
    }

    // Extract user-agent
    const ua = (req.headers?.['user-agent'] || 'unknown') as string;

    return {
      ipHash: hashValue(ip),
      uaHash: hashValue(ua),
    };
  } catch (error) {
    console.error('Meta extraction failed:', error);
    return {
      ipHash: hashValue('unknown'),
      uaHash: hashValue('unknown'),
    };
  }
}

/**
 * Validate encryption key rotation (for future use)
 * Returns true if key should be rotated based on age
 * Currently a no-op; implement rotation policy as needed
 */
export function shouldRotateKey(): boolean {
  // TODO: Implement key rotation policy
  // Check KEY_ROTATION_INTERVAL from env or config
  return false;
}

/**
 * Unit tests (can be run with: node -r ts-node/register --test src/lib/encryption.ts)
 */
export function runTests() {
  console.log('Running encryption tests...');

  // Test 1: Encrypt/Decrypt roundtrip
  try {
    const testData = { email: 'test@example.com', name: 'Test User', phone: '123456789' };
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    if (
      decrypted.email === testData.email &&
      decrypted.name === testData.name &&
      decrypted.phone === testData.phone
    ) {
      console.log('✓ Encrypt/Decrypt roundtrip passed');
    } else {
      console.error('✗ Encrypt/Decrypt roundtrip failed: data mismatch');
    }
  } catch (error) {
    console.error('✗ Encrypt/Decrypt roundtrip failed:', error);
  }

  // Test 2: Hash determinism
  try {
    const value = 'test@example.com';
    const hash1 = hashValue(value);
    const hash2 = hashValue(value);

    if (hash1 === hash2) {
      console.log('✓ Hash determinism passed');
    } else {
      console.error('✗ Hash determinism failed: hashes do not match');
    }
  } catch (error) {
    console.error('✗ Hash determinism failed:', error);
  }

  // Test 3: Different values produce different hashes
  try {
    const hash1 = hashValue('test1@example.com');
    const hash2 = hashValue('test2@example.com');

    if (hash1 !== hash2) {
      console.log('✓ Hash uniqueness passed');
    } else {
      console.error('✗ Hash uniqueness failed: different values produced same hash');
    }
  } catch (error) {
    console.error('✗ Hash uniqueness failed:', error);
  }

  // Test 4: Date indexing
  try {
    const date = new Date('2025-11-09');
    const index = getDateIndex(date);

    if (index === '2025-11-09') {
      console.log('✓ Date indexing passed');
    } else {
      console.error(`✗ Date indexing failed: expected '2025-11-09', got '${index}'`);
    }
  } catch (error) {
    console.error('✗ Date indexing failed:', error);
  }

  console.log('Tests completed.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
