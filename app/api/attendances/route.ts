import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function transformAttendance(attendance: {
  id: string;
  eventId: string;
  memberId: string;
  attended: boolean;
  fineGenerated: boolean;
  fineAmount: number;
  finePaid: boolean;
  finePaymentId: string | null;
  createdAt: Date;
}) {
  return {
    id: attendance.id,
    eventId: attendance.eventId,
    memberId: attendance.memberId,
    attended: attendance.attended,
    fineGenerated: attendance.fineGenerated,
    fineAmount: attendance.fineAmount,
    finePaid: attendance.finePaid,
    finePaymentId: attendance.finePaymentId ?? undefined,
    createdAt: attendance.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const attendances = await prisma.eventAttendance.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(attendances.map(transformAttendance));
  } catch (error) {
    console.error("[GET /api/attendances]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      memberIds,
      eventAmount,
    }: {
      eventId: string;
      memberIds: string[];
      eventAmount: number;
    } = body;

    const existing = await prisma.eventAttendance.findMany({
      where: { eventId },
      select: { memberId: true },
    });

    const existingMemberIds = new Set(
      existing.map((a: { memberId: string }) => a.memberId),
    );

    const newMemberIds = memberIds.filter((id) => !existingMemberIds.has(id));

    if (newMemberIds.length === 0) {
      return NextResponse.json({ created: 0 }, { status: 201 });
    }

    const result = await prisma.eventAttendance.createMany({
      data: newMemberIds.map((memberId) => ({
        eventId,
        memberId,
        attended: false,
        fineGenerated: eventAmount > 0,
        fineAmount: eventAmount,
        finePaid: false,
      })),
    });

    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/attendances]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
