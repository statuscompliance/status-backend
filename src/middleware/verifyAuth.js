import jwt from 'jsonwebtoken';
import models from '../models/models.js';
import nodered from '../config/nodered.js';

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

export function verifyAuthority(req, res, next) {
  let accessToken = req.headers['x-access-token'] ?? '';
  if (req.cookies === undefined && accessToken === '') {
    return res.status(401).json({ message: 'No token provided' });
  } else {
    accessToken = req.cookies['accessToken'] ?? accessToken;
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
      // If the error is because the token expired, try renewing it
      if (error.name === 'TokenExpiredError') {
        const refreshToken = req.cookies['refreshToken'] || req.headers['x-refresh-token'];
        
        if (!refreshToken) {
          return res.status(401).json({ message: 'Refresh token not provided' });
        }
        
        try {
          // Verify the refresh token
          const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
          
          // Find the user in the database
          models.User.findByPk(decoded.user_id)
            .then(async (user) => {
              if (!user) {
                return res.status(401).json({ message: 'Invalid user in refresh token' });
              }

              try {
                // Generate new access token
                const newAccessToken = jwt.sign(
                  { user_id: user.id, username: user.username, authority: user.authority },
                  process.env.JWT_SECRET,
                  { expiresIn: '1h' }
                );
                
                // Obtain new Node-RED token
                const newNodeRedToken = await getNodeRedToken();
                
                const token_expiration = parseInt(process.env.JWT_EXPIRATION) || 3600;
                const refreshToken_expiration = parseInt(process.env.JWT_REFRESH_EXPIRATION) || 3600 * 24 * 7;
                
                // Set new cookies
                res.cookie('accessToken', newAccessToken, {
                  httpOnly: true,
                  path: '/',
                  secure: process.env.NODE_ENV === 'production',
                  maxAge: token_expiration * 1000,
                  sameSite: 'none'
                });
                
                res.cookie('nodeRedToken', newNodeRedToken, {
                  httpOnly: true,
                  path: '/',
                  secure: process.env.NODE_ENV === 'production',
                  maxAge: refreshToken_expiration * 1000,
                  sameSite: 'none'
                });
                
                // Continue with the request
                req.user = { user_id: user.id, username: user.username, authority: user.authority };
                next();
              } catch (nodeRedError) {
                console.error('Error renewing Node-RED token:', nodeRedError);
                // Continue even if Node-RED token renewal fails
                next();
              }
            })
            .catch(err => {
              return res.status(500).json({ message: `Error fetching user: ${err.message}` });
            });
        } catch (refreshError) {
          return res.status(401).json({ message: `Invalid refresh token: ${refreshError.message}` });
        }
      } else {
        return res.status(401).json({ message: `Unauthorized, ${error}` });
      }
    }
  }
}
