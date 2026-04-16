import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const QuizAttempt = sequelize.define("QuizAttempt", {
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  feedback: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

export default QuizAttempt;
