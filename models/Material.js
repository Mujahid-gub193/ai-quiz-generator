import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Material = sequelize.define("Material", {
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
  type: {
    type: DataTypes.ENUM("note", "course"),
    allowNull: false,
    defaultValue: "note",
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fileType: {
    type: DataTypes.ENUM("pdf", "video", "link", "text"),
    allowNull: false,
    defaultValue: "text",
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cloudinaryId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Material;
