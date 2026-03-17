import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        monthlyCharges: { select: { id: true } },
        fines: { select: { id: true } },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: payment.id,
      memberId: payment.memberId,
      memberName: payment.memberName,
      concept: payment.concept,
      description: payment.description,
      amount: payment.amount,
      date: payment.date,
      receiptNumber: payment.receiptNumber,
      createdAt: payment.createdAt.toISOString(),
      monthlyChargeIds: payment.monthlyCharges.map((c: { id: string }) => c.id),
      attendanceIds: payment.fines.map((f: { id: string }) => f.id),
    });
  } catch (error) {
    console.error("[GET /api/payments/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
