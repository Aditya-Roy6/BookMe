const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seat = sequelize.define('Seat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  venueId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  row: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  col: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g. A1, A2, B1, B2',
  },
}, {
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['venue_id', 'row', 'col'],
    },
  ],
});

module.exports = Seat;
