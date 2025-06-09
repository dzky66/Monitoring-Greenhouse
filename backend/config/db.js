// config/db.js
const { Sequelize } = require('sequelize');

// DEBUGGING - tambahkan ini untuk melihat environment variables
console.log('🔍 Railway MySQL Connection Debug:');
console.log('MYSQL_URL:', process.env.MYSQL_URL || 'Not found');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'Not found');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST || 'Not found');
console.log('MYSQL_USER:', process.env.MYSQL_USER || 'Not found');
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'Not found');

// Buat connection string dari individual variables jika MYSQL_URL tidak ada
const buildConnectionString = () => {
  if (process.env.MYSQL_HOST && process.env.MYSQL_USER) {
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'railway';
    const port = process.env.MYSQL_PORT || '3306';
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
  }
  return null;
};

// Prioritas: MYSQL_URL > DATABASE_URL > Manual build
const connectionString = process.env.MYSQL_URL || 
                         process.env.DATABASE_URL || 
                         buildConnectionString();

if (!connectionString) {
  console.error('❌ No MySQL connection string found in environment variables!');
  console.error('Please set MYSQL_URL or individual MySQL environment variables.');
  throw new Error('Database connection string not found');
}

console.log('✅ Using Railway MySQL connection');

// HANYA gunakan Railway MySQL connection, tanpa fallback ke local
const sequelize = new Sequelize(connectionString, {
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

module.exports = sequelize;