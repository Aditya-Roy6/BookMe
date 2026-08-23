const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venue = sequelize.define('Venue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  totalRows: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalCols: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  layoutType: {
    type: DataTypes.STRING,
    defaultValue: 'cinema',
    comment: 'cinema, cricket, football, tennis, basketball, f1, theatre, amphitheatre, esports, cabaret',
  },
  layoutData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Custom geometric parameters, sectors, and metadata for stadium rendering',
  },
}, {
  underscored: true,
  timestamps: true,
});

module.exports = Venue;
