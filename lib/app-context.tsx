"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  AuthUser,
  Member,
  Payment,
  CommunityEvent,
  MonthlyCharge,
  EventAttendance,
  MemberDebtSummary,
  PaymentConcept,
  Role,
} from "./types";
import { SUPERADMIN_ID } from "./data";

// ─── Context type ─────────────────────────────────────────────────────────────

interface AppContextType {
  currentUser: AuthUser | null;
  authUsers: AuthUser[];
  members: Member[];
  payments: Payment[];
  events: CommunityEvent[];
  monthlyCharges: MonthlyCharge[];
  attendances: EventAttendance[];
  isHydrated: boolean;
  ratePerHectare: number;
  isSuperAdmin: boolean;

  // Auth
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Access management (superadmin only)
  addAuthUser: (data: Omit<AuthUser, "id">) => Promise<string | null>;
  updateAuthUser: (
    id: string,
    data: Omit<AuthUser, "id">,
  ) => Promise<string | null>;
  toggleAuthUser: (id: string) => Promise<void>;
  deleteAuthUser: (id: string) => Promise<void>;
  isUsernameUnique: (username: string, excludeId?: string) => boolean;

  // Members
  addMember: (data: Omit<Member, "id" | "createdAt">) => Promise<string | null>;
  updateMember: (
    id: string,
    data: Omit<Member, "id" | "createdAt">,
  ) => Promise<string | null>;
  deleteMember: (id: string) => Promise<void>;
  isCedulaUnique: (cedula: string, excludeId?: string) => boolean;

  // Monthly Charges
  generateMonthlyCharges: (month: string) => Promise<void>;
  getUnpaidMonthlyCharges: (memberId: string) => MonthlyCharge[];

  // Events
  addEvent: (
    data: Omit<CommunityEvent, "id" | "createdAt">,
  ) => Promise<CommunityEvent>;
  updateEvent: (
    id: string,
    data: Omit<CommunityEvent, "id" | "createdAt">,
  ) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Attendance
  initializeAttendance: (eventId: string, memberIds: string[]) => Promise<void>;
  updateAttendance: (attendanceId: string, attended: boolean) => Promise<void>;
  getAttendanceForEvent: (eventId: string) => EventAttendance[];
  getUnpaidFines: (memberId: string) => EventAttendance[];

  // Payments
  addPayment: (data: {
    memberId: string;
    memberName: string;
    concept: PaymentConcept;
    description: string;
    amount: number;
    date: string;
    monthlyChargeIds?: string[];
    attendanceIds?: string[];
  }) => Promise<Payment>;

  // Settings
  updateRatePerHectare: (rate: number) => Promise<void>;

  // Reports
  getMemberDebtSummary: (memberId: string) => MemberDebtSummary;
  getAllDebtSummaries: () => MemberDebtSummary[];
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [monthlyCharges, setMonthlyCharges] = useState<MonthlyCharge[]>([]);
  const [attendances, setAttendances] = useState<EventAttendance[]>([]);
  const [ratePerHectare, setRatePerHectare] = useState<number>(4);
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      try {
        // Restore session from localStorage (just the user object, not data)
        const savedUser = localStorage.getItem("pm_current_user");
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }

        // Load all data from API
        const [
          membersRes,
          paymentsRes,
          eventsRes,
          chargesRes,
          attendancesRes,
          settingsRes,
          accessRes,
        ] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/payments"),
          fetch("/api/events"),
          fetch("/api/monthly-charges"),
          fetch("/api/attendances"),
          fetch("/api/settings"),
          fetch("/api/access"),
        ]);

        if (membersRes.ok) setMembers(await membersRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
        if (chargesRes.ok) setMonthlyCharges(await chargesRes.json());
        if (attendancesRes.ok) setAttendances(await attendancesRes.json());
        if (accessRes.ok) setAuthUsers(await accessRes.json());

        if (settingsRes.ok) {
          const { settings } = await settingsRes.json();
          const rate = settings.find(
            (s: { key: string; value: string }) => s.key === "rate_per_hectare",
          );
          if (rate) setRatePerHectare(parseFloat(rate.value));
        }
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
      } finally {
        setIsHydrated(true);
      }
    }

    loadAll();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isSuperAdmin = currentUser?.id === SUPERADMIN_ID;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) return false;

        const user: AuthUser = await res.json();
        setCurrentUser(user);
        localStorage.setItem("pm_current_user", JSON.stringify(user));
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("pm_current_user");
  }, []);

  // ── Access management ──────────────────────────────────────────────────────
  const isUsernameUnique = useCallback(
    (username: string, excludeId?: string): boolean => {
      return !authUsers.some(
        (u) => u.username === username && u.id !== excludeId,
      );
    },
    [authUsers],
  );

  const addAuthUser = useCallback(
    async (data: Omit<AuthUser, "id">): Promise<string | null> => {
      try {
        const res = await fetch("/api/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.status === 409) return "El nombre de usuario ya existe.";
        if (!res.ok) return "Error al crear el usuario.";

        const newUser: AuthUser = await res.json();
        setAuthUsers((prev) => [...prev, newUser]);
        return null;
      } catch {
        return "Error de conexión.";
      }
    },
    [],
  );

  const updateAuthUser = useCallback(
    async (id: string, data: Omit<AuthUser, "id">): Promise<string | null> => {
      try {
        const res = await fetch(`/api/access/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.status === 409) return "El nombre de usuario ya existe.";
        if (!res.ok) return "Error al actualizar el usuario.";

        const updated: AuthUser = await res.json();
        setAuthUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
        if (currentUser?.id === id) {
          setCurrentUser(updated);
          localStorage.setItem("pm_current_user", JSON.stringify(updated));
        }
        return null;
      } catch {
        return "Error de conexión.";
      }
    },
    [currentUser],
  );

  const toggleAuthUser = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/access/${id}`, { method: "PATCH" });
      if (!res.ok) return;
      const updated: AuthUser = await res.json();
      setAuthUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch {
      console.error("Error al toggle usuario");
    }
  }, []);

  const deleteAuthUser = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/access/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setAuthUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      console.error("Error al eliminar usuario");
    }
  }, []);

  // ── Members ────────────────────────────────────────────────────────────────
  const isCedulaUnique = useCallback(
    (cedula: string, excludeId?: string): boolean => {
      return !members.some((m) => m.cedula === cedula && m.id !== excludeId);
    },
    [members],
  );

  const addMember = useCallback(
    async (data: Omit<Member, "id" | "createdAt">): Promise<string | null> => {
      try {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.status === 409) return "La cédula ya está registrada.";
        if (!res.ok) return "Error al crear el usuario.";

        const newMember: Member = await res.json();
        setMembers((prev) => [...prev, newMember]);
        return null;
      } catch {
        return "Error de conexión.";
      }
    },
    [],
  );

  const updateMember = useCallback(
    async (
      id: string,
      data: Omit<Member, "id" | "createdAt">,
    ): Promise<string | null> => {
      try {
        const res = await fetch(`/api/members/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.status === 409) return "La cédula ya está registrada.";
        if (!res.ok) return "Error al actualizar el usuario.";

        const updated: Member = await res.json();
        setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
        return null;
      } catch {
        return "Error de conexión.";
      }
    },
    [],
  );

  const deleteMember = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setMonthlyCharges((prev) => prev.filter((c) => c.memberId !== id));
      setAttendances((prev) => prev.filter((a) => a.memberId !== id));
    } catch {
      console.error("Error al eliminar miembro");
    }
  }, []);

  // ── Monthly Charges ────────────────────────────────────────────────────────
  const generateMonthlyCharges = useCallback(
    async (month: string): Promise<void> => {
      try {
        const res = await fetch("/api/monthly-charges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month,
            members: members.map((m) => ({
              id: m.id,
              hectares: m.land.hectares,
            })),
            ratePerHectare,
          }),
        });

        if (!res.ok) return;

        // Reload all monthly charges
        const chargesRes = await fetch("/api/monthly-charges");
        if (chargesRes.ok) setMonthlyCharges(await chargesRes.json());
      } catch {
        console.error("Error generando cuotas");
      }
    },
    [members, ratePerHectare],
  );

  const getUnpaidMonthlyCharges = useCallback(
    (memberId: string): MonthlyCharge[] => {
      return monthlyCharges.filter((c) => c.memberId === memberId && !c.paid);
    },
    [monthlyCharges],
  );

  // ── Events ─────────────────────────────────────────────────────────────────
  const addEvent = useCallback(
    async (
      data: Omit<CommunityEvent, "id" | "createdAt">,
    ): Promise<CommunityEvent> => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const newEvent: CommunityEvent = await res.json();
      setEvents((prev) => [...prev, newEvent]);
      return newEvent;
    },
    [],
  );

  const updateEvent = useCallback(
    async (
      id: string,
      data: Omit<CommunityEvent, "id" | "createdAt">,
    ): Promise<void> => {
      try {
        const res = await fetch(`/api/events/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) return;

        const updated: CommunityEvent = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));

        // Reload attendances because fineAmount may have changed
        const attRes = await fetch("/api/attendances");
        if (attRes.ok) setAttendances(await attRes.json());
      } catch {
        console.error("Error actualizando evento");
      }
    },
    [],
  );

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setAttendances((prev) => prev.filter((a) => a.eventId !== id));
    } catch {
      console.error("Error eliminando evento");
    }
  }, []);

  // ── Attendance ─────────────────────────────────────────────────────────────
  const initializeAttendance = useCallback(
    async (eventId: string, memberIds: string[]): Promise<void> => {
      try {
        const event = events.find((e) => e.id === eventId);
        if (!event) return;

        const res = await fetch("/api/attendances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            memberIds,
            eventAmount: event.amount,
          }),
        });

        if (!res.ok) return;

        // Reload attendances
        const attRes = await fetch("/api/attendances");
        if (attRes.ok) setAttendances(await attRes.json());
      } catch {
        console.error("Error inicializando asistencias");
      }
    },
    [events],
  );

  const updateAttendance = useCallback(
    async (attendanceId: string, attended: boolean): Promise<void> => {
      try {
        const res = await fetch(`/api/attendances/${attendanceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attended }),
        });

        if (!res.ok) return;

        const updated: EventAttendance = await res.json();
        setAttendances((prev) =>
          prev.map((a) => (a.id === attendanceId ? updated : a)),
        );
      } catch {
        console.error("Error actualizando asistencia");
      }
    },
    [],
  );

  const getAttendanceForEvent = useCallback(
    (eventId: string): EventAttendance[] => {
      return attendances.filter((a) => a.eventId === eventId);
    },
    [attendances],
  );

  const getUnpaidFines = useCallback(
    (memberId: string): EventAttendance[] => {
      return attendances.filter(
        (a) => a.memberId === memberId && a.fineGenerated && !a.finePaid,
      );
    },
    [attendances],
  );

  // ── Payments ───────────────────────────────────────────────────────────────
  const addPayment = useCallback(
    async (data: {
      memberId: string;
      memberName: string;
      concept: PaymentConcept;
      description: string;
      amount: number;
      date: string;
      monthlyChargeIds?: string[];
      attendanceIds?: string[];
    }): Promise<Payment> => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const newPayment: Payment = await res.json();
      setPayments((prev) => [newPayment, ...prev]);

      // Update local monthly charges state
      if (data.monthlyChargeIds?.length) {
        setMonthlyCharges((prev) =>
          prev.map((c) =>
            data.monthlyChargeIds!.includes(c.id)
              ? { ...c, paid: true, paymentId: newPayment.id }
              : c,
          ),
        );
      }

      // Update local attendances state
      if (data.attendanceIds?.length) {
        setAttendances((prev) =>
          prev.map((a) =>
            data.attendanceIds!.includes(a.id)
              ? { ...a, finePaid: true, finePaymentId: newPayment.id }
              : a,
          ),
        );
      }

      return newPayment;
    },
    [],
  );

  // ── Settings ───────────────────────────────────────────────────────────────
  const updateRatePerHectare = useCallback(
    async (rate: number): Promise<void> => {
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "rate_per_hectare",
            value: String(rate),
          }),
        });

        if (res.ok) setRatePerHectare(rate);
      } catch {
        console.error("Error actualizando tarifa");
      }
    },
    [],
  );

  // ── Reports ────────────────────────────────────────────────────────────────
  const getMemberDebtSummary = useCallback(
    (memberId: string): MemberDebtSummary => {
      const member = members.find((m) => m.id === memberId);
      if (!member) {
        return {
          memberId,
          memberName: "Desconocido",
          cedula: "",
          hectares: 0,
          monthlyRate: 0,
          unpaidMonths: 0,
          monthlyDebt: 0,
          unpaidFines: 0,
          fineDebt: 0,
          totalDebt: 0,
          totalPaid: 0,
          isUpToDate: true,
        };
      }

      const unpaidMonthlyCharges = monthlyCharges.filter(
        (c) => c.memberId === memberId && !c.paid,
      );
      const unpaidFinesList = attendances.filter(
        (a) => a.memberId === memberId && a.fineGenerated && !a.finePaid,
      );
      const memberPayments = payments.filter((p) => p.memberId === memberId);

      const monthlyDebt = unpaidMonthlyCharges.reduce(
        (sum, c) => sum + c.amount,
        0,
      );
      const fineDebt = unpaidFinesList.reduce(
        (sum, a) => sum + a.fineAmount,
        0,
      );
      const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        memberId,
        memberName: member.name,
        cedula: member.cedula,
        hectares: member.land.hectares,
        monthlyRate: member.land.hectares * ratePerHectare,
        unpaidMonths: unpaidMonthlyCharges.length,
        monthlyDebt,
        unpaidFines: unpaidFinesList.length,
        fineDebt,
        totalDebt: monthlyDebt + fineDebt,
        totalPaid,
        isUpToDate: monthlyDebt === 0 && fineDebt === 0,
      };
    },
    [members, monthlyCharges, attendances, payments, ratePerHectare],
  );

  const getAllDebtSummaries = useCallback((): MemberDebtSummary[] => {
    return members.map((m) => getMemberDebtSummary(m.id));
  }, [members, getMemberDebtSummary]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authUsers,
        members,
        payments,
        events,
        monthlyCharges,
        attendances,
        isHydrated,
        ratePerHectare,
        isSuperAdmin,
        login,
        logout,
        addAuthUser,
        updateAuthUser,
        toggleAuthUser,
        deleteAuthUser,
        isUsernameUnique,
        addMember,
        updateMember,
        deleteMember,
        isCedulaUnique,
        generateMonthlyCharges,
        getUnpaidMonthlyCharges,
        addEvent,
        updateEvent,
        deleteEvent,
        initializeAttendance,
        updateAttendance,
        getAttendanceForEvent,
        getUnpaidFines,
        addPayment,
        updateRatePerHectare,
        getMemberDebtSummary,
        getAllDebtSummaries,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
