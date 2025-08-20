import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as twofaUtils from '../../../src/utils/twofaGenerator';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

describe('twofaGenerator utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate2FASecret', () => {
    it('should generate a 2FA secret with correct name format', () => {
      // Mock speakeasy.generateSecret
      const mockSecret = {
        otpauth_url: 'otpauth://totp/test',
        base32: 'S3CR3TBASE32'
      };

      const generateSecretSpy = vi.spyOn(speakeasy, 'generateSecret').mockReturnValue(mockSecret);

      const userEmail = 'user@example.com';
      const result = twofaUtils.generate2FASecret(userEmail);

      expect(generateSecretSpy).toHaveBeenCalledWith({
        name: `Status (${userEmail})`
      });
      expect(result).toEqual(mockSecret);
    });
  });

  describe('generateQRCode', () => {
    it('should generate a QR code data URL from the otpauth URL', async () => {
      const otpauthUrl = 'otpauth://totp/test';
      const mockQRCodeDataUrl = 'data:image/png;base64,mockqrcode';

      // Mock qrcode.toDataURL
      const toDataURLSpy = vi.spyOn(qrcode, 'toDataURL').mockResolvedValue(mockQRCodeDataUrl);

      const result = await twofaUtils.generateQRCode(otpauthUrl);

      expect(toDataURLSpy).toHaveBeenCalledWith(otpauthUrl);
      expect(result).toBe(mockQRCodeDataUrl);
    });
  });

  describe('verifyOTP', () => {
    it('should return true if speakeasy.totp.verify returns true', () => {
      const token = '123456';
      const userSecret = 'S3CR3TBASE32';

      const verifySpy = vi.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = twofaUtils.verifyOTP(token, userSecret);

      expect(verifySpy).toHaveBeenCalledWith({
        secret: userSecret,
        encoding: 'base32',
        token,
        window: 1
      });
      expect(result).toBe(true);
    });

    it('should return false if speakeasy.totp.verify returns false', () => {
      const token = '654321';
      const userSecret = 'OTHERSECRET';

      const verifySpy = vi.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      const result = twofaUtils.verifyOTP(token, userSecret);

      expect(verifySpy).toHaveBeenCalledWith({
        secret: userSecret,
        encoding: 'base32',
        token,
        window: 1
      });
      expect(result).toBe(false);
    });
  });
});
