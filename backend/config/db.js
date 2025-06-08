const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('db_monitoring_tanaman', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

module.exports = sequelize;
