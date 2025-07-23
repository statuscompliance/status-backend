import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export function generate2FASecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name: `Status (${userEmail})`,
  });

  return {
    otpauth_url: secret.otpauth_url,
    base32: secret.base32,
  };
}

export async function generateQRCode(otpauthUrl) {
  return await qrcode.toDataURL(otpauthUrl);
}

export function verifyOTP(token, userSecret) {
  return speakeasy.totp.verify({
    secret: userSecret,
    encoding: 'base32',
    token,
    window: 1, // default step of 30 seconds
  });
}
