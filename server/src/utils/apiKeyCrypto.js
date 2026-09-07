import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const PREFIX = 'enc:v1:';

const getEncryptionKey = () => {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET must be configured');
  }
  return createHash('sha256').update(secret).digest();
};

export const isEncryptedAPIKey = (value) => typeof value === 'string' && value.startsWith(PREFIX);

export const encryptAPIKey = (value) => {
  if (!value || isEncryptedAPIKey(value)) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
};

export const decryptAPIKey = (value) => {
  if (!value || !isEncryptedAPIKey(value)) return value || '';

  const [, payload] = value.split(PREFIX);
  const [iv, authTag, encrypted] = payload.split('.').map(part => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
