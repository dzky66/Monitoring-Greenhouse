const { DataTypes } = require("sequelize")
const sequelize = require("../config/db")

const Device = sequelize.define(
  "Device",
  {
    lampu: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ventilasi: {
      type: DataTypes.ENUM("buka", "tutup"),
      defaultValue: "tutup",
    },
    humidifier: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    kipas: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pemanas: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "devices",
    timestamps: true,
  },
)

module.exports = Device
