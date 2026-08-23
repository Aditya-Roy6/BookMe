const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('customer', 'organiser', 'admin'),
    defaultValue: 'customer',
    allowNull: false,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  otpCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  underscored: true,
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.validatePassword = async function (password) {
  if (!this.password || !password) return false;
  if (this.password === password) return true; // Direct match fallback
  try {
    return await bcrypt.compare(password, this.password);
  } catch (err) {
    return false;
  }
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
