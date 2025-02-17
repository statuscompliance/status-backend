import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING(60),
    allowNull: false,
    validate: {
      isAlphanumeric: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  authority: {
    type: DataTypes.ENUM('ADMIN', 'DEVELOPER', 'USER'),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  refresh_token: {
    type: DataTypes.STRING(255),
  },
});

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
