import { models } from '../models/models.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { getNodeRedToken } from '../utils/nodeRedToken.js';
import { handleControllerError } from '../utils/errorHandler.js';
import logger from '../config/logger.js';
import { generate2FASecret, generateQRCode, verifyOTP } from '../utils/twofaGenerator.js';
import { encrypt, decrypt } from '../config/encryption.js';

const token_expiration = parseInt(process.env.JWT_EXPIRATION) || 3600;
const refreshToken_expiration =
  parseInt(process.env.JWT_REFRESH_EXPIRATION) || 3600 * 24 * 30;

// Helper function to set cookie options based on environment
export const getCookieOptions = (maxAge) => {
  if (process.env.NODE_ENV === 'development') {
    return {
      httpOnly: true,
      path: '/',
      maxAge: maxAge * 1000
    };
  } else if (process.env.NODE_ENV === 'production') {
    return {
      httpOnly: true,
      path: '/',
      maxAge: maxAge * 1000,
      sameSite: 'none',
      secure: true,
      partitioned: true
    };
  } else {
    // Default for test or other environments
    return {
      httpOnly: true,
      path: '/',
      maxAge: maxAge * 1000,
      sameSite: 'lax'
    };
  }
};

// Helper function to get cookie clear options
export const getClearCookieOptions = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      httpOnly: true,
      path: '/'
    };
  } else if (process.env.NODE_ENV === 'production') {
    return {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true
    };
  } else {
    return {
      httpOnly: true,
      path: '/',
      sameSite: 'lax'
    };
  }
};

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
    }
    // verify 2FA is enabled
    if (user.twofa_enabled) {
      const totpToken = req.body.totpToken; // from frontend
      if (!totpToken) {
        return res.status(202).json({
          requires2FA: true,
          message: 'Two-factor authentication required. Please provide your TOTP.',
          userId: user.id,
        });
      }
      const secret = decrypt(user.twofa_secret);
      const valid = verifyOTP(totpToken, secret);
      if (!valid) {
        return res.status(401).json({
          message: 'Invalid 2FA token. Please try again.',
          requires2FA: true });
      }
    }
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
        // If the error is authentication-related (403), handle it specifically
        if (nodeRedError.statusCode === 403) {
          logger.warn(`Node-RED authentication failed for user: ${username}`, {
            userId: user.id,
            statusCode: 403
          });
          // Do not interrupt the flow, simply do not send Node-RED token
          res.cookie('accessToken', accessToken, getCookieOptions(token_expiration));
          res.cookie('refreshToken', refreshToken, getCookieOptions(refreshToken_expiration));

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
        // Rethrow any other type of error to be handled by the outer catch
        throw nodeRedError;
      }
    }
    res.cookie('accessToken', accessToken, getCookieOptions(token_expiration));
    res.cookie('refreshToken', refreshToken, getCookieOptions(refreshToken_expiration));

    if (nodeRedToken !== '' && nodeRedToken !== null) {
      res.cookie('nodeRedToken', nodeRedToken, getCookieOptions(refreshToken_expiration));
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      authority: user.authority,
      accessToken: accessToken,
      refreshToken: refreshToken,
      nodeRedToken: nodeRedToken,
      nodeRedAccess: nodeRedToken !== '' && nodeRedToken !== null,
    });

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
    const user = await models.User.findOne({
      where: { refresh_token: refreshToken },
    });

    if (user.length === 0) {
      res.clearCookie('refreshToken', getClearCookieOptions());
      res.clearCookie('accessToken', getClearCookieOptions());
      res.clearCookie('nodeRedToken', getClearCookieOptions());
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

    res.clearCookie('refreshToken', getClearCookieOptions());
    res.clearCookie('accessToken', getClearCookieOptions());
    res.clearCookie('nodeRedToken', getClearCookieOptions());

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

      res.cookie('accessToken', accessToken, getCookieOptions(token_expiration));

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

export async function whoami(req, res) {

  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: No user in request' });
    }

    const dbUser = await models.User.findByPk(user.user_id, {
      attributes: ['id', 'username', 'email', 'authority', 'createdAt', 'updatedAt']
    });
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      authority: dbUser.authority,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch user info');
  }
}

export async function setup2FA(req, res) {
  try {
    const user = await models.User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { base32, otpauth_url } = generate2FASecret(user.email);
    const qrCode = await generateQRCode(otpauth_url);
    const encryptedSecret = encrypt(base32);

    await user.update({ twofa_secret: encryptedSecret });

    return res.status(200).json({ qrCode });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to setup 2FA');
  }
}

export async function verify2FA(req, res) {
  try {
    const { totpToken } = req.body;
    const user = await models.User.findByPk(req.user.user_id);
    if (!user || !user.twofa_secret) {
      return res.status(400).json({ message: '2FA not set up' });
    }
    const secret = decrypt(user.twofa_secret);
    const valid = verifyOTP(totpToken, secret);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid 2FA token' });
    }
    await user.update({ twofa_enabled: true });

    return res.status(200).json({ message: '2FA enabled successfully' });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to verify 2FA');
  }
}

export async function get2FAStatus(req, res) {
  try {
    const user = await models.User.findByPk(req.user.user_id, {
      attributes: ['twofa_enabled']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ twofa_enabled: user.twofa_enabled });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch 2FA status');
  }
}

export async function disable2FA(req, res) {
  try {
    const { password, totpToken } = req.body;

    if (!password || !totpToken) {
      return res.status(400).json({ message: 'Password and 2FA totpToken are required' });
    }

    const user = await models.User.findByPk(req.user.user_id);

    if (!user && !user.twofa_enabled && !user.twofa_secret) {
      return res.status(400).json({ message: '2FA is not enabled for this user' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const secret = decrypt(user.twofa_secret);

    const valid = verifyOTP(totpToken, secret);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid 2FA totpToken' });
    }

    await user.update({ twofa_enabled: false, twofa_secret: null });

    return res.status(200).json({ message: '2FA has been disabled successfully' });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to disable 2FA');
  }
}
