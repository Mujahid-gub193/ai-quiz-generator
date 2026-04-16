import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Quiz = sequelize.define("Quiz", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  sourceType: {
    type: DataTypes.ENUM("material", "text", "topic"),
    allowNull: false,
  },
  sourceText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  questionCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
});

export default Quiz;
