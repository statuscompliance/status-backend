import jwt from 'jsonwebtoken';
import { models } from '../models/models';

// Determine which secret to use; ignore import.meta.env branch for coverage
const VITEST_ENV = import.meta.env?.VITEST;

/* istanbul ignore next */
const ACCESS_SECRET = VITEST_ENV
  ? 'test-secret-key'
  : process.env.JWT_SECRET;

/* istanbul ignore next */
const REFRESH_SECRET = VITEST_ENV
  ? 'test-secret-key'
  : process.env.REFRESH_JWT_SECRET;

export async function verifyAccessToken(accessToken) {
  try {
    const decoded = jwt.verify(accessToken, ACCESS_SECRET);
    return { decoded };
  } catch (error) {
    return { error };
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await models.User.findByPk(decoded.user_id);
    if (!user) {
      return { error: 'Invalid user in refresh token' };
    }

    const newAccessToken = jwt.sign(
      { user_id: user.id, username: user.username, authority: user.authority },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { newAccessToken, user };
  } catch (error) {
    console.error('Invalid refresh token:', error);
    return { error: 'Invalid refresh token' };
  }
}
