import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  const searchParams = req.nextUrl.searchParams;
  const studentId = searchParams.get("studentId");
  const status = searchParams.get("status") as any;

  try {
    let invoices: any[] = [];
    try {
      invoices = await prisma.invoice.findMany({
        where: {
          studentId: studentId || (sessionUser?.role === "STUDENT" ? sessionUser.studentId : undefined),
          status: status || undefined,
        },
        include: {
          student: {
            select: {
              usn: true,
              usnSequence: true,
              quota: true,
              user: { select: { firstName: true, lastName: true, email: true } },
              department: { select: { code: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbErr) {
      console.warn("Invoices DB query failed, returning fallback:", dbErr);
    }

    return NextResponse.json({ invoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { invoiceId, amount, paymentMethod } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "invoiceId and payment amount are required." },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { student: { include: { user: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const paymentNum = Number(amount);
    const newPaidAmount = invoice.paidAmount + paymentNum;
    const newStatus = newPaidAmount >= invoice.totalAmount ? "PAID" : "PENDING";

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "FEE_PAYMENT_COLLECTED",
        performedBy: sessionUser.username,
        details: JSON.stringify({
          invoiceId,
          studentUsn: invoice.student.usn,
          studentName: `${invoice.student.user.firstName} ${invoice.student.user.lastName}`,
          amountPaid: paymentNum,
          newBalance: Math.max(0, invoice.totalAmount - newPaidAmount),
          paymentMethod: paymentMethod || "ONLINE_GATEWAY",
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${paymentNum.toLocaleString("en-IN")} recorded successfully!`,
      invoice: updatedInvoice,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payment processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
