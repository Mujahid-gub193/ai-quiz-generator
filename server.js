import app from "./app.js";
import sequelize from "./config/db.js";
import { env } from "./config/env.js";
import "./models/index.js";
import { User } from "./models/index.js";
import bcrypt from "bcrypt";

const seedAdmin = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME;
  if (!email || !password || !name) return;

  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.unscoped().findOne({ where: { email } });
  if (existing) {
    await existing.update({ role: "admin", password: hashed });
    console.log(`Admin synced: ${email}`);
    return;
  }

  await User.create({ name, email, password: hashed, role: "admin" });
  console.log(`Admin created: ${email}`);
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    await sequelize.sync({ alter: true });
    console.log("Database models synchronized.");

    await seedAdmin();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

startServer();
