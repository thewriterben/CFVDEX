import { describe, it, expect } from 'vitest';
import { KeyStore } from '../src/wallet/KeyStore';

describe('KeyStore', () => {
  const store = new KeyStore();

  it('round-trip: encrypt then decrypt with same passphrase returns original text', () => {
    const plaintext = 'hello world secret data';
    const passphrase = 'my-strong-passphrase';

    const encrypted = store.encrypt(plaintext, passphrase);
    const decrypted = store.decrypt(encrypted, passphrase);

    expect(decrypted).toBe(plaintext);
  });

  it('different passphrases produce different ciphertext', () => {
    const plaintext = 'same-data';
    const enc1 = store.encrypt(plaintext, 'pass-a');
    const enc2 = store.encrypt(plaintext, 'pass-b');

    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it('decrypt with wrong passphrase throws', () => {
    const encrypted = store.encrypt('secret', 'correct-pass');

    expect(() => store.decrypt(encrypted, 'wrong-pass')).toThrow();
  });

  it('different plaintexts produce different ciphertext', () => {
    const passphrase = 'same-pass';
    const enc1 = store.encrypt('text-a', passphrase);
    const enc2 = store.encrypt('text-b', passphrase);

    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });
});
