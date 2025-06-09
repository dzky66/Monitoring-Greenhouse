const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD, // pastikan di .env pakai DB_PASSWORD
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // tambahkan port jika ada di env
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false, // opsional, supaya log query sequelize tidak terlalu ramai
  }
);

module.exports = sequelize;
