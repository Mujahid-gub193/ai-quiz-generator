import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Chapter = sequelize.define("Chapter", {
  title: { type: DataTypes.STRING, allowNull: false },
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

export default Chapter;
