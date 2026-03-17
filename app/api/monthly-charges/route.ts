import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function transformCharge(charge: {
  id: string;
  memberId: string;
  month: string;
  amount: number;
  paid: boolean;
  paymentId: string | null;
  createdAt: Date;
}) {
  return {
    id: charge.id,
    memberId: charge.memberId,
    month: charge.month,
    amount: charge.amount,
    paid: charge.paid,
    paymentId: charge.paymentId ?? undefined,
    createdAt: charge.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const charges = await prisma.monthlyCharge.findMany({
      orderBy: [{ month: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(charges.map(transformCharge));
  } catch (error) {
    console.error("[GET /api/monthly-charges]", error);
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
      month,
      members,
      ratePerHectare,
    }: {
      month: string;
      members: Array<{ id: string; hectares: number }>;
      ratePerHectare: number;
    } = body;

    let generated = 0;

    for (const m of members) {
      await prisma.monthlyCharge.upsert({
        where: { memberId_month: { memberId: m.id, month } },
        create: {
          memberId: m.id,
          month,
          amount: m.hectares * ratePerHectare,
          paid: false,
        },
        update: {},
      });
      generated++;
    }

    return NextResponse.json({ generated }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/monthly-charges]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
