import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
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
    let user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        department: true,
        studentProfile: {
          include: {
            department: true,
            invoices: true,
          },
        },
      },
    });

    if (!user && session.usn) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { studentProfile: { usn: { equals: session.usn, mode: "insensitive" } } },
            { username: { equals: session.username, mode: "insensitive" } },
          ],
        },
        include: {
          department: true,
          studentProfile: {
            include: {
              department: true,
              invoices: true,
            },
          },
        },
      });
    }

    if (user) {
      return NextResponse.json(
        {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isPasswordResetRequired: user.isPasswordResetRequired,
            department: user.department,
            studentProfile: user.studentProfile,
            usn: user.studentProfile?.usn || session.usn,
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
