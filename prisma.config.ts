import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === "production" ? "file:/data/dev.db" : "file:./dev.db");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl || env("DATABASE_URL"),
  },
});
