const { DataTypes } = require("sequelize")
const sequelize = require("../config/db")
const Device = require("./device")

const DeviceLog = sequelize.define(
  "DeviceLog",
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
    device_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Device,
        key: "id",
      },
    },
  },
  {
    tableName: "device_logs",
    timestamps: true,
  },
)

// Definisikan relasi
Device.hasMany(DeviceLog, {
  foreignKey: "device_id",
  as: "logs",
})
DeviceLog.belongsTo(Device, {
  foreignKey: "device_id",
  as: "device",
})

module.exports = DeviceLog
