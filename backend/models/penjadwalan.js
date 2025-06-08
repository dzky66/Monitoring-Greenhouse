const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Penjadwalan = sequelize.define('penjadwalan', {
  frekuensiPenyiraman: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  jamPenyiraman: {
    type: DataTypes.JSON, // Contoh: ["06:00", "18:00"]
    allowNull: false,
  }
}, {
  tableName: 'jadwal',
  timestamps: false
});

module.exports = Penjadwalan;
