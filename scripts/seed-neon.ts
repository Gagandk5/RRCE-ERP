import "dotenv/config";
import { runDatabaseSeed } from "../lib/seed-service";

export async function seedNeonDirectly() {
  console.log("Running Prisma-backed RRCE ERP seed for database environment...");
  return runDatabaseSeed();
}

if (require.main === module) {
  seedNeonDirectly()
    .then((result) => {
      console.log("Seed completed:", result);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
