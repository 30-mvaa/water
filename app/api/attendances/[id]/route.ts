import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { attended }: { attended: boolean } = body;

    const current = await prisma.eventAttendance.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json(
        { error: "Asistencia no encontrada" },
        { status: 404 }
      );
    }

    const originalFineAmount = current.fineAmount;

    const updated = await prisma.eventAttendance.update({
      where: { id },
      data: {
        attended,
        fineGenerated: !attended,
        fineAmount: attended ? 0 : originalFineAmount,
      },
    });

    return NextResponse.json({
      id: updated.id,
      eventId: updated.eventId,
      memberId: updated.memberId,
      attended: updated.attended,
      fineGenerated: updated.fineGenerated,
      fineAmount: updated.fineAmount,
      finePaid: updated.finePaid,
      finePaymentId: updated.finePaymentId ?? undefined,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[PATCH /api/attendances/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
