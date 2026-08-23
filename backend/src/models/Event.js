const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organiserId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  venueId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('movie', 'concert', 'theatre', 'festival', 'other'),
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  backdropUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  trailerUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rating: {
    type: DataTypes.STRING,
    defaultValue: 'UA 13+',
  },
  ageRating: {
    type: DataTypes.STRING,
    defaultValue: 'UA 13+ (Ages 13+)',
  },
  imdbRating: {
    type: DataTypes.STRING,
    defaultValue: '8.8',
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'English • Dolby Atmos 7.1',
  },
  duration: {
    type: DataTypes.STRING,
    defaultValue: '2h 25m',
  },
  genre: {
    type: DataTypes.STRING,
    defaultValue: 'Action • Adventure',
  },
  director: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  releaseDate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cast: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of { name, role, avatarUrl }',
  },
  reviews: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of TMDB reviews { author, content, rating, avatarUrl, createdAt }',
  },
  similarMovies: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of { id, title, posterUrl, voteAverage }',
  },
  tagline: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  budget: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  revenue: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  productionCompanies: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  showCast: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  showReviews: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  underscored: true,
  timestamps: true,
});

module.exports = Event;
