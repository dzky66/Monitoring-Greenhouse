const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.NODE_ENV === 'production' && process.env.MYSQL_URL) {
  // Railway MySQL connection
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  });
} else {
  // Local development
  sequelize = new Sequelize(
    process.env.DB_NAME || 'db_monitoring_tanaman',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: console.log,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;