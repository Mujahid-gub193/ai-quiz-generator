import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Course = sequelize.define("Course", {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  thumbnail: { type: DataTypes.STRING, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "USD" },
  isFree: { type: DataTypes.BOOLEAN, defaultValue: false },
  published: { type: DataTypes.BOOLEAN, defaultValue: false },
  level: { type: DataTypes.ENUM("beginner", "intermediate", "advanced"), defaultValue: "beginner" },
  category: { type: DataTypes.STRING, allowNull: true },
});

export default Course;
