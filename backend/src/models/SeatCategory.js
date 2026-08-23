const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeatCategory = sequelize.define('SeatCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  venueId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#007AFF',
  },
  rowStart: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rowEnd: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  underscored: true,
  timestamps: true,
});

module.exports = SeatCategory;
