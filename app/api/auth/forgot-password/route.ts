import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateDefaultPassword, generateUSN } from "@/lib/utils";
import { BCA_2025_STUDENTS } from "@/prisma/seed-data";

import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp, {
    limit: 6,
    windowMs: 60 * 1000,
    keyPrefix: "forgot-pwd",
  });

  if (!rateLimit.success) {
    logger.warn({ ip: clientIp }, "Rate limit exceeded on /api/auth/forgot-password");
    return rateLimitResponse(rateLimit.limit, rateLimit.resetMs);
  }

  try {
    const body = await req.json();
    const { usn } = body;

    if (!usn || typeof usn !== "string" || !usn.trim()) {
      return NextResponse.json(
        { error: "Please enter your USN, First Name, or Sequence Number (e.g. 1RR25BC001, Amith, or 1)." },
        { status: 400 }
      );
    }

    const cleanInput = usn.trim();
    const upperInput = cleanInput.toUpperCase();

    let studentName = "";
    let phone = "";
    let passwordFormula = "";
    let usnFormatted = upperInput;
    let dobFormatted = "";

    let dbStudent = null;
    try {
      dbStudent = await prisma.student.findFirst({
        where: {
          OR: [
            { usn: { equals: upperInput, mode: "insensitive" } },
            { user: { firstName: { equals: cleanInput, mode: "insensitive" } } },
            { user: { username: { equals: cleanInput, mode: "insensitive" } } },
          ],
        },
        include: {
          user: true,
        },
      });
    } catch (dbErr) {
      console.warn("DB lookup in forgot-password fallback mode:", dbErr);
    }

    if (dbStudent) {
      studentName = `${dbStudent.user.firstName} ${dbStudent.user.lastName}`.trim();
      phone = dbStudent.user.phone || "+91 8971115212";
      passwordFormula = generateDefaultPassword(dbStudent.user.firstName, dbStudent.dateOfBirth);
      usnFormatted = dbStudent.usn;
      dobFormatted = dbStudent.dateOfBirth instanceof Date
        ? dbStudent.dateOfBirth.toISOString().slice(0, 10)
        : String(dbStudent.dateOfBirth).slice(0, 10);
    } else {
      const match = BCA_2025_STUDENTS.find((s) => {
        const studentUsn = generateUSN("1RR", "25", "BC", s.sequence).toUpperCase();
        return (
          studentUsn === upperInput ||
          s.firstName.toUpperCase() === upperInput ||
          String(s.sequence) === cleanInput ||
          String(s.sequence).padStart(3, "0") === cleanInput.slice(-3)
        );
      });

      if (match) {
        studentName = `${match.firstName} ${match.lastName}`.trim();
        phone = match.phone;
        passwordFormula = generateDefaultPassword(match.firstName, match.dob);
        usnFormatted = generateUSN("1RR", "25", "BC", match.sequence);
        dobFormatted = match.dob;
      } else {
        return NextResponse.json(
          {
            error: `Student record "${cleanInput}" not found in RRCE Academic Registry. Please check your USN (e.g. 1RR25BC001 or Amith).`,
          },
          { status: 404 }
        );
      }
    }

    const serverSmsPayload = `RRCE ERP SMS ALERT: Dear ${studentName}, your login credentials for USN ${usnFormatted} are: Username: ${usnFormatted} | Password: ${passwordFormula}. Sent to ${phone}.`;
    console.log("[SERVER SMS GATEWAY DISPATCH]:", serverSmsPayload);

    try {
      await prisma.auditLog.create({
        data: {
          action: "SMS_CREDENTIALS_DISPATCH",
          performedBy: `SMS_GATEWAY_${usnFormatted}`,
          details: JSON.stringify({
            usn: usnFormatted,
            studentName,
            phone,
            status: "DISPATCHED",
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (logErr) {
      console.warn("Audit log creation for SMS dispatch skipped:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: `Credentials retrieved for ${studentName}!`,
      recipientPhone: phone,
      usn: usnFormatted,
      studentName,
      password: passwordFormula,
      formulaExplanation: `[NAME_3_UPPER][DD][MM][YY] based on Date of Birth (${dobFormatted})`,
    });
  } catch (error: unknown) {
    console.error("Forgot password SMS dispatch error:", error);
    const message = error instanceof Error ? error.message : "Failed to retrieve credentials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
