import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { env } from "@/constants";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (env !== "production") globalForPrisma.prisma = prisma;

export default prisma;
