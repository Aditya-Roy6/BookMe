const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingItem = sequelize.define('BookingItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  seatId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  underscored: true,
  timestamps: true,
});

module.exports = BookingItem;
