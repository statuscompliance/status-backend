import jwt from 'jsonwebtoken';

export function verifyAuthority(req, res, next) {
  if (req.cookies === undefined) {
    return res.status(401).json({ message: 'No token provided' });
  } else {
    const accessToken = req.cookies['accessToken'];
    if (!accessToken) {
      return res.status(401).json({ message: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const authority = decoded.authority;
      if (
        authority === 'ADMIN' ||
                authority === 'USER' ||
                authority === 'DEVELOPER'
      ) {
        next();
      } else {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch (error) {
      return res.status(401).json({ message: `Unauthorized, ${error}` });
    }
  }
}
