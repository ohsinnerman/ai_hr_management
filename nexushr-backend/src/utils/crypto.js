import crypto from 'crypto';

// AES-256-GCM encryption for PII at rest (bankDetails, panNumber, aadhaarNumber).
// Stored format: "<ivHex>:<authTagHex>:<cipherHex>" so each value is self-describing.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

// Derive a deterministic 32-byte key from ENCRYPTION_KEY of any length.
const getKey = () =>
  crypto
    .createHash('sha256')
    .update(String(process.env.ENCRYPTION_KEY || 'dev-encryption-key-change-me'))
    .digest();

/**
 * Encrypt a string (or any value coerced to string). Objects are JSON-stringified.
 * Returns null/undefined/'' unchanged so empty fields stay empty.
 */
export const encrypt = (value) => {
  if (value === null || value === undefined || value === '') return value;
  const plain = typeof value === 'string' ? value : JSON.stringify(value);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
};

/**
 * Decrypt a value produced by encrypt(). If the input isn't in the expected
 * "iv:tag:cipher" format it's returned as-is (e.g. legacy/plaintext data).
 */
export const decrypt = (payload) => {
  if (!payload || typeof payload !== 'string' || payload.split(':').length !== 3) return payload;
  try {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null; // tampered or wrong key
  }
};

/**
 * Mask a sensitive string for display, keeping only the last `visible` chars.
 * e.g. maskSensitive('ABCDE1234F') -> '******234F'
 */
export const maskSensitive = (value, visible = 4) => {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= visible) return '*'.repeat(value.length);
  return '*'.repeat(value.length - visible) + value.slice(-visible);
};
