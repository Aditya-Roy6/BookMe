const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  showtimeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('waiting', 'offered', 'claimed', 'expired', 'fulfilled'),
    defaultValue: 'waiting',
    allowNull: false,
  },
  offerToken: {
    type: DataTypes.UUID,
    allowNull: true,
    unique: true,
  },
  offerExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['customer_id', 'showtime_id', 'category_id'],
      where: { status: 'waiting' },
    },
  ],
});

module.exports = Waitlist;
