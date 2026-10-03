import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { photoUrl } = body;

    let updatedUser = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id: session.userId },
        data: { photoUrl },
        select: { id: true, photoUrl: true, username: true },
      });
    } catch {
      // If user not found by ID (e.g. session using USN / username), update by username or student USN
      if (session.usn) {
        const student = await prisma.student.findUnique({
          where: { usn: session.usn },
          select: { userId: true },
        });
        if (student?.userId) {
          updatedUser = await prisma.user.update({
            where: { id: student.userId },
            data: { photoUrl },
            select: { id: true, photoUrl: true, username: true },
          });
        }
      }
      if (!updatedUser && session.username) {
        updatedUser = await prisma.user.update({
          where: { username: session.username },
          data: { photoUrl },
          select: { id: true, photoUrl: true, username: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      photoUrl: updatedUser?.photoUrl || photoUrl,
    });
  } catch (error: unknown) {
    console.error("Profile photo upload failed:", error);
    const message = error instanceof Error ? error.message : "Failed to update profile photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    try {
      await prisma.user.update({
        where: { id: session.userId },
        data: { photoUrl: null },
      });
    } catch {
      if (session.usn) {
        const student = await prisma.student.findUnique({
          where: { usn: session.usn },
          select: { userId: true },
        });
        if (student?.userId) {
          await prisma.user.update({
            where: { id: student.userId },
            data: { photoUrl: null },
          });
        }
      }
    }

    return NextResponse.json({ success: true, photoUrl: null });
  } catch (error: unknown) {
    console.error("Profile photo removal failed:", error);
    return NextResponse.json({ error: "Failed to remove profile photo" }, { status: 500 });
  }
}
