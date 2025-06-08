const { DataTypes } = require("sequelize")
const sequelize = require("../config/db")
const DataSensor = require("./datasensor")

const Prediksi = sequelize.define(
  "Prediksi",
  {
    tanaman: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estimasi_panen: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Estimasi hasil panen dalam kg",
    },
    kualitas_prediksi: {
      type: DataTypes.ENUM("rendah", "sedang", "tinggi"),
      defaultValue: "sedang",
    },
    waktu_tanam: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estimasi_waktu_panen: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    skor_kesehatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
      comment: "Skor kesehatan tanaman (0-100)",
    },
    faktor_pendukung: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    faktor_penghambat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rekomendasi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data_historis: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Data historis sensor yang digunakan untuk prediksi",
    },
  },
  {
    tableName: "prediksi",
    timestamps: true,
  },
)

module.exports = Prediksi
