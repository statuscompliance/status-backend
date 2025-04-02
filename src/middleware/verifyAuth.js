import * as tokenUtils from '../utils/tokenUtils.js';
import { getNodeRedToken } from '../../src/controllers/user.controller.js';

export async function verifyAuthority(req, res, next) {
  let accessToken = req.headers['x-access-token'] ?? '';
  if (req.cookies === undefined && accessToken === '') {
    return res.status(401).json({ message: 'No token provided' });
  } else {
    accessToken = req.cookies['accessToken'] ?? accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const { decoded, error } = await tokenUtils.verifyAccessToken(accessToken);
    if (error) {
      if (error.name === 'TokenExpiredError') {
        const refreshToken =
          req.cookies['refreshToken'] || req.headers['x-refresh-token'];
        if (!refreshToken) {
          return res
            .status(401)
            .json({ message: 'Refresh token not provided' });
        }

        const {
          newAccessToken,
          user,
          error: refreshError,
        } = await tokenUtils.refreshAccessToken(refreshToken);
        if (refreshError) {
          return res.status(401).json({ message: refreshError });
        }
        req.user = user;
        if (!req.user || !req.user.username || !req.user.password) {
          return res.status(400).json({ message: 'User credentials missing' });
        }
        const newNodeRedToken = await getNodeRedToken(
          req.user.username,
          req.user.password
        );

        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3600 * 1000,
          sameSite: 'none',
        });

        res.cookie('nodeRedToken', newNodeRedToken, {
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3600 * 1000 * 24 * 7,
          sameSite: 'none',
        });

        return next();
      } else {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    const authority = decoded.authority;
    if (['ADMIN', 'USER', 'DEVELOPER'].includes(authority)) {
      return next();
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }
}
