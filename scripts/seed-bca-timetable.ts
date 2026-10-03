import "dotenv/config";
import prisma from "../lib/prisma";
import { seedBcaTimetable } from "../lib/bca-timetable-seed";
import { BCA_FACULTY_ASSIGNMENTS } from "../prisma/seed-data";

async function main() {
  const department = await prisma.department.findUnique({
    where: { code: "BCA" },
    select: { id: true },
  });
  if (!department) {
    throw new Error("BCA department is missing. Create the department and faculty accounts first.");
  }

  const facultyEmails = Array.from(new Set(BCA_FACULTY_ASSIGNMENTS.map(({ email }) => email)));
  const faculty = await prisma.user.findMany({
    where: { email: { in: facultyEmails }, role: "FACULTY" },
    select: { id: true, email: true },
  });
  const facultyIdsByEmail = new Map(faculty.map(({ id, email }) => [email, id]));
  const missingFaculty = facultyEmails.filter((email) => !facultyIdsByEmail.has(email));
  if (missingFaculty.length) {
    throw new Error(`Create the assigned faculty accounts before seeding the timetable: ${missingFaculty.join(", ")}.`);
  }

  const result = await seedBcaTimetable(department.id, facultyIdsByEmail);
  console.log("BCA 2026–27 timetable seeded:", result);
}

main()
  .catch((error) => {
    console.error("BCA timetable seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
