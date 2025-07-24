import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as userController from '../../../../src/controllers/user.controller.js';
import { models } from '../../../../src/models/models.js';
import bcrypt from 'bcrypt';
import * as errorHandler from '../../../../src/utils/errorHandler.js';
import * as twofaGenerator from '../../../../src/utils/twofaGenerator.js';
import * as encryption from '../../../../src/config/encryption.js';
import {
  MOCK_QR_CODE,
  MOCK_SECRET,
  MOCK_ENCRYPTED_SECRET,
  MOCK_OTP_TOKEN,
  USER_WITH_2FA_ENABLED,
  USER_WITH_2FA_SETUP,
  USER_WITHOUT_2FA,
  createRes,
  create2FASetupReq,
  create2FAVerifyReq,
  create2FAStatusReq,
  create2FADisableReq,
  mock2FAUtils,
  setupCommonMocks,
  restoreEnvironment
} from './test-helpers.js';

describe('Two-Factor Authentication Tests', () => {
  beforeEach(() => {
    setupCommonMocks();
  });

  afterEach(() => {
    restoreEnvironment();
  });

  // Test setup2FA
  describe('setup2FA', () => {
    beforeEach(() => {
      mock2FAUtils();
    });

    it('should generate QR code and save encrypted secret for 2FA setup', async () => {
      const mockUser = { ...USER_WITHOUT_2FA };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = create2FASetupReq();
      const res = createRes();

      await userController.setup2FA(req, res);

      expect(models.User.findByPk).toHaveBeenCalledWith(1);
      expect(twofaGenerator.generate2FASecret).toHaveBeenCalledWith(mockUser.email);
      expect(twofaGenerator.generateQRCode).toHaveBeenCalledWith('otpauth://totp/test');
      expect(encryption.encrypt).toHaveBeenCalledWith(MOCK_SECRET);
      expect(mockUser.update).toHaveBeenCalledWith({ twofa_secret: MOCK_ENCRYPTED_SECRET });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ qrCode: MOCK_QR_CODE });
    });

    it('should return 404 if user not found in setup2FA', async () => {
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
      
      const req = create2FASetupReq();
      const res = createRes();

      await userController.setup2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors during 2FA setup', async () => {
      const error = new Error('Setup failed');
      vi.spyOn(models.User, 'findByPk').mockRejectedValue(error);
      
      const req = create2FASetupReq();
      const res = createRes();

      await userController.setup2FA(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res,
        error,
        'Failed to setup 2FA'
      );
    });
  });

  // Test verify2FA
  describe('verify2FA', () => {
    beforeEach(() => {
      mock2FAUtils();
    });

    it('should enable 2FA when token is valid', async () => {
      const mockUser = { ...USER_WITH_2FA_SETUP };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = create2FAVerifyReq();
      const res = createRes();

      await userController.verify2FA(req, res);

      expect(encryption.decrypt).toHaveBeenCalledWith(MOCK_ENCRYPTED_SECRET);
      expect(twofaGenerator.verifyOTP).toHaveBeenCalledWith(MOCK_OTP_TOKEN, MOCK_SECRET);
      expect(mockUser.update).toHaveBeenCalledWith({ twofa_enabled: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: '2FA enabled successfully' });
    });

    it('should return 401 for invalid 2FA token', async () => {
      const mockUser = { ...USER_WITH_2FA_SETUP };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      vi.spyOn(twofaGenerator, 'verifyOTP').mockReturnValue(false);
      
      const req = create2FAVerifyReq(1, 'invalid_token');
      const res = createRes();

      await userController.verify2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid 2FA token' });
    });

    it('should return 400 if 2FA not set up', async () => {
      const mockUser = { ...USER_WITHOUT_2FA };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = create2FAVerifyReq();
      const res = createRes();

      await userController.verify2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '2FA not set up' });
    });

    it('should return 400 if user not found', async () => {
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
      
      const req = create2FAVerifyReq();
      const res = createRes();

      await userController.verify2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '2FA not set up' });
    });

    it('should handle errors during 2FA verification', async () => {
      const error = new Error('Verification failed');
      vi.spyOn(models.User, 'findByPk').mockRejectedValue(error);
      
      const req = create2FAVerifyReq();
      const res = createRes();

      await userController.verify2FA(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res,
        error,
        'Failed to verify 2FA'
      );
    });
  });

  // Test get2FAStatus
  describe('get2FAStatus', () => {
    it('should return 2FA status for user', async () => {
      const mockUser = { twofa_enabled: true };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = create2FAStatusReq();
      const res = createRes();

      await userController.get2FAStatus(req, res);

      expect(models.User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['twofa_enabled']
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ twofa_enabled: true });
    });

    it('should return 404 if user not found', async () => {
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
      
      const req = create2FAStatusReq();
      const res = createRes();

      await userController.get2FAStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors during status check', async () => {
      const error = new Error('Status check failed');
      vi.spyOn(models.User, 'findByPk').mockRejectedValue(error);
      
      const req = create2FAStatusReq();
      const res = createRes();

      await userController.get2FAStatus(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res,
        error,
        'Failed to fetch 2FA status'
      );
    });
  });

  // Test disable2FA
  describe('disable2FA', () => {
    beforeEach(() => {
      mock2FAUtils();
    });

    it('should disable 2FA with valid password and token', async () => {
      const mockUser = { ...USER_WITH_2FA_ENABLED };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      
      const req = create2FADisableReq();
      const res = createRes();

      await userController.disable2FA(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', mockUser.password);
      expect(encryption.decrypt).toHaveBeenCalledWith(MOCK_ENCRYPTED_SECRET);
      expect(twofaGenerator.verifyOTP).toHaveBeenCalledWith(MOCK_OTP_TOKEN, MOCK_SECRET);
      expect(mockUser.update).toHaveBeenCalledWith({ 
        twofa_enabled: false, 
        twofa_secret: null 
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: '2FA has been disabled successfully' });
    });

    it('should return 400 if password or token missing', async () => {
      const req = {
        user: { user_id: 1 },
        body: { password: 'test' } // Missing totpToken
      };
      const res = createRes();

      await userController.disable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Password and 2FA totpToken are required' 
      });
    });

    it('should return 400 if 2FA is not enabled', async () => {
      const mockUser = { ...USER_WITHOUT_2FA };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = create2FADisableReq();
      const res = createRes();

      await userController.disable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: '2FA is not enabled for this user' 
      });
    });

    it('should return 404 if user not found in disable2FA', async () => {
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
      
      const req = create2FADisableReq();
      const res = createRes();

      await userController.disable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'User not found' 
      });
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = { ...USER_WITH_2FA_ENABLED };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      
      const req = create2FADisableReq(1, 'wrongPassword');
      const res = createRes();

      await userController.disable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid password' });
    });

    it('should return 401 for invalid 2FA token', async () => {
      const mockUser = { ...USER_WITH_2FA_ENABLED };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      vi.spyOn(twofaGenerator, 'verifyOTP').mockReturnValue(false);
      
      const req = create2FADisableReq(1, 'correctPassword', 'invalid_token');
      const res = createRes();

      await userController.disable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid 2FA totpToken' });
    });

    it('should handle errors during 2FA disable', async () => {
      const error = new Error('Disable failed');
      vi.spyOn(models.User, 'findByPk').mockRejectedValue(error);
      
      const req = create2FADisableReq();
      const res = createRes();

      await userController.disable2FA(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res,
        error,
        'Failed to disable 2FA'
      );
    });
  });
});
