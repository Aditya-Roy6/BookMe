require('dotenv').config();
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: process.env.NODE_ENV === 'production' ? false : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  const dbName =
    process.env.NODE_ENV === 'test'
      ? process.env.DB_TEST_NAME || 'luminatix_test'
      : process.env.DB_NAME || 'luminatix';

  const isSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

  sequelize = new Sequelize(
    dbName,
    process.env.DB_USER || 'luminatix',
    process.env.DB_PASSWORD || 'luminatix_dev',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      dialectOptions: isSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
      logging: process.env.NODE_ENV === 'production' ? false : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;

