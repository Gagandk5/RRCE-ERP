import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

/**
 * Prisma Client configured with Soft Delete extension for Student and User models.
 * Automatically intercepts delete() and deleteMany() into soft-deletes (deletedAt: new Date()),
 * and filters out soft-deleted records from findMany() and findFirst() queries by default.
 */
export const prisma = basePrisma.$extends({
  query: {
    student: {
      async delete({ args }) {
        return (basePrisma.student as any).update({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
      async deleteMany({ args }) {
        return (basePrisma.student as any).updateMany({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
      async findMany({ args, query }) {
        if (!args.where) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
      async findFirst({ args, query }) {
        if (!args.where) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
    },
    user: {
      async delete({ args }) {
        return (basePrisma.user as any).update({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
      async deleteMany({ args }) {
        return (basePrisma.user as any).updateMany({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
      async findMany({ args, query }) {
        if (!args.where) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
      async findFirst({ args, query }) {
        if (!args.where) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

export default prisma;
