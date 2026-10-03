import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_CONFIG } from "@/lib/auth";
import { Role } from "@/lib/types";
import { STAFF_ACCOUNTS, BCA_2025_STUDENTS } from "@/prisma/seed-data";
import { generateDefaultPassword, generateUSN } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identifier (username/email/USN) and password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: "insensitive" } },
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          {
            studentProfile: {
              usn: { equals: cleanIdentifier, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        department: true,
        studentProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: `Invalid credentials for "${identifier}". Please verify your account details.` },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(cleanPassword, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "This account has been deactivated. Contact administration." },
        { status: 403 }
      );
    }

    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as Role,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId,
      departmentCode: user.department?.code || user.studentProfile?.department?.code,
      studentId: user.studentProfile?.id,
      usn: user.studentProfile?.usn,
      isPasswordResetRequired: false,
    };

    const token = signToken(payload);
    const redirectUrl = getPortalRedirect(user.role as Role);

    const response = NextResponse.json({
      success: true,
      user: payload,
      redirectUrl,
      dbConnected: true,
    });

    response.cookies.set(AUTH_COOKIE_CONFIG.name, token, AUTH_COOKIE_CONFIG.options);
    return response;
  } catch (error: unknown) {
    console.error("Login API error:", error);
    const message = error instanceof Error ? error.message : "Internal login error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getPortalRedirect(role: Role): string {
  switch (role) {
    case "PRINCIPAL":
      return "/principal";
    case "ADMISSIONS":
      return "/admissions";
    case "HOD":
      return "/hod";
    case "FACULTY":
      return "/faculty";
    case "STUDENT":
      return "/student";
    default:
      return "/";
  }
}
