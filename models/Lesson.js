import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Lesson = sequelize.define("Lesson", {
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM("video", "text", "pdf"), defaultValue: "video" },
  content: { type: DataTypes.TEXT, allowNull: true },
  videoUrl: { type: DataTypes.STRING, allowNull: true },
  fileName: { type: DataTypes.STRING, allowNull: true },
  duration: { type: DataTypes.INTEGER, allowNull: true }, // seconds
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  freePreview: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export default Lesson;
