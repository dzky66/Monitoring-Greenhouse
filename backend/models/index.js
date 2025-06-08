const User = require("./user")
const UserProfile = require("./UserProfile")

// Definisi relasi
User.hasOne(UserProfile, {
  foreignKey: "userId",
  as: "userProfile",
  onDelete: "CASCADE",
})

UserProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
})

module.exports = {
  User,
  UserProfile,
}
