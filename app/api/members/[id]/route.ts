import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function transformMember(member: {
  id: string;
  cedula: string;
  name: string;
  email: string;
  phone: string;
  hectares: number;
  location: string;
  description: string;
  createdAt: Date;
}) {
  return {
    id: member.id,
    cedula: member.cedula,
    name: member.name,
    email: member.email,
    phone: member.phone,
    land: {
      hectares: member.hectares,
      location: member.location,
      description: member.description,
    },
    createdAt: member.createdAt.toISOString().split("T")[0],
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      cedula,
      name,
      email,
      phone,
      land,
    }: {
      cedula: string;
      name: string;
      email: string;
      phone: string;
      land: { hectares: number; location: string; description: string };
    } = body;

    const existing = await prisma.member.findFirst({
      where: { cedula, NOT: { id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "La cédula ya está registrada." },
        { status: 409 }
      );
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        cedula,
        name,
        email,
        phone,
        hectares: land.hectares,
        location: land.location,
        description: land.description,
      },
    });

    return NextResponse.json(transformMember(updated));
  } catch (error) {
    console.error("[PUT /api/members/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.member.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/members/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
