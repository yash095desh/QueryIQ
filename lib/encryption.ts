import crypto from 'crypto';

// ===========================
// Configuration
// ===========================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one using: openssl rand -base64 32'
    );
  }
  
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  
  return key;
}

/**
 * Derive a key from the master key and salt using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  const masterKey = getEncryptionKey();
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

// ===========================
// Encryption
// ===========================

/**
 * Encrypt sensitive data (like database URLs)
 * 
 * @param text - The plaintext to encrypt
 * @returns Base64 encoded encrypted string with salt, IV, and auth tag
 * 
 * @example
 * ```typescript
 * const encrypted = encrypt('postgresql://user:pass@localhost:5432/db');
 * ```
 */
export function encrypt(text: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(salt);
    
    // Create cipher and encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, IV, tag, and encrypted data
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    
    // Return as base64 string
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

// ===========================
// Decryption
// ===========================

/**
 * Decrypt encrypted data
 * 
 * @param encryptedData - Base64 encoded encrypted string
 * @returns Decrypted plaintext
 * 
 * @example
 * ```typescript
 * const dbUrl = decrypt(project.encryptedDbUrl);
 * ```
 */
export function decrypt(encryptedData: string): string {
  try {
    // Decode from base64
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(salt);
    
    // Create decipher and decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data. The data may be corrupted or the encryption key may have changed.');
  }
}

// ===========================
// Validation
// ===========================

/**
 * Validate that encryption is properly configured
 * Should be called at application startup
 */
export function validateEncryption(): boolean {
  try {
    const testString = 'test-encryption-validation';
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);
    
    if (decrypted !== testString) {
      throw new Error('Encryption validation failed: decrypted text does not match original');
    }
    
    console.log('✅ Encryption configured correctly');
    return true;
  } catch (error) {
    console.error('❌ Encryption validation failed:', error);
    throw error;
  }
}
