import { describe, it, expect } from 'vitest';
import * as encryption from '../../../src/config/encryption.js';

describe('encryption.js', () => {
  const plainText = 'Sample text to encrypt';
  
  it('should encrypt and decrypt text correctly', () => {
    const encrypted = encryption.encrypt(plainText);
    expect(encrypted).toBeTypeOf('string');
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = encryption.decrypt(encrypted);
    expect(decrypted).toBe(plainText);
  });

  it('should throw if decrypting with tampered data', () => {
    const encrypted = encryption.encrypt(plainText);
    // Tamper with the authTag
    const [iv, data, authTag] = encrypted.split(':');
    const tampered = `${iv}:${data}:${authTag.slice(0, -2)}00`;
    expect(() => encryption.decrypt(tampered)).toThrow();
  });

  it('should throw if decrypting with wrong format', () => {
    expect(() => encryption.decrypt('invalid:format:extra')).toThrow();
    expect(() => encryption.decrypt('')).toThrow();
  });

  it('should produce different ciphertexts for the same input (random IV)', () => {
    const encrypted1 = encryption.encrypt(plainText);
    const encrypted2 = encryption.encrypt(plainText);
    expect(encrypted1).not.toBe(encrypted2);
    expect(encryption.decrypt(encrypted1)).toBe(plainText);
    expect(encryption.decrypt(encrypted2)).toBe(plainText);
  });
});
