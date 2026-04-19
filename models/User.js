import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "teacher", "student"),
      allowNull: false,
      defaultValue: "student",
    },
    teacherRequest: {
      type: DataTypes.ENUM("none", "pending", "rejected"),
      allowNull: false,
      defaultValue: "none",
    },
  },
  {
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
  },
);

export default User;
