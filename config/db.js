import { Sequelize } from "sequelize";
import { env } from "./env.js";

const sequelize = env.supabaseDbUrl
  ? new Sequelize(env.supabaseDbUrl, {
      dialect: "postgres",
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
        clientMinMessages: "notice",
      },
      hooks: {
        beforeConnect: async (config) => {
          config.family = 4;
        },
      },
      logging: false,
    })
  : new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
      host: env.dbHost,
      port: env.dbPort,
      dialect: "postgres",
      logging: false,
    });

export default sequelize;
