import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return NextResponse.json(
        { error: "Credenciales incorrectas o cuenta deshabilitada" },
        { status: 401 }
      );
    }

    const user = await prisma.authUser.findUnique({ where: { username } });

    if (!user || user.enabled === false) {
      return NextResponse.json(
        { error: "Credenciales incorrectas o cuenta deshabilitada" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciales incorrectas o cuenta deshabilitada" },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error("[POST /api/auth]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
