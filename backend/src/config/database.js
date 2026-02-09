require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

console.log('--- DEBUG: ENVIRONMENT CHECK ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL value starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
} else {
  console.error('CRITICAL: DATABASE_URL is undefined');
}
console.log('--- DEBUG END ---');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: isProduction ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
