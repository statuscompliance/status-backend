import { vi, expect } from 'vitest';
import { models } from '../../../../src/models/models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as errorHandler from '../../../../src/utils/errorHandler.js';
import * as twofaGenerator from '../../../../src/utils/twofaGenerator.js';
import * as encryption from '../../../../src/config/encryption.js';
import { 
  DEFAULT_USER, 
  adminUser,
  newUserData 
} from '../../../../tests/utils/sampleUserData.js';

// Constants for reuse
export const MOCK_TOKEN = 'mockToken';
export const MOCK_QR_CODE = 'data:image/png;base64,mock_qr_code_data';
export const MOCK_SECRET = 'JBSWY3DPEHPK3PXP';
export const MOCK_ENCRYPTED_SECRET = 'encrypted_secret_string';
export const MOCK_OTP_TOKEN = '123456';

// Sample users with 2FA data
export const USER_WITH_2FA_ENABLED = {
  ...DEFAULT_USER,
  id: 1,
  password: 'hashedPassword', // Ensure password is available
  twofa_enabled: true,
  twofa_secret: MOCK_ENCRYPTED_SECRET,
  update: vi.fn().mockResolvedValue([1])
};

export const USER_WITH_2FA_SETUP = {
  ...DEFAULT_USER,
  id: 1,
  password: 'hashedPassword', // Ensure password is available
  twofa_enabled: false,
  twofa_secret: MOCK_ENCRYPTED_SECRET,
  update: vi.fn().mockResolvedValue([1])
};

export const USER_WITHOUT_2FA = {
  ...DEFAULT_USER,
  id: 1,
  password: 'hashedPassword', // Ensure password is available
  twofa_enabled: false,
  twofa_secret: null,
  update: vi.fn().mockResolvedValue([1])
};

// Save original environment
export const originalEnv = process.env.NODE_ENV;

// Helper to create simple mock req/res objects
export function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

// Helper function to create signin request
export function createSignInReq(username = DEFAULT_USER.username, password = 'correctPassword', totpToken = null) {
  const body = { username, password };
  if (totpToken) {
    body.totpToken = totpToken;
  }
  return { body };
}

// Helper function to create 2FA setup request
export function create2FASetupReq(userId = 1) {
  return { user: { user_id: userId } };
}

// Helper function to create 2FA verify request
export function create2FAVerifyReq(userId = 1, totpToken = MOCK_OTP_TOKEN) {
  return { 
    user: { user_id: userId },
    body: { totpToken }
  };
}

// Helper function to create 2FA disable request
export function create2FADisableReq(userId = 1, password = 'correctPassword', totpToken = MOCK_OTP_TOKEN) {
  return {
    user: { user_id: userId },
    body: { password, totpToken }
  };
}

// Helper function to create 2FA status request
export function create2FAStatusReq(userId = 1) {
  return { user: { user_id: userId } };
}

// Helper function to create whoami request
export function createWhoamiReq(user = { user_id: 1 }) {
  return { user };
}

// Helper function to mock 2FA utilities
export function mock2FAUtils() {
  vi.spyOn(twofaGenerator, 'generate2FASecret').mockReturnValue({
    base32: MOCK_SECRET,
    otpauth_url: 'otpauth://totp/test'
  });
  vi.spyOn(twofaGenerator, 'generateQRCode').mockResolvedValue(MOCK_QR_CODE);
  vi.spyOn(twofaGenerator, 'verifyOTP').mockReturnValue(true);
  vi.spyOn(encryption, 'encrypt').mockReturnValue(MOCK_ENCRYPTED_SECRET);
  vi.spyOn(encryption, 'decrypt').mockReturnValue(MOCK_SECRET);
}

// Helper function to mock successful auth
export function mockSuccessfulAuth(user = DEFAULT_USER) {
  setupUserMocks({ 
    findOneValue: user, 
    compareValue: true 
  });
  vi.spyOn(jwt, 'sign').mockReturnValue(MOCK_TOKEN);
}

// Helper to setup common mocks for tests
export function setupUserMocks({
  findOneValue = null,
  findAllValue = [],
  compareValue = false,
  createValue = {},
  updateValue = [1],
} = {}) {
  vi.spyOn(models.User, 'findOne').mockResolvedValue(findOneValue);
  vi.spyOn(models.User, 'findAll').mockResolvedValue(findAllValue);
  vi.spyOn(bcrypt, 'compare').mockResolvedValue(compareValue);
  vi.spyOn(models.User, 'create').mockResolvedValue(createValue);
  vi.spyOn(models.User, 'update').mockResolvedValue(updateValue);
  return { findOne: models.User.findOne, findAll: models.User.findAll };
}

// Helper for common cookie clear expectations based on environment
export function expectCookiesCleared(res, includeNodeRed = true) {
  const cookieOptions = getClearCookieOptionsForTest();
  
  expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', cookieOptions);
  expect(res.clearCookie).toHaveBeenCalledWith('accessToken', cookieOptions);
  if (includeNodeRed) {
    expect(res.clearCookie).toHaveBeenCalledWith('nodeRedToken', cookieOptions);
  }
}

// Helper to get expected cookie options based on current NODE_ENV
export function getCookieOptionsForTest(maxAge = 3600) {
  if (process.env.NODE_ENV === 'development') {
    return { 
      httpOnly: true, 
      path: '/',
      maxAge: maxAge * 1000 
    };
  } else if (process.env.NODE_ENV === 'production') {
    return { 
      httpOnly: true, 
      path: '/',
      maxAge: maxAge * 1000, 
      sameSite: 'none', 
      secure: true, 
      partitioned: true 
    };
  } else {
    return { 
      httpOnly: true, 
      path: '/',
      maxAge: maxAge * 1000, 
      sameSite: 'lax' 
    };
  }
}

// Helper to get expected cookie clear options based on current NODE_ENV
export function getClearCookieOptionsForTest() {
  if (process.env.NODE_ENV === 'development') {
    return { 
      httpOnly: true, 
      path: '/' 
    };
  } else if (process.env.NODE_ENV === 'production') {
    return { 
      httpOnly: true, 
      path: '/',
      sameSite: 'none', 
      secure: true 
    };
  } else {
    return { 
      httpOnly: true, 
      path: '/',
      sameSite: 'lax' 
    };
  }
}

// Setup common beforeEach functionality
export function setupCommonMocks() {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(errorHandler, 'handleControllerError').mockImplementation((res, error, message) => {
    return res.status(500).json({ message: message || 'Internal server error' });
  });
  // Default to 'test' environment for most tests
  process.env.NODE_ENV = 'test';
}

// Restore environment
export function restoreEnvironment() {
  process.env.NODE_ENV = originalEnv;
}

// Export user data for convenience
export { DEFAULT_USER, adminUser, newUserData };
