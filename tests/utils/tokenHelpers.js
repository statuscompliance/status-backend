import jwt from 'jsonwebtoken';
import { adminUser, sampleUser } from './sampleUserData.js';

/**
 * Creates a JWT token for a given user
 * @param {Object} user - User object containing _id, username, and authority
 * @param {string} [secret='test-secret-key'] - Secret key for JWT signing
 * @returns {string} JWT token
 */
export function createToken(user, secret = 'test-secret-key') {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      authority: user.authority,
    },
    secret
  );
}

/**
 * Creates a JWT token for the admin user
 * @param {string} [secret='test-secret-key'] - Secret key for JWT signing
 * @returns {string} Admin JWT token
 */
export function createAdminToken(secret = 'test-secret-key') {
  return createToken(adminUser, secret);
}

/**
 * Creates a JWT token for a regular user
 * @param {string} [secret='test-secret-key'] - Secret key for JWT signing
 * @returns {string} Regular user JWT token
 */
export function createRegularToken(secret = 'test-secret-key') {
  return createToken(sampleUser, secret);
}
