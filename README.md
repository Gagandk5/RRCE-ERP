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
   - `/principal`: Executive institutional oversight, fee collection analytics, department KPIs, 24-hour lockout override, and live audit logs.
   - `/admissions`: Student intake, USN roll-call sequencing, and **Atomic Branch Reallocation**.
   - `/hod`: Department roster (ordered strictly by `usnSequence ASC`), faculty allocation, and **1-Click 24-Hour Attendance Lockout Override**.
   - `/faculty`: Weekly schedule with **3-Layer Clash Engine** and digital roll-call marker (ordered by `usnSequence ASC`).
   - `/student`: Digital VTU/RRCE USN Smart ID Card, attendance gauge with VTU 75% minimum threshold warning, and tuition fee receipt simulator.

2. **USN Roll-Call Invariant**:
   - Format: `1RR25BC001` - `1RR25BC057` (`[CollegeCode][Year][Branch][Sequence 3 digits]`).
   - All student queries and roster views are strictly sorted by `usnSequence ASC`.

3. **Default Password Formula**:
   - Formula: `[NAME_FIRST_3_UPPERCASE][DD][MM][YY]`
   - Example: *Amith T*, born *08/07/2007* -> `AMI080707`.
   - **Forced Reset**: Mandatory first-login password reset (`isPasswordResetRequired: true`).

4. **24-Hour Attendance Lockout**:
   - Attendance sessions freeze exactly 24 hours after creation.
   - Any editing attempt after 24 hours is rejected unless unlocked via **HOD or Principal Override**, which is permanently recorded in the audit trail.

5. **3-Layer Clash Engine**:
   - Validates schedule additions against 3 simultaneous conflict layers:
     1. **Faculty Clash**: A faculty member cannot teach two classes at the same time.
     2. **Room Clash**: The same classroom/lab cannot host two classes at the same time.
     3. **Batch Clash**: The same batch (`department + semester + section`) cannot have two classes simultaneously.

6. **Atomic Branch Reallocation**:
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
| `JWT_SECRET` | Secret key for signing session tokens | `rrce_super_secret_jwt_key_2025` |

### Web-Triggerable Database Seeding
After deploying to Vercel, populate the database with all 7 departments, 4 staff accounts, and 54 real BCA students by visiting:
```
https://<your-vercel-domain>.vercel.app/api/seed
```
Or click the **"Seed DB"** button in the navigation bar!

---

## 🧪 Demo User Accounts

| Role | Username / Identifier | Password | Description |
| :--- | :--- | :--- | :--- |
| **Principal** | `principal` | `RAM010170` | Dr. Ramesh Kumar (Principal RRCE) |
| **Admissions** | `admissions` | `SUR150575` | Suresh Reddy (Admissions Officer) |
| **HOD BCA** | `hod_bca` | `PRA200880` | Dr. Praveen Gowda (HOD BCA) |
| **Faculty Math**| `faculty_math` | `SUN121085` | Prof. Sunitha Sharma (Mathematics) |
| **Student** | `1rr25bc001` | `AMI080707` | Amith T (BCA 2025 Batch, Roll #1) |

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
