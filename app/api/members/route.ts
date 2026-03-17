import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members.map(transformMember));
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const existing = await prisma.member.findFirst({ where: { cedula } });
    if (existing) {
      return NextResponse.json(
        { error: "La cédula ya está registrada." },
        { status: 409 }
      );
    }

    const member = await prisma.member.create({
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

    return NextResponse.json(transformMember(member), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
