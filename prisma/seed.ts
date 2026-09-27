import "dotenv/config";
import { runDatabaseSeed } from "../lib/seed-service";
import prisma from "../lib/prisma";

async function main() {
  try {
    const result = await runDatabaseSeed();
    console.log("Seeding summary:", result);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
