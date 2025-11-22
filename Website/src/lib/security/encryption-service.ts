/**
 * Encryption Service for Sensitive API Keys
 * Encrypts sensitive data before deployment to prevent leaks
 */

import crypto from 'crypto';

/**
 * Generate a new encryption key (32 bytes for AES-256)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param plaintext - Data to encrypt
 * @param encryptionKey - 32-byte hex key
 * @returns Encrypted data in format: iv:encryptedData:authTag
 */
export function encryptSensitiveData(plaintext: string, encryptionKey: string): string {
  try {
    // Validate key length (should be 64 hex characters = 32 bytes)
    if (encryptionKey.length !== 64) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }

    const key = Buffer.from(encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    
    // Create cipher with AES-256-GCM for authenticated encryption
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:encrypted:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

/**
 * Decrypt encrypted data
 * @param encryptedData - Data in format: iv:encryptedData:authTag
 * @param encryptionKey - 32-byte hex key
 * @returns Decrypted plaintext
 */
export function decryptSensitiveData(encryptedData: string, encryptionKey: string): string {
  try {
    if (encryptionKey.length !== 64) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }

    const key = Buffer.from(encryptionKey, 'hex');
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

/**
 * Encrypt environment variables for production
 */
export function encryptEnvironmentVariables(
  envVars: Record<string, string>,
  encryptionKey: string,
  keysToEncrypt: string[]
): Record<string, string> {
  const encrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(envVars)) {
    if (keysToEncrypt.includes(key)) {
      encrypted[key] = encryptSensitiveData(value, encryptionKey);
    } else {
      encrypted[key] = value;
    }
  }
  
  return encrypted;
}

/**
 * Decrypt environment variables from production
 */
export function decryptEnvironmentVariables(
  encryptedVars: Record<string, string>,
  encryptionKey: string,
  keysToDecrypt: string[]
): Record<string, string> {
  const decrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(encryptedVars)) {
    if (keysToDecrypt.includes(key)) {
      decrypted[key] = decryptSensitiveData(value, encryptionKey);
    } else {
      decrypted[key] = value;
    }
  }
  
  return decrypted;
}

/**
 * Hash a value for verification (one-way)
 */
export function hashValue(value: string, salt: string = ''): string {
  return crypto
    .createHash('sha256')
    .update(value + salt)
    .digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
