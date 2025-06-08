const { DataTypes } = require("sequelize")
const sequelize = require("../config/db")
const DataSensor = require("./datasensor")

const Monitoring = sequelize.define(
  "Monitoring",
  {
    suhu: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -10,
        max: 60,
      },
    },
    kelembapan_udara: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    kelembapan_tanah: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    cahaya: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 2000,
      },
    },
    waktu: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rekomendasi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dataSensorId: {
      type: DataTypes.INTEGER,
      references: {
        model: DataSensor,
        key: "id",
      },
    },
  },
  {
    tableName: "monitorings",
    timestamps: true,
  },
)

// Definisikan relasi
DataSensor.hasMany(Monitoring, {
  foreignKey: "dataSensorId",
  as: "monitorings",
})
Monitoring.belongsTo(DataSensor, {
  foreignKey: "dataSensorId",
  as: "dataSensor",
})

module.exports = Monitoring
