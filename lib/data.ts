import type {
  AuthUser,
  Member,
  Payment,
  CommunityEvent,
  MonthlyCharge,
  EventAttendance,
} from "./types";

export const AUTH_USERS: AuthUser[] = [
  {
    id: "auth-1",
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Administrador",
    enabled: true,
  },
  {
    id: "auth-2",
    username: "user1",
    password: "user123",
    role: "admin",
    name: "Juan Pérez",
    enabled: true,
  },
];

// The superadmin id — only this account can manage access accounts
export const SUPERADMIN_ID = "auth-1";

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "m1",
    cedula: "1234567890",
    name: "Carlos Mendoza",
    email: "carlos@ejemplo.com",
    phone: "555-0101",
    land: {
      hectares: 5,
      location: "Sector Norte, Lote 12",
      description: "Terreno con acceso a riego",
    },
    createdAt: "2024-01-15",
  },
  {
    id: "m2",
    cedula: "0987654321",
    name: "María García",
    email: "maria@ejemplo.com",
    phone: "555-0102",
    land: {
      hectares: 3,
      location: "Sector Sur, Lote 5",
      description: "Terreno plano",
    },
    createdAt: "2024-01-20",
  },
  {
    id: "m3",
    cedula: "1122334455",
    name: "Pedro López",
    email: "pedro@ejemplo.com",
    phone: "555-0103",
    land: {
      hectares: 8,
      location: "Sector Este, Lote 23",
      description: "Terreno con pendiente moderada",
    },
    createdAt: "2024-02-01",
  },
];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_EVENTS: CommunityEvent[] = [];

export const INITIAL_MONTHLY_CHARGES: MonthlyCharge[] = [];

export const INITIAL_EVENT_ATTENDANCES: EventAttendance[] = [];

// Rate per hectare
export const RATE_PER_HECTARE = 4;
