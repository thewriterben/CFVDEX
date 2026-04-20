import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export interface EncryptedPayload {
  salt: string;
  iv: string;
  ciphertext: string;
  authTag: string;
}

export class KeyStore {
  encrypt(plaintext: string, passphrase: string): EncryptedPayload {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = pbkdf2Sync(passphrase, salt, 120_000, 32, 'sha512');

    const cipher = createCipheriv(ALGO, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      ciphertext: ciphertext.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(payload: EncryptedPayload, passphrase: string): string {
    const salt = Buffer.from(payload.salt, 'hex');
    const iv = Buffer.from(payload.iv, 'hex');
    const key = pbkdf2Sync(passphrase, salt, 120_000, 32, 'sha512');

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'hex')),
      decipher.final()
    ]);

    return plaintext.toString('utf8');
  }
}
