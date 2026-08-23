const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Showtime = sequelize.define('Showtime', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  eventId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  venueId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Specific venue/theatre branch for this showtime',
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'ENGLISH',
  },
  format: {
    type: DataTypes.STRING,
    defaultValue: 'DOLBY ATMOS',
  },
  screen: {
    type: DataTypes.STRING,
    defaultValue: 'AUDI 1',
  },
  pricing: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Map of categoryId -> price, e.g. { "cat-uuid-1": 500, "cat-uuid-2": 300 }',
  },
}, {
  underscored: true,
  timestamps: true,
});

module.exports = Showtime;
