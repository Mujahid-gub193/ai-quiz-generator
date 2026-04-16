import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const LessonProgress = sequelize.define("LessonProgress", {
  completed: { type: DataTypes.BOOLEAN, defaultValue: true },
});

export default LessonProgress;
