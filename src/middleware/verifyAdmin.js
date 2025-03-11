import jwt from 'jsonwebtoken';

export function verifyAdmin(req, res, next) {
  const accessToken = req.headers['x-access-token'] ?? req.cookies?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    // Authorize only ADMIN users
    if (decoded.authority !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: `Unauthorized: ${error.message}` });
  }
}
