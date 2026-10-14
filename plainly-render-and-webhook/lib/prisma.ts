import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { env } from "@/constants";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Skipped during `next build`, which imports this module without a database.
if (
  !process.env.DATABASE_URL &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (env !== "production") globalForPrisma.prisma = prisma;

export default prisma;
