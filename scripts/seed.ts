import "dotenv/config";
import { runDatabaseSeed } from "../lib/seed-service";
import prisma from "../lib/prisma";

async function main() {
  console.log("Seeding Supabase database...");
  try {
    const res = await runDatabaseSeed();
    console.log("Database seeded successfully:", res);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
