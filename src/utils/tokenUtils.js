import jwt from 'jsonwebtoken';
import { models } from '../models/models';

const VITEST_ENV = import.meta.env?.VITEST;
export async function verifyAccessToken(accessToken) {
  try {
    const decoded = jwt.verify(accessToken, VITEST_ENV ? 'test-secret-key': process.env.JWT_SECRET);
    return { decoded };
  } catch (error) {
    console.error('Error in verifyAccessToken:', error);
    return { error };
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, VITEST_ENV ? 'test-secret-key': process.env.REFRESH_JWT_SECRET);
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
