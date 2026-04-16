import app from "./app.js";
import sequelize from "./config/db.js";
import { env } from "./config/env.js";
import "./models/index.js";

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    await sequelize.sync({ alter: process.env.NODE_ENV !== "production" });
    console.log("Database models synchronized.");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
