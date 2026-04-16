import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PasswordResetToken = sequelize.define("PasswordResetToken", {
  token: { type: DataTypes.STRING, allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export default PasswordResetToken;
