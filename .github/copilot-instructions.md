# Copilot Instructions for RRCE ERP

## Project Overview
- This is a Next.js 15 App Router application for the RRCE college ERP.
- Use TypeScript, React 19, Tailwind CSS, Prisma, and Next.js route handlers.
- Keep changes aligned with the role-based portals: principal, admissions, HOD, faculty, and student.

## Core Architecture
- Prefer App Router conventions in `app/` for routes and page layouts.
- Keep business logic in `lib/` when it is reusable and not UI-specific.
- Use Prisma models and `@prisma/client` for database access.
- Route handlers under `app/api/**/route.ts` should validate auth, enforce role rules, and return structured JSON responses.
- Keep UI logic simple and expressive; prefer Tailwind classes over custom CSS unless the change is truly global.

## Business Rules to Preserve
- Student USN ordering must remain strictly by `usnSequence ASC`.
- USN format is expected to follow the RRCE/VTU conventions and should not be altered casually.
- Attendance lockout is a strict 24-hour rule unless explicitly unlocked by an authorized HOD or principal override.
- The clash engine should continue validating faculty, room, and batch conflicts simultaneously.
- Branch reallocation is transactional and must preserve audit logging and invoice updates.
- Default login/password behavior should respect the generated password rule and forced password reset flow.

## Auth and Security
- Treat JWT session handling and cookies as security-sensitive.
- Do not bypass authorization checks or weaken role-based access.
- Preserve the current login and password reset patterns unless the task explicitly requires a change.
- When adding APIs, validate user identity and role before performing writes or sensitive reads.

## Data and Database Guidance
- Prefer Prisma queries over handwritten SQL.
- Keep schema and runtime logic consistent with the Prisma schema in `prisma/schema.prisma`.
- If a change affects the data model, consider the downstream impact on role pages, API routes, and seeded data.
- Do not add ad hoc fields without checking existing usage patterns.

## UI and UX Guidance
- Maintain the ERP’s institutional, dashboard-first design language.
- Prefer minimal, functional UI updates that align with existing portal structure.
- Use Lucide icons and utility classes consistently when adding components.
- Keep pages accessible, readable, and role-aware.

## Development Workflow
- Use the existing scripts from `package.json`.
- Typical validation commands:
  - `npm run build`
  - `npm run lint`
  - `npm run db:push` when schema changes require database sync
- Do not invent new package managers or setup steps; use the current project conventions.

## Implementation Standards
- Keep patches focused and specific.
- Prefer the smallest correct change over broad refactors.
- Preserve existing naming conventions and project structure.
- When touching API logic, check the related route and role access before editing.
- When updating business workflows, consider audit logging, validation, and user-visible state changes together.

## When in Doubt
- Follow the existing patterns already used in the same feature area.
- Prefer repo-local conventions over generic Next.js defaults.
- Keep the work production-safe, institutional, and consistent with the RRCE ERP domain model.
