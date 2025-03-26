import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true, // To ensure that the username is unique
    validate: {
      isAlphanumeric: {
        msg: 'Username must be alphanumeric',
      },
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [8, 255],
        msg: 'Password must be between 8 and 255 characters long',
      },

    },
  },
  authority: {
    type: DataTypes.ENUM('ADMIN', 'DEVELOPER', 'USER'),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true, // To ensure that the email is unique
    validate: {
      isEmail: {
        msg: 'Must be a valid email address',
      },
    },
  },
  refresh_token: {
    type: DataTypes.STRING(255),
  },
});

// Customised method for comparing passwords
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Customised method to generate an access token (can be a JWT)
User.prototype.generateAccessToken = function () {
  return jwt.sign(
    { id: this.id, username: this.username },
    'mocked-jwt-token', // DELETE: process.env.JWT_SECRET is undefined 
    { expiresIn: '1h' });
};

export default User;
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     accessToken:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 */

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      properties:
 *         username:
 *           type: string
 *           description: The username of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *         authority:
 *           type: string
 *           description: The authority of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         refresh_token:
 *           type: string
 *           description: The refresh token of the user
 *      required:
 *        - username
 *        - password
 *        - authority
 *        - email
 *      example:
 *        username: user1
 *        password: password123
 *        authority: USER
 *        email:
 *        refresh_token:
 */
