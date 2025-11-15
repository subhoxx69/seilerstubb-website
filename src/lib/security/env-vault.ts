/**
 * Environment Vault System
 * Manages encrypted sensitive credentials
 */

import { decryptSensitiveData, encryptSensitiveData } from './encryption-service';

interface VaultConfig {
  encryptionKey: string;
  environment: 'development' | 'production' | 'staging';
}

class EnvironmentVault {
  private config: VaultConfig;
  private cache: Map<string, string> = new Map();

  constructor(config: VaultConfig) {
    this.config = config;
  }

  /**
   * Get a decrypted secret value
   */
  public getSecret(secretName: string): string | undefined {
    // Check cache first
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName);
    }

    // Get from environment
    const encryptedValue = process.env[`VAULT_${secretName}`];
    
    if (!encryptedValue) {
      console.warn(`Secret ${secretName} not found in vault`);
      return undefined;
    }

    try {
      const decrypted = decryptSensitiveData(encryptedValue, this.config.encryptionKey);
      this.cache.set(secretName, decrypted);
      return decrypted;
    } catch (error) {
      console.error(`Failed to decrypt secret ${secretName}:`, error);
      throw new Error(`Cannot access secret: ${secretName}`);
    }
  }

  /**
   * Get all decrypted secrets matching a pattern
   */
  public getAllSecrets(pattern?: string): Record<string, string> {
    const secrets: Record<string, string> = {};

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('VAULT_')) {
        const secretName = key.replace('VAULT_', '');
        
        if (pattern && !secretName.match(pattern)) {
          continue;
        }

        try {
          secrets[secretName] = decryptSensitiveData(value as string, this.config.encryptionKey);
        } catch (error) {
          console.error(`Failed to decrypt ${secretName}:`, error);
        }
      }
    }

    return secrets;
  }

  /**
   * Set an encrypted secret
   */
  public setSecret(secretName: string, value: string): void {
    const encrypted = encryptSensitiveData(value, this.config.encryptionKey);
    process.env[`VAULT_${secretName}`] = encrypted;
    this.cache.set(secretName, value);
  }

  /**
   * Clear cache (for testing)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.config.environment === 'production';
  }
}

// Create global vault instance
let vault: EnvironmentVault | null = null;

/**
 * Initialize the vault
 */
export function initializeVault(config: VaultConfig): EnvironmentVault {
  if (vault) {
    return vault;
  }

  vault = new EnvironmentVault(config);
  return vault;
}

/**
 * Get the vault instance
 */
export function getVault(): EnvironmentVault {
  if (!vault) {
    throw new Error('Vault not initialized. Call initializeVault() first.');
  }
  return vault;
}

export default EnvironmentVault;
