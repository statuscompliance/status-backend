import nodered from '../config/nodered.js';
import * as tokenUtils from '../utils/tokenUtils.js';

// Import the getNodeRedToken function from the user controller
async function getNodeRedToken() {
  try {
    const response = await nodered.post('/auth/token', {
      client_id: 'node-red-admin',
      grant_type: 'password',
      scope: '*',
      username: process.env.USER_STATUS,
      password: process.env.PASS_STATUS,
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error during get Node-RED token:', error);
    throw new Error('Failed to get Node-RED token');
  }
}

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

        const newNodeRedToken = await getNodeRedToken();

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

        req.user = user;
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
