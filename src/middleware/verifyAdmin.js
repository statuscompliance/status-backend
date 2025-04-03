import { verifyAccessToken } from '../utils/tokenUtils';

export async function verifyAdmin(req, res, next) {
  // Extract access token from headers or cookies
  const accessToken = req.headers['x-access-token'] ?? req.cookies?.accessToken;

  // If no access token is provided in headers or cookies, return an error
  if (!accessToken) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Verify the access token
  const { decoded, error } = await verifyAccessToken(accessToken);

  // If token verification fails, return an error
  if (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  // Check if the user has admin authority
  if (!decoded || decoded.authority !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  req.user = decoded;
  next();
}
