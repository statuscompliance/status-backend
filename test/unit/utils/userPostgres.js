import { DataTypes } from 'sequelize';

export const userPostgres = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "DEVELOPER" // Values: ADMIN, DEVELOPER,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true // Validate that the format is a valid email
    }
  },
  refresh_token: {
    type: DataTypes.TEXT, // It can be long, that's why we use TEXT
    allowNull: true,
    defaultValue: null
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}
