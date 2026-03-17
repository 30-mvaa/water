import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.authUser.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        enabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const transformed = users.map(
      (u: {
        id: string;
        username: string;
        name: string;
        role: string;
        enabled: boolean;
        createdAt: Date;
      }) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        enabled: u.enabled,
        createdAt: u.createdAt.toISOString(),
      }),
    );

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("[GET /api/access]", error);
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
      username,
      password,
      name,
      role,
      enabled,
    }: {
      username: string;
      password: string;
      name: string;
      role: string;
      enabled: boolean;
    } = body;

    const existing = await prisma.authUser.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está en uso." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.authUser.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role as "admin" | "user",
        enabled,
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        enabled: user.enabled,
        createdAt: user.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/access]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
