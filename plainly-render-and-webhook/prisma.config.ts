import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // process.env (not env()) so `prisma generate` works without a DB, e.g. in CI
    url: process.env.DATABASE_URL,
  },
});
