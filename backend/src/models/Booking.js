const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
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
  bookingRef: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  qrCodeUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Base64 QR code data URL',
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'cancelled'),
    defaultValue: 'confirmed',
    allowNull: false,
  },
}, {
  underscored: true,
  timestamps: true,
});

module.exports = Booking;
