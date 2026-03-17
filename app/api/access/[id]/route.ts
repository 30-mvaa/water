import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/access/[id] — Actualizar usuario de acceso
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      username,
      password,
      name,
      role,
      enabled,
    }: {
      username?: string;
      password?: string;
      name?: string;
      role?: string;
      enabled?: boolean;
    } = body;

    // Verificar unicidad de username excluyendo el propio id
    if (username !== undefined) {
      const existing = await prisma.authUser.findFirst({
        where: { username, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "El nombre de usuario ya está en uso." },
          { status: 409 }
        );
      }
    }

    // Construir objeto de actualización solo con los campos recibidos
    const data: Record<string, unknown> = {};
    if (username !== undefined) data.username = username;
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (enabled !== undefined) data.enabled = enabled;

    // Hashear password si viene y no está vacío
    if (password && password.trim() !== "") {
      data.password = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.authUser.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        enabled: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      name: updated.name,
      role: updated.role,
      enabled: updated.enabled,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[PUT /api/access/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PATCH /api/access/[id] — Toggle enabled (habilitar/deshabilitar)
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.authUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    const updated = await prisma.authUser.update({
      where: { id },
      data: { enabled: !user.enabled },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        enabled: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      name: updated.name,
      role: updated.role,
      enabled: updated.enabled,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[PATCH /api/access/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/access/[id] — Eliminar usuario de acceso
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.authUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    if (user.username === "admin") {
      return NextResponse.json(
        { error: "No se puede eliminar el usuario administrador." },
        { status: 403 }
      );
    }

    await prisma.authUser.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/access/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
