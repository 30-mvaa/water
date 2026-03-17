import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "desc" },
    });

    const transformed = events.map((event: (typeof events)[number]) => ({
      id: event.id,
      name: event.name,
      type: event.type,
      date: event.date,
      amount: event.amount,
      createdAt: event.createdAt.toISOString(),
    }));

    return NextResponse.json(transformed);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, date, amount } = body;

    const event = await prisma.event.create({
      data: {
        name,
        type,
        date,
        amount,
      },
    });

    return NextResponse.json(
      {
        id: event.id,
        name: event.name,
        type: event.type,
        date: event.date,
        amount: event.amount,
        createdAt: event.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
