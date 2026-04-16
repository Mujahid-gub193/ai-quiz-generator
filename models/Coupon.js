import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Coupon = sequelize.define("Coupon", {
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  discountPercent: { type: DataTypes.INTEGER, allowNull: false },
  maxUses: { type: DataTypes.INTEGER, allowNull: true }, // null = unlimited
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  courseId: { type: DataTypes.INTEGER, allowNull: true }, // null = global
});

export default Coupon;
