/**
 * Creates the first admin account.
 * Usage: node scripts/seed-admin.js <name> <email> <password>
 * Example: node scripts/seed-admin.js "Admin" "admin@example.com" "secret123"
 */
import bcrypt from "bcrypt";
import sequelize from "../config/db.js";
import { User } from "../models/index.js";

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error("Usage: node scripts/seed-admin.js <name> <email> <password>");
  process.exit(1);
}

await sequelize.authenticate();
await sequelize.sync({ alter: true });

const existing = await User.unscoped().findOne({ where: { email: email.trim().toLowerCase() } });
if (existing) {
  console.error("A user with that email already exists.");
  process.exit(1);
}

const hashed = await bcrypt.hash(password, 10);
const admin = await User.create({
  name: name.trim(),
  email: email.trim().toLowerCase(),
  password: hashed,
  role: "admin",
});

console.log(`Admin created: ${admin.email} (id: ${admin.id})`);
process.exit(0);
