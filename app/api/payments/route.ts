import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type PaymentWithRelations = {
  id: string;
  memberId: string;
  memberName: string;
  concept: string;
  description: string;
  amount: number;
  date: string;
  receiptNumber: string;
  createdAt: Date;
  monthlyCharges: { id: string }[];
  fines: { id: string }[];
};

function transformPayment(payment: PaymentWithRelations) {
  return {
    id: payment.id,
    memberId: payment.memberId,
    memberName: payment.memberName,
    concept: payment.concept,
    description: payment.description,
    amount: payment.amount,
    date: payment.date,
    receiptNumber: payment.receiptNumber,
    createdAt: payment.createdAt.toISOString(),
    monthlyChargeIds: payment.monthlyCharges.map((c) => c.id),
    attendanceIds: payment.fines.map((f) => f.id),
  };
}

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        monthlyCharges: { select: { id: true } },
        fines: { select: { id: true } },
      },
    });

    return NextResponse.json(payments.map(transformPayment));
  } catch (error) {
    console.error("[GET /api/payments]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      memberId,
      memberName,
      concept,
      description,
      amount,
      date,
      monthlyChargeIds = [],
      attendanceIds = [],
    }: {
      memberId: string;
      memberName: string;
      concept: string;
      description: string;
      amount: number;
      date: string;
      monthlyChargeIds?: string[];
      attendanceIds?: string[];
    } = body;

    const count = await prisma.payment.count();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const seq = String(count + 1).padStart(4, "0");
    const receiptNumber = `REC-${year}${month}-${seq}`;

    const payment = await prisma.payment.create({
      data: {
        memberId,
        memberName,
        concept: concept as "monthly" | "event_fine" | "other",
        description,
        amount,
        date,
        receiptNumber,
      },
      include: {
        monthlyCharges: { select: { id: true } },
        fines: { select: { id: true } },
      },
    });

    if (monthlyChargeIds.length > 0) {
      await prisma.monthlyCharge.updateMany({
        where: { id: { in: monthlyChargeIds } },
        data: { paid: true, paymentId: payment.id },
      });
    }

    if (attendanceIds.length > 0) {
      await prisma.eventAttendance.updateMany({
        where: { id: { in: attendanceIds } },
        data: { finePaid: true, finePaymentId: payment.id },
      });
    }

    return NextResponse.json(transformPayment(payment), { status: 201 });
  } catch (error) {
    console.error("[POST /api/payments]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
