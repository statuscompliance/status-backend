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
  twofa_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  twofa_secret: {
    type: DataTypes.TEXT, // can exceed 255 chars
  },
},{
  tableName: 'users',
  freezeTableName: true
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
 *         twofa_enabled:
 *           type: boolean
 *           description: Indicates whether Two-Factor Authentication (2FA) is enabled for the user.
 *           default: false
 *           example: true
 *         twofa_secret:
 *           type: string
 *           description: Base32 encoded secret key used for TOTP (Time-Based One-Time Password) generation.
 *           maxLength: 65535 # TEXT can be very long, using a practical max length
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
 *        twofa_enabled: true
 *        twofa_secret: "JBSWY3DPEHPK3PXP"
 */
