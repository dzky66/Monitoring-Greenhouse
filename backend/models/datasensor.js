const { DataTypes } = require("sequelize")
const sequelize = require("../config/db")

const DataSensor = sequelize.define(
  "DataSensor",
  {
    suhu: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -10,
        max: 60,
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
    waktu: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "data_sensors",
    timestamps: true,
  },
)

module.exports = DataSensor
