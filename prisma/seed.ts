import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // ── Auth Users ──────────────────────────────────────────────────────────────
  console.log("👤 Creando usuarios de acceso...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const user1Password = await bcrypt.hash("user123", 12);

  const admin = await prisma.authUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Administrador",
      role: "admin",
      enabled: true,
    },
  });

  const user1 = await prisma.authUser.upsert({
    where: { username: "user1" },
    update: {},
    create: {
      username: "user1",
      password: user1Password,
      name: "Juan Pérez",
      role: "admin",
      enabled: true,
    },
  });

  console.log(`  ✅ ${admin.username} (${admin.role})`);
  console.log(`  ✅ ${user1.username} (${user1.role})`);

  // ── Settings ────────────────────────────────────────────────────────────────
  console.log("⚙️  Configurando ajustes iniciales...");

  await prisma.setting.upsert({
    where: { key: "rate_per_hectare" },
    update: {},
    create: { key: "rate_per_hectare", value: "4" },
  });

  console.log("  ✅ Tarifa por hectárea: $4.00");

  // ── Members ─────────────────────────────────────────────────────────────────
  console.log("🌾 Creando miembros...");

  const members = [
    {
      cedula: "1234567890",
      name: "Carlos Mendoza",
      email: "carlos@ejemplo.com",
      phone: "555-0101",
      hectares: 5,
      location: "Sector Norte, Lote 12",
      description: "Terreno con acceso a riego",
    },
    {
      cedula: "0987654321",
      name: "María García",
      email: "maria@ejemplo.com",
      phone: "555-0102",
      hectares: 3,
      location: "Sector Sur, Lote 5",
      description: "Terreno plano",
    },
    {
      cedula: "1122334455",
      name: "Pedro López",
      email: "pedro@ejemplo.com",
      phone: "555-0103",
      hectares: 8,
      location: "Sector Este, Lote 23",
      description: "Terreno con pendiente moderada",
    },
  ];

  for (const m of members) {
    const member = await prisma.member.upsert({
      where: { cedula: m.cedula },
      update: {},
      create: {
        cedula: m.cedula,
        name: m.name,
        email: m.email,
        phone: m.phone,
        hectares: m.hectares,
        location: m.location,
        description: m.description,
      },
    });
    console.log(`  ✅ ${member.name} (${member.cedula}) — ${member.hectares} ha`);
  }

  console.log("\n✨ Seed completado exitosamente.");
  console.log("\n📋 Credenciales de acceso:");
  console.log("   Admin:  admin / admin123");
  console.log("   User:   user1 / user123");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
