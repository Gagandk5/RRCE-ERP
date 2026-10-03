import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, resolveSessionUser } from "@/lib/auth";
import { BCA_2025_STUDENTS } from "@/prisma/seed-data";
import { generateUSN } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  try {
    const user = await resolveSessionUser(session);

    if (user) {
      const resolvedUser = user as any;
      return NextResponse.json(
        {
          authenticated: true,
          user: {
            id: resolvedUser.id,
            email: resolvedUser.email,
            username: resolvedUser.username,
            role: resolvedUser.role,
            firstName: resolvedUser.firstName,
            lastName: resolvedUser.lastName,
            phone: resolvedUser.phone,
            photoUrl: resolvedUser.photoUrl,
            isPasswordResetRequired: resolvedUser.isPasswordResetRequired,
            department: resolvedUser.department,
            studentProfile: resolvedUser.studentProfile,
            usn: resolvedUser.studentProfile?.usn || session.usn,
          },
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }
  } catch (error) {
    console.warn("DB fetch failed in /api/auth/me, returning session data:", error);
  }

  // Fallback: If DB is unreachable or student is in-memory, synthesize student profile from BCA_2025_STUDENTS
  if (session.role === "STUDENT" && session.usn) {
    const sMatch = BCA_2025_STUDENTS.find(
      (s) => generateUSN("1RR", "25", "BC", s.sequence).toLowerCase() === session.usn?.toLowerCase()
    );
    if (sMatch) {
      const syntheticProfile = {
        id: `synth-profile-${sMatch.sequence}`,
        userId: session.userId,
        usn: session.usn,
        usnCollegeCode: "1RR",
        usnYear: "25",
        usnBranch: "BC",
        usnSequence: sMatch.sequence,
        dateOfBirth: sMatch.dob,
        currentSemester: 3,
        section: "A",
        quota: sMatch.quota,
        department: {
          id: "dept-bca",
          code: "BCA",
          name: "Bachelor of Computer Applications",
          usnCode: "BC",
        },
        invoices: [
          {
            id: `inv-${sMatch.sequence}`,
            invoiceNumber: `INV-2025-BC${String(sMatch.sequence).padStart(3, "0")}`,
            totalAmount: 85000,
            paidAmount: sMatch.sequence % 3 === 0 ? 85000 : sMatch.sequence % 3 === 1 ? 50000 : 0,
            status: sMatch.sequence % 3 === 0 ? "PAID" : sMatch.sequence % 3 === 1 ? "PENDING" : "OVERDUE",
            title: "Annual Tuition Fee 2025-26 (BCA 3rd Sem)",
          },
        ],
      };

      return NextResponse.json(
        {
          authenticated: true,
          user: {
            ...session,
            studentProfile: syntheticProfile,
            usn: session.usn,
          },
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: session,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
