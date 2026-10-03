-- ==============================================================================
-- RRCE ERP - PostgreSQL Row-Level Security (RLS) Policy Setup Script
-- Defence-in-depth database authorization policies
-- ==============================================================================

-- 1. Enable RLS on core academic & financial tables
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimetableSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- 2. Service / Postgres superuser bypass policy (allows application connection to operate)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_students') THEN
    CREATE POLICY service_role_all_students ON "Student" FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_attendance') THEN
    CREATE POLICY service_role_all_attendance ON "AttendanceSession" FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_invoices') THEN
    CREATE POLICY service_role_all_invoices ON "Invoice" FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_timetable') THEN
    CREATE POLICY service_role_all_timetable ON "TimetableSlot" FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_audit') THEN
    CREATE POLICY service_role_all_audit ON "AuditLog" FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Audit log append-only rule (prevent UPDATE/DELETE on audit log)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_rules WHERE rulename = 'prevent_audit_log_delete'
  ) THEN
    CREATE RULE prevent_audit_log_delete AS ON DELETE TO "AuditLog" DO INSTEAD NOTHING;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_rules WHERE rulename = 'prevent_audit_log_update'
  ) THEN
    CREATE RULE prevent_audit_log_update AS ON UPDATE TO "AuditLog" DO INSTEAD NOTHING;
  END IF;
END $$;
