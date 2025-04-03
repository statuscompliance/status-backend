import { DataTypes } from 'sequelize';

export default (sequelize) => sequelize.define('User', {
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
  },
  authority: {
    // TODO: Track https://github.com/oguimbal/pg-mem/issues/443 to remove this workaround
    type: import.meta.env?.VITEST ? DataTypes.STRING(50) : DataTypes.ENUM('ADMIN', 'DEVELOPER', 'USER'),
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
