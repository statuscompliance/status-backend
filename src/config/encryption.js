import crypto from 'crypto';
const algorithm = 'aes-256-gcm';
const secretKey = process.env.SECRET_ENCRYPTION_KEY;

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + authTag.toString('hex');
}

export function decrypt(encryptedData) {
  const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}
