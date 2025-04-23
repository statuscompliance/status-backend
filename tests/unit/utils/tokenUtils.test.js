import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { models } from '../../../src/models/models';
import {
  verifyAccessToken,
  refreshAccessToken,
} from '../../../src/utils/tokenUtils';

const mockUser = {
  username: 'testuser',
  password: 'testpassword',
  authority: 'ADMIN',
  email: 'testuser@status.es',
};

describe('tokenUtils.verifyAccessToken', () => {
  let jwtVerifySpy;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    jwtVerifySpy = vi.spyOn(jwt, 'verify'); // Spy on jwt.verify to mock its behavior
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore mocks after each test
  });
  it('Should return decoded user data for valid token', async () => {
    const validToken = 'valid_token_example'; // Simulated valid token

    // Mock jwt.verify to return a decoded value
    jwtVerifySpy.mockReturnValueOnce(mockUser);

    const result = await verifyAccessToken(validToken);

    // Verify that jwt.verify was called correctly
    expect(jwtVerifySpy).toHaveBeenCalledWith(validToken, expect.any(String)); // The secret key should be in your environment

    // Verify that the relevant properties are correct
    expect(result.decoded.username).toBe(mockUser.username);
    expect(result.decoded.authority).toBe(mockUser.authority);
    expect(result.decoded.password).toBe(mockUser.password);
    expect(result.decoded.email).toBe(mockUser.email);
  });
  it('Should return an error for invalid token', async () => {
    const invalidToken = 'invalid_token_example'; // Simulated invalid token

    // Mock jwt.verify to throw an error
    jwtVerifySpy.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    const result = await verifyAccessToken(invalidToken);

    expect(jwtVerifySpy).toHaveBeenCalledWith(invalidToken, expect.any(String));

    expect(result).toHaveProperty('error');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Invalid token');
  });

  it('Should return an error for expired token', async () => {
    const expiredToken = 'expired_token_example'; // Simulated expired token

    // Mock jwt.verify to throw an expiration error
    jwtVerifySpy.mockImplementationOnce(() => {
      throw new jwt.TokenExpiredError('Token expired', new Date());
    });

    const result = await verifyAccessToken(expiredToken);

    expect(jwtVerifySpy).toHaveBeenCalledWith(expiredToken, expect.any(String));

    expect(result).toHaveProperty('error');
    expect(result.error).toBeInstanceOf(jwt.TokenExpiredError);
    expect(result.error.message).toBe('Token expired');
  });

  it('Should return an error for malformed token', async () => {
    const malformedToken = 'malformed_token_example'; // Simulated malformed token

    // Mock jwt.verify to throw a malformed token error
    jwtVerifySpy.mockImplementationOnce(() => {
      throw new jwt.JsonWebTokenError('Malformed token');
    });

    const result = await verifyAccessToken(malformedToken);

    expect(jwtVerifySpy).toHaveBeenCalledWith(
      malformedToken,
      expect.any(String)
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toBeInstanceOf(jwt.JsonWebTokenError);
    expect(result.error.message).toBe('Malformed token');
  });

  it('Should return decoded data even if user is not found in DB (verifyAccessToken)', async () => {
    const validToken = 'valid_token_example';
    jwtVerifySpy.mockReturnValueOnce({
      userId: mockUser.userId,
      authority: mockUser.authority,
    });
    const result = await verifyAccessToken(validToken);
    expect(jwtVerifySpy).toHaveBeenCalledWith(validToken, expect.any(String));
    expect(result).toEqual({
      decoded: { userId: mockUser.userId, authority: mockUser.authority },
    });
  });
});

describe('refreshAccessToken', () => {
  let jwtSignSpy;
  let userFindOneSpy;
  let jwtVerifySpy;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    jwtVerifySpy = vi.spyOn(jwt, 'verify');
    jwtSignSpy = vi.spyOn(jwt, 'sign'); // Spy on jwt.sign to mock its behavior
    userFindOneSpy = vi.spyOn(models.User, 'findByPk');
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore mocks after each test
  });

  it('should return new access token when refresh token is valid', async () => {
    const mockRefreshToken = 'validRefreshToken';
    const mockDecoded = { user_id: 1 };
    const mockNewAccessToken = 'newAccessToken';

    jwtVerifySpy.mockReturnValue(mockDecoded);
    userFindOneSpy.mockResolvedValue(mockUser);
    jwtSignSpy.mockReturnValue(mockNewAccessToken);

    const result = await refreshAccessToken(mockRefreshToken);

    expect(result).toEqual({
      newAccessToken: mockNewAccessToken,
      user: mockUser,
    });
    // expect mockRefreshToken and REFRESH_JWT_SECRET
    expect(jwt.verify).toHaveBeenCalledWith(
      mockRefreshToken,
      expect.any(String)
    );
    expect(models.User.findByPk).toHaveBeenCalledWith(mockDecoded.user_id);
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        user_id: mockUser.id,
        username: mockUser.username,
        authority: mockUser.authority,
      },
      expect.any(String), // process.env.JWT_SECRET
      { expiresIn: '1h' }
    );
  });

  it('should return an error if refresh token is invalid', async () => {
    const invalidRefreshToken = 'invalidRefreshToken';
    jwtVerifySpy.mockImplementationOnce(() => {
      throw new Error('Invalid refresh token');
    });

    const result = await refreshAccessToken(invalidRefreshToken);

    expect(result).toEqual({ error: 'Invalid refresh token' });
    expect(jwtVerifySpy).toHaveBeenCalledWith(
      invalidRefreshToken,
      expect.any(String)
    );
    expect(userFindOneSpy).not.toHaveBeenCalled();
    expect(jwtSignSpy).not.toHaveBeenCalled();
  });

  it('should return an error if user is not found with the refresh token', async () => {
    const mockRefreshToken = 'validRefreshToken';
    const mockDecoded = { user_id: 999 }; // A non-existent userId
    jwtVerifySpy.mockReturnValue(mockDecoded);
    userFindOneSpy.mockResolvedValue(null);

    const result = await refreshAccessToken(mockRefreshToken);

    expect(result).toEqual({ error: 'Invalid user in refresh token' });
    expect(jwtVerifySpy).toHaveBeenCalledWith(
      mockRefreshToken,
      expect.any(String)
    );
    expect(userFindOneSpy).toHaveBeenCalledWith(999);
    expect(jwtSignSpy).not.toHaveBeenCalled();
  });
});
