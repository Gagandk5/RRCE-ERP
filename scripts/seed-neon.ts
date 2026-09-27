import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { hashPassword } from "../lib/auth";
import { generateDefaultPassword, generateUSN } from "../lib/utils";
import { DEPARTMENTS, STAFF_ACCOUNTS, BCA_2025_STUDENTS } from "../prisma/seed-data";

neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_HIjTUtQv2pP7@ep-round-salad-azr5gc8f-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export async function seedNeonDirectly() {
  console.log("Connecting directly to Neon PostgreSQL Database via Serverless Pool...");
  const pool = new Pool({ connectionString });

  try {
    const testRes = await pool.query("SELECT NOW()");
    console.log("Neon DB Connected successfully! Server Time:", testRes.rows[0].now);

    // 1. Ensure schema tables exist in Neon
    console.log("Ensuring database tables in Neon PostgreSQL...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Department" (
        "id" TEXT PRIMARY KEY,
        "code" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "usnCode" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "username" TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "phone" TEXT,
        "departmentId" TEXT REFERENCES "Department"("id") ON DELETE SET NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isPasswordResetRequired" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Student" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "usn" TEXT UNIQUE NOT NULL,
        "usnCollegeCode" TEXT NOT NULL DEFAULT '1RR',
        "usnYear" TEXT NOT NULL DEFAULT '25',
        "usnBranch" TEXT NOT NULL DEFAULT 'BC',
        "usnSequence" INT NOT NULL,
        "dateOfBirth" TIMESTAMP(3) NOT NULL,
        "currentSemester" INT NOT NULL DEFAULT 3,
        "quota" TEXT NOT NULL DEFAULT 'KCET',
        "departmentId" TEXT REFERENCES "Department"("id"),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Invoice" (
        "id" TEXT PRIMARY KEY,
        "invoiceNumber" TEXT UNIQUE NOT NULL,
        "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "dueDate" TIMESTAMP(3),
        "title" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "TimetableSlot" (
        "id" TEXT PRIMARY KEY,
        "dayOfWeek" TEXT NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "departmentId" TEXT NOT NULL REFERENCES "Department"("id"),
        "semester" INT NOT NULL,
        "section" TEXT NOT NULL DEFAULT 'A',
        "facultyId" TEXT NOT NULL REFERENCES "User"("id"),
        "roomNumber" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "AttendanceSession" (
        "id" TEXT PRIMARY KEY,
        "subject" TEXT NOT NULL,
        "facultyId" TEXT NOT NULL REFERENCES "User"("id"),
        "departmentId" TEXT NOT NULL REFERENCES "Department"("id"),
        "semester" INT NOT NULL,
        "section" TEXT NOT NULL DEFAULT 'A',
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lockedAt" TIMESTAMP(3),
        "isLockedOverride" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
        "id" TEXT PRIMARY KEY,
        "sessionId" TEXT NOT NULL REFERENCES "AttendanceSession"("id") ON DELETE CASCADE,
        "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
        "status" TEXT NOT NULL DEFAULT 'PRESENT',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("sessionId", "studentId")
      );

      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY,
        "action" TEXT NOT NULL,
        "performedBy" TEXT NOT NULL,
        "details" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Clear old student records
    console.log("Cleaning old student data from Neon DB...");
    await pool.query('DELETE FROM "AttendanceRecord"');
    await pool.query('DELETE FROM "AttendanceSession"');
    await pool.query('DELETE FROM "Invoice"');
    await pool.query('DELETE FROM "Student"');
    await pool.query('DELETE FROM "User" WHERE "role" = \'STUDENT\'');

    // 3. Insert Departments
    const deptIdMap = new Map<string, string>();
    for (const d of DEPARTMENTS) {
      const id = `dept-${d.code.toLowerCase()}`;
      const res = await pool.query(
        `INSERT INTO "Department" ("id", "code", "name", "usnCode", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "usnCode" = EXCLUDED."usnCode", "updatedAt" = NOW()
         RETURNING "id"`,
        [id, d.code, d.name, d.usnCode]
      );
      deptIdMap.set(d.code, res.rows[0].id);
    }

    // 4. Insert Staff Accounts
    const staffIdMap = new Map<string, string>();
    for (const s of STAFF_ACCOUNTS) {
      const id = `staff-${s.username}`;
      const passwordHash = await hashPassword(s.defaultPassword);
      const deptId = s.deptCode ? deptIdMap.get(s.deptCode) : null;

      const res = await pool.query(
        `INSERT INTO "User" ("id", "email", "username", "passwordHash", "role", "firstName", "lastName", "phone", "departmentId", "isActive", "isPasswordResetRequired", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, false, NOW())
         ON CONFLICT ("username") DO UPDATE SET
           "email" = EXCLUDED."email",
           "passwordHash" = EXCLUDED."passwordHash",
           "firstName" = EXCLUDED."firstName",
           "lastName" = EXCLUDED."lastName",
           "phone" = EXCLUDED."phone",
           "departmentId" = EXCLUDED."departmentId",
           "updatedAt" = NOW()
         RETURNING "id"`,
        [id, s.email, s.username, passwordHash, s.role, s.firstName, s.lastName, s.phone, deptId]
      );
      staffIdMap.set(s.username, res.rows[0].id);
    }

    // 5. Ingest 54 Real BCA 3rd Sem Students into Neon DB
    console.log(`Seeding ${BCA_2025_STUDENTS.length} real BCA 3rd Sem students into Neon DB...`);
    const bcaDeptId = deptIdMap.get("BCA")!;
    let insertedCount = 0;

    for (const st of BCA_2025_STUDENTS) {
      const usn = generateUSN("1RR", "25", "BC", st.sequence);
      const username = usn.toLowerCase();
      const email = `${username}@student.rrce.org`;
      const defaultPassword = generateDefaultPassword(st.firstName, st.dob);
      const passwordHash = await hashPassword(defaultPassword);

      const userId = `user-student-${st.sequence}`;
      const studentId = `student-${st.sequence}`;

      // Insert User
      await pool.query(
        `INSERT INTO "User" ("id", "email", "username", "passwordHash", "role", "firstName", "lastName", "phone", "departmentId", "isActive", "isPasswordResetRequired", "updatedAt")
         VALUES ($1, $2, $3, $4, 'STUDENT', $5, $6, $7, $8, true, false, NOW())`,
        [userId, email, username, passwordHash, st.firstName, st.lastName, st.phone, bcaDeptId]
      );

      // Insert Student Profile
      await pool.query(
        `INSERT INTO "Student" ("id", "userId", "usn", "usnCollegeCode", "usnYear", "usnBranch", "usnSequence", "dateOfBirth", "currentSemester", "quota", "departmentId", "updatedAt")
         VALUES ($1, $2, $3, '1RR', '25', 'BC', $4, $5, 3, $6, $7, NOW())`,
        [studentId, userId, usn, st.sequence, new Date(st.dob), st.quota, bcaDeptId]
      );

      // Insert Invoice
      const seqStr = String(st.sequence).padStart(3, "0");
      const invoiceNumber = `INV-2025-BC${seqStr}`;
      const isPaid = st.sequence % 3 === 0;
      const isPartial = st.sequence % 3 === 1;
      const paidAmount = isPaid ? 85000 : isPartial ? 50000 : 0;
      const status = isPaid ? "PAID" : isPartial ? "PENDING" : "OVERDUE";

      await pool.query(
        `INSERT INTO "Invoice" ("id", "invoiceNumber", "studentId", "totalAmount", "paidAmount", "status", "title", "updatedAt")
         VALUES ($1, $2, $3, 85000, $4, $5, 'Annual Tuition Fee 2025-26 (BCA 3rd Sem)', NOW())`,
        [`inv-${st.sequence}`, invoiceNumber, studentId, paidAmount, status]
      );

      insertedCount++;
    }

    // 6. Log Audit Record
    await pool.query(
      `INSERT INTO "AuditLog" ("id", "action", "performedBy", "details", "timestamp")
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        `audit-${Date.now()}`,
        "NEON_DB_REAL_STUDENTS_SEEDED",
        "DIRECT_NEON_SEEDER",
        JSON.stringify({
          studentsCount: insertedCount,
          semester: 3,
          academicYear: "2025-26",
          message: "All 54 real BCA 3rd sem students successfully inserted into Neon DB!",
        }),
      ]
    );

    console.log(`✅ SUCCESS! All ${insertedCount} real BCA 3rd Sem students successfully seeded directly into live Neon DB!`);
  } catch (err) {
    console.error("❌ Neon DB Direct Seeding Error:", err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedNeonDirectly()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
