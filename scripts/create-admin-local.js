import bcrypt from "bcrypt";
import { Sequelize } from "sequelize";

const seq = new Sequelize("ai_quiz_db", "postgres", "406276", {
  host: "localhost",
  port: 5432,
  dialect: "postgres",
  logging: false,
});

await seq.authenticate();

// Add teacherRequest column if it doesn't exist yet
await seq.query(`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='Users' AND column_name='teacherRequest'
    ) THEN
      ALTER TABLE "Users" ADD COLUMN "teacherRequest" VARCHAR(10) NOT NULL DEFAULT 'none';
    END IF;
  END $$;
`);

const email = "mujahidulislam688@gmail.com";
const name = "Mujahidul Islam";
const password = "406276";

const [[existing]] = await seq.query(
  `SELECT id FROM "Users" WHERE email = :email`,
  { replacements: { email } }
);

if (existing) {
  await seq.query(
    `UPDATE "Users" SET role = 'admin', "teacherRequest" = 'none', "updatedAt" = NOW() WHERE email = :email`,
    { replacements: { email } }
  );
  console.log(`Existing user promoted to admin (id: ${existing.id})`);
} else {
  const hash = await bcrypt.hash(password, 10);
  const [[created]] = await seq.query(
    `INSERT INTO "Users" (name, email, password, role, "teacherRequest", "createdAt", "updatedAt")
     VALUES (:name, :email, :hash, 'admin', 'none', NOW(), NOW()) RETURNING id`,
    { replacements: { name, email, hash } }
  );
  console.log(`Admin created (id: ${created.id})`);
}

await seq.close();
process.exit(0);
