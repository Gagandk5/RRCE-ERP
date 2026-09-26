import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
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

    if (user) {
      return NextResponse.json({
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
        },
      });
    }
  } catch (error) {
    console.warn("DB fetch failed in /api/auth/me, returning session data:", error);
  }

  // Return session data directly if DB fetch failed (or mock user)
  return NextResponse.json({
    authenticated: true,
    user: session,
  });
}
