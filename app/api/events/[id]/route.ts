import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, date, amount } = body as {
      name: string;
      type: string;
      date: string;
      amount: number;
    };

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { name, type: type as "meeting" | "work", date, amount },
    });

    if (amount !== existing.amount) {
      await prisma.eventAttendance.updateMany({
        where: { eventId: id, fineGenerated: true, finePaid: false },
        data: { fineAmount: amount },
      });
    }

    return NextResponse.json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      type: updatedEvent.type,
      date: updatedEvent.date,
      amount: updatedEvent.amount,
      createdAt: updatedEvent.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[PUT /api/events/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.event.delete({ where: { id } });

    return NextResponse.json(
      { message: "Evento eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/events/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
