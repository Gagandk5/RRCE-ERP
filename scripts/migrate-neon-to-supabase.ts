import { PrismaClient } from "@prisma/client";

const NEON_URL =
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_HIjTUtQv2pP7@ep-round-salad-azr5gc8f-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const SUPABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:uCgfSPHJaHYeA8fT@db.gnlhurzzowhyrqqnoxqn.supabase.co:5432/postgres";

const neon = new PrismaClient({
  datasources: { db: { url: NEON_URL } },
});

const supabase = new PrismaClient({
  datasources: { db: { url: SUPABASE_URL } },
});

async function migrateData() {
  console.log("=== STARTING FULL DATA MIGRATION FROM NEON TO SUPABASE ===");

  try {
    // 1. Fetch all records from Neon
    console.log("Fetching all data from Neon PostgreSQL...");

    const departments = await neon.department.findMany();
    const users = await neon.user.findMany();
    const students = await neon.student.findMany();
    const subjects = await neon.subject.findMany();
    const assignments = await neon.assignment.findMany();
    const submissions = await neon.submission.findMany();
    const sessions = await neon.attendanceSession.findMany();
    const sessionRecords = await neon.sessionAttendanceRecord.findMany();
    const dailyRecords = await neon.attendanceRecord.findMany();
    const invoices = await neon.invoice.findMany();
    const timetableSlots = await neon.timetableSlot.findMany();
    const auditLogs = await neon.auditLog.findMany();

    const usersWithPhotos = users.filter((u) => !!u.photoUrl);
    console.log(`Retrieved from Neon:`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Users: ${users.length} (${usersWithPhotos.length} have uploaded profile photos)`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Subjects: ${subjects.length}`);
    console.log(`- Assignments: ${assignments.length}`);
    console.log(`- Submissions: ${submissions.length}`);
    console.log(`- Attendance Sessions: ${sessions.length}`);
    console.log(`- Session Attendance Records: ${sessionRecords.length}`);
    console.log(`- Daily Attendance Records: ${dailyRecords.length}`);
    console.log(`- Invoices: ${invoices.length}`);
    console.log(`- Timetable Slots: ${timetableSlots.length}`);
    console.log(`- Audit Logs: ${auditLogs.length}`);

    for (const u of usersWithPhotos) {
      console.log(`  📸 Photo found for: ${u.username} (${u.firstName} ${u.lastName}), length: ${u.photoUrl?.length}`);
    }

    // 2. Clear current Supabase data cleanly in foreign-key dependency order
    console.log("\nPurging fresh seed data from Supabase before restoring live Neon records...");
    await supabase.auditLog.deleteMany({});
    await supabase.attendanceRecord.deleteMany({});
    await supabase.sessionAttendanceRecord.deleteMany({});
    await supabase.attendanceSession.deleteMany({});
    await supabase.submission.deleteMany({});
    await supabase.assignment.deleteMany({});
    await supabase.subject.deleteMany({});
    await supabase.timetableSlot.deleteMany({});
    await supabase.invoice.deleteMany({});
    await supabase.student.deleteMany({});
    await supabase.user.deleteMany({});
    await supabase.department.deleteMany({});
    console.log("Supabase tables cleared cleanly.");

    // 3. Insert into Supabase in dependency order
    console.log("\nWriting live institutional data to Supabase Mumbai...");

    if (departments.length > 0) {
      await supabase.department.createMany({ data: departments });
      console.log(`✓ Inserted ${departments.length} departments`);
    }

    if (users.length > 0) {
      await supabase.user.createMany({ data: users });
      console.log(`✓ Inserted ${users.length} users (including all ${usersWithPhotos.length} student profile photos)`);
    }

    if (students.length > 0) {
      await supabase.student.createMany({ data: students });
      console.log(`✓ Inserted ${students.length} students`);
    }

    if (subjects.length > 0) {
      await supabase.subject.createMany({ data: subjects });
      console.log(`✓ Inserted ${subjects.length} subjects`);
    }

    if (assignments.length > 0) {
      await supabase.assignment.createMany({ data: assignments });
      console.log(`✓ Inserted ${assignments.length} assignments`);
    }

    if (submissions.length > 0) {
      await supabase.submission.createMany({ data: submissions });
      console.log(`✓ Inserted ${submissions.length} submissions`);
    }

    if (sessions.length > 0) {
      await supabase.attendanceSession.createMany({ data: sessions });
      console.log(`✓ Inserted ${sessions.length} attendance sessions`);
    }

    if (sessionRecords.length > 0) {
      // Chunk sessionRecords to avoid postgres parameter limit if any
      const chunkSize = 50;
      for (let i = 0; i < sessionRecords.length; i += chunkSize) {
        await supabase.sessionAttendanceRecord.createMany({
          data: sessionRecords.slice(i, i + chunkSize),
        });
      }
      console.log(`✓ Inserted ${sessionRecords.length} session attendance records`);
    }

    if (dailyRecords.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < dailyRecords.length; i += chunkSize) {
        await supabase.attendanceRecord.createMany({
          data: dailyRecords.slice(i, i + chunkSize),
        });
      }
      console.log(`✓ Inserted ${dailyRecords.length} daily attendance records`);
    }

    if (invoices.length > 0) {
      await supabase.invoice.createMany({ data: invoices });
      console.log(`✓ Inserted ${invoices.length} invoices`);
    }

    if (timetableSlots.length > 0) {
      await supabase.timetableSlot.createMany({ data: timetableSlots });
      console.log(`✓ Inserted ${timetableSlots.length} timetable slots`);
    }

    if (auditLogs.length > 0) {
      await supabase.auditLog.createMany({ data: auditLogs });
      console.log(`✓ Inserted ${auditLogs.length} audit logs`);
    }

    // Verify verification in Supabase
    const verifiedPhotos = await supabase.user.findMany({
      where: { photoUrl: { not: null } },
      select: { username: true, firstName: true, lastName: true },
    });

    console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===");
    console.log(`Users with uploaded profile photos restored in Supabase (${verifiedPhotos.length}):`);
    for (const vp of verifiedPhotos) {
      console.log(`- ${vp.username} (${vp.firstName} ${vp.lastName})`);
    }
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await neon.$disconnect();
    await supabase.$disconnect();
  }
}

migrateData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
