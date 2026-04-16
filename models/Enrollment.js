import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Enrollment = sequelize.define("Enrollment", {
  paidAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: "USD" },
  stripeSessionId: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM("active", "refunded"), defaultValue: "active" },
});

export default Enrollment;
