import { verifyAccessToken } from '../utils/tokenUtils';

export async function verifyAdmin(req, res, next) {
  // Verify token
  const { decoded, error } = await verifyAccessToken(req.headers['x-access-token']);
  
  // If the token is not found, reply with a 401 error.
  if (!req.headers['x-access-token']) {
    return res.status(401).json({ message: 'No token provided' });
  }
  // If error in the validation of the token.
  if (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
  // If token not have a valid authority,
  if (!decoded || decoded.authority !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}