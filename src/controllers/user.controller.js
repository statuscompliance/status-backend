import { models } from '../models/models.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { getNodeRedToken } from '../utils/nodeRedToken.js';
import { handleControllerError } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

const token_expiration = parseInt(process.env.JWT_EXPIRATION) || 3600;
const refreshToken_expiration =
  parseInt(process.env.JWT_REFRESH_EXPIRATION) || 3600 * 24 * 30;

export async function signUp(req, res) {
  const { username, authority = 'USER', password, email } = req.body;

  const userEmail = await models.User.findOne({
    where: {
      email,
    },
  });

  if (userEmail) {
    return res.status(400).json({ message: 'Email already exists' });
  }
  const rows = await models.User.findAll({
    where: {
      username,
    },
  });

  if (rows.length > 0) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await models.User.create({
      username,
      password: hashedPassword,
      authority,
      email,
    });
    res.status(201).json({
      message: `User ${username} created successfully with authority ${authority}`,
    });
    
    logger.info(`User ${username} created with authority ${authority}`, {
      userId: 'system',
      action: 'user_create',
      email: email
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create user');
  }
}

export async function signIn(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }
  try {
    const user = await models.User.findOne({
      where: {
        username,
      },
    });

    if (!user || user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = user.password;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    } else {
      const accessToken = jwt.sign(
        {
          user_id: user.id,
          username: user.username,
          authority: user.authority,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const refreshToken = jwt.sign(
        {
          user_id: user.id,
          username: user.username,
          authority: user.authority,
        },
        process.env.REFRESH_JWT_SECRET,
        { expiresIn: '7d' }
      );

      await models.User.update(
        { refresh_token: refreshToken },
        { where: { username } }
      );
      
      let nodeRedToken = '';
      if (user.authority === 'DEVELOPER' || user.authority === 'ADMIN') {
        try {
          nodeRedToken = await getNodeRedToken(username, password);
        } catch (nodeRedError) {
          // Si el error es de autenticación (403), lo manejamos específicamente
          if (nodeRedError.statusCode === 403) {
            logger.warn(`Node-RED authentication failed for user: ${username}`, {
              userId: user.id,
              statusCode: 403
            });
            
            // No interrumpimos el flujo, simplemente no enviamos token de Node-RED
            res.cookie('accessToken', accessToken, {
              httpOnly: true,
              path: '/',
              maxAge: token_expiration * 1000,
              sameSite: 'none',
              secure: false,
            });
            res.cookie('refreshToken', refreshToken, {
              httpOnly: true,
              path: '/',
              maxAge: refreshToken_expiration * 1000,
              sameSite: 'none',
              secure: false,
            });
            
            return res.status(200).json({
              username: user.username,
              email: user.email,
              authority: user.authority,
              accessToken: accessToken,
              refreshToken: refreshToken,
              nodeRedAccess: false,
              message: 'Logged in successfully, but Node-RED access was denied. Check Node-RED credentials.'
            });
          }
          // Re-lanzamos cualquier otro tipo de error para que sea manejado por el catch externo
          throw nodeRedError;
        }
      }

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        maxAge: token_expiration * 1000,
        sameSite: 'none',
        secure: false,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: refreshToken_expiration * 1000,
        sameSite: 'none',
        secure: false,
      });
      if (nodeRedToken !== '') {
        res.cookie('nodeRedToken', nodeRedToken, {
          httpOnly: true,
          path: '/',
          maxAge: refreshToken_expiration * 1000,
          sameSite: 'none',
          secure: false,
        });
      }

      res.status(200).json({
        username: user.username,
        email: user.email,
        authority: user.authority,
        accessToken: accessToken,
        refreshToken: refreshToken,
        nodeRedToken: nodeRedToken,
        nodeRedAccess: nodeRedToken !== '',
      });
    }
  } catch (error) {
    // Check if the error has a specific status code
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || 'Internal server error';
    
    logger.error(`Error during sign in: ${errorMessage}`, {
      userId: req.body.username || 'unknown',
      statusCode,
      error
    });
    
    return res.status(statusCode).json({ 
      message: errorMessage,
      details: statusCode === 403 ? 'Node-RED authentication failed' : undefined
    });
  }
}

export async function signOut(req, res) {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      return res.status(400).json({ message: 'No refresh token provided' });
    }

    const refreshToken = cookies.refreshToken;
    const user = await models.User.findAll({
      where: { refresh_token: refreshToken },
    });

    if (user.length === 0) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      res.clearCookie('nodeRedToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      return res
        .status(404)
        .json({ message: 'No user found for provided refresh token' });
    }

    await models.User.update(
      { refresh_token: '' },
      {
        where: { refresh_token: refreshToken },
      }
    );

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.clearCookie('nodeRedToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.status(204).json({ message: 'Signed out successfully' });
  } catch (error) {
    return handleControllerError(res, error, 'Error during sign out process');
  }
}

export async function getUsers(req, res) {
  // THIS IS A TEST FUNCTION
  try {
    const users = await models.User.findAll();
    
    logger.debug('Retrieved all users', {
      count: users.length
    });
    
    res.status(200).json(users);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve users');
  }
}

export async function getAuthority(req, res) {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const { decoded, error } = await verifyAccessToken(accessToken);
  if (error) {
    logger.warn('Invalid token attempt', {
      error: error.message
    });
    return res.status(403).json({ message: 'Invalid token' });
  }

  logger.debug('Authority check successful', {
    userId: decoded.user_id,
    authority: decoded.authority
  });
  
  return res.status(200).json({ authority: decoded.authority });
}

export async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, async (err, decoded) => {
      if (err) {
        logger.warn('Token verification failed', {
          error: err.message,
          tokenType: 'refresh'
        });
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
      }
      
      const user = await models.User.findOne({
        where: {
          id: decoded.user_id,
          refresh_token: refreshToken
        }
      });

      if (!user) {
        logger.warn('Token claimed by non-existent user', {
          userId: decoded.user_id
        });
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      const accessToken = jwt.sign(
        {
          user_id: user.id,
          username: user.username,
          authority: user.authority
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        maxAge: token_expiration * 1000,
        sameSite: 'none',
        secure: false,
      });

      logger.info('Access token refreshed', {
        userId: user.id,
        username: user.username
      });

      return res.status(200).json({
        accessToken
      });
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to refresh access token');
  }
}

export async function deleteUserById(req, res) {
  const { id } = req.params;
  try {
    const user = await models.User.findByPk(id);
    if (!user) {
      logger.warn('Attempted to delete non-existent user', {
        userId: id
      });
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.destroy();
    
    logger.info('User deleted successfully', {
      userId: id,
      username: user.username
    });
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to delete user');
  }
}
