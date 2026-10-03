# RRCE ERP - Rajarajeswari College of Engineering

A production-grade College Enterprise Resource Planning (ERP) System for **Rajarajeswari College of Engineering (RRCE)**, Bengaluru (Autonomous institution under VTU Belagavi).

Built as a **Full-Stack Next.js 15 App Router** application with **React 19**, **PostgreSQL (via Prisma ORM)**, **Tailwind CSS**, and **Lucide Icons**, designed for **single-click deployment on Vercel**.

---

## 🏛️ System Architecture & Tech Stack

- **Framework**: Next.js 15 (App Router with Server & Client Components)
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Database & ORM**: PostgreSQL (Supabase, Neon, or Vercel Postgres) with Prisma ORM
- **Backend**: Next.js Route Handlers (`app/api/*/route.ts`) & Server Actions
- **Authentication**: JWT session tokens via secure HTTP-only cookies & Bcrypt password hashing
- **Deployment**: Single Vercel Deployment with zero extra server configuration

---

## ⚡ Core Business Invariants & Rules

1. **5 Role Portals**:
   - `/principal`: Executive institutional oversight, fee collection analytics, department KPIs, and live audit logs.
   - `/admissions`: Student intake, USN roll-call sequencing, and **Atomic Branch Reallocation**.
   - `/hod`: Department roster (ordered strictly by `usnSequence ASC`) and faculty allocation.
   - `/faculty`: Schedule overview, timetable with **3-Layer Clash Engine**, and the Roll-Call Attendance ledger.
   - `/student`: Digital VTU/RRCE USN Smart ID Card, attendance gauge with VTU 75% minimum threshold warning, and tuition fee receipt simulator.

2. **USN Roll-Call Invariant**:
   - Format: `1RR25BC001` - `1RR25BC057` (`[CollegeCode][Year][Branch][Sequence 3 digits]`).
   - All student queries and roster views are strictly sorted by `usnSequence ASC`.

3. **Default Password Formula**:
   - Formula: `[NAME_FIRST_3_UPPERCASE][DD][MM][YY]`
   - Example: *Amith T*, born *08/07/2007* -> `AMI080707`.
   - **Forced Reset**: Mandatory first-login password reset (`isPasswordResetRequired: true`).

4. **Attendance Date Rules**:
   - Faculty can create or update attendance for today or any previous valid date using the same Roll-Call Attendance ledger.
   - Future dates are rejected by both the date picker and the server.

5. **3-Layer Clash Engine**:
   - Validates schedule additions against 3 simultaneous conflict layers:
     1. **Faculty Clash**: A faculty member cannot teach two classes at the same time.
     2. **Room Clash**: The same classroom/lab cannot host two classes at the same time.
     3. **Batch Clash**: The same batch (`department + semester + section`) cannot have two classes simultaneously.

6. **Faculty Schedule Separation**:
   - Faculty Home shows only today's assigned classes and calendar status; Roll-Call Attendance remains a separate workflow.
   - Timetable & Planner contains the faculty's weekly schedule and the academic calendar.
   - The BCA 2026–27 timetable and co-teaching assignments use the existing `TimetableSlot`, `Subject`, and `FacultyCourseAssignment` tables.
   - Apply or refresh only this timetable without resetting existing ERP data with `npm run db:seed:bca-timetable`. It requires the BCA department and the listed faculty accounts to exist.
   - Calendar markers such as “1st Saturday” are not treated as holidays unless the calendar explicitly marks them non-working.

7. **Atomic Branch Reallocation**:
   - Re-allocates a student between departments in a single Prisma interactive `$transaction`:
     - Queries the destination branch's maximum sequence and assigns the next sequence number.
     - Generates the new USN (e.g. `1RR25BC001` -> `1RR25CS045`).
     - Adjusts the tuition fee invoice.
     - Writes a permanent structured log to `AuditLog`.

---

## 🚀 One-Click Vercel Deployment

Require only **2 Environment Variables** in Vercel:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Supabase, Neon, or Vercel Postgres) | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for signing session tokens | `<generate-a-long-random-secret>` |

### Web-Triggerable Database Seeding
After deploying to Vercel, populate the database with all 7 departments, 4 staff accounts, and 54 real BCA students by visiting:
```
https://<your-vercel-domain>.vercel.app/api/seed
```
Or click the **"Seed DB"** button in the navigation bar!

---

## 🧪 Official Staff & Demo Accounts

| Role | Email / Login Identifier | Initial Password | Description |
| :--- | :--- | :--- | :--- |
| **Principal** | `principal@rrce.org` | `rrce2025` | Dr. Ramesh Kumar (Principal RRCE) |
| **Admissions** | `admissions@rrce.org` | `rrce2025` | Suresh Reddy (Admissions Officer) |
| **HOD BCA** | `hod.bca@rrce.org` | `rrce2025` | Dr. Praveen Gowda (HOD BCA) |
| **Faculty BCA** | `jaishankar.m@rrce.org` | `rrce2025` | Prof. Jaishankar M (DPCO - B25BCA301) |
| **Faculty BCA** | `shreya.s@rrce.org` | `rrce2025` | Prof. Shreya S (OOP C++ - B25BCA302) |
| **Faculty BCA** | `pushpalatha.g@rrce.org` | `rrce2025` | Prof. Pushpalatha G (RDBMS - B25BCA304) |
| **Student** | `1rr25bc001` / `1rr25bc007` | `AMI080707` / `GAG141207` | Official BCA 2025 Batch Students |

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma schema to your PostgreSQL database
npm run db:push

# 3. Seed database with 54 BCA students & 7 depts
npm run db:seed

# 4. Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the ERP.
