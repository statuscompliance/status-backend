import { models } from '../models/models.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { getNodeRedToken } from '../utils/nodeRedToken.js';

const token_expiration = parseInt(process.env.JWT_EXPIRATION) || 3600;
const refreshToken_expiration =
  parseInt(process.env.JWT_REFRESH_EXPIRATION) || 3600 * 24 * 7;

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
  } catch (error) {
    console.error('Error in signUp:', error);
    res.status(500).json({
      message: 'Failed to create user, error',
    });
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
      if (user.authority === 'DEVELOPER') {
        nodeRedToken = await getNodeRedToken(username, password);
      }

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        maxAge: token_expiration * 1000,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: refreshToken_expiration * 1000,
      });
      if (nodeRedToken !== '') {
        res.cookie('nodeRedToken', nodeRedToken, {
          httpOnly: true,
          path: '/',
          maxAge: refreshToken_expiration * 1000,
        });
      }

      res.status(200).json({
        username: user.username,
        email: user.email,
        authority: user.authority,
        accessToken: accessToken,
        refreshToken: refreshToken,
        nodeRedToken: nodeRedToken,
      });
    }
  } catch (error) {
    console.error('Error in signIn:', error);
    res.status(500).json({ message: 'Internal server error' });
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

    return res.status(204).json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error in signOut:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
}

export async function getUsers(req, res) {
  // THIS IS A TEST FUNCTION
  try {
    const users = await models.User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getAuthority(req, res) {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const { decoded, error } = await verifyAccessToken(accessToken);
  if (error) {
    console.error('Error in getAuthority:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }

  return res.status(200).json({ authority: decoded.authority });
}

export async function deleteUserById(req, res) {
  const { id } = req.params;
  try {
    const user = await models.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.destroy();
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUserById:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
