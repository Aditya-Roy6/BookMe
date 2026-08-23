const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeatStatus = sequelize.define('SeatStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  showtimeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  seatId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'held', 'booked'),
    defaultValue: 'available',
    allowNull: false,
  },
  heldBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User ID who holds this seat',
  },
  holdExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['showtime_id', 'seat_id'],
    },
  ],
});

module.exports = SeatStatus;
