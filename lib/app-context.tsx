'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  AuthUser,
  Member,
  Payment,
  CommunityEvent,
  MonthlyCharge,
  EventAttendance,
  MemberDebtSummary,
  LandDetails,
  PaymentConcept,
} from './types';
import {
  AUTH_USERS,
  INITIAL_MEMBERS,
  INITIAL_PAYMENTS,
  INITIAL_EVENTS,
  INITIAL_MONTHLY_CHARGES,
  INITIAL_EVENT_ATTENDANCES,
  RATE_PER_HECTARE,
} from './data';

interface AppContextType {
  currentUser: AuthUser | null;
  members: Member[];
  payments: Payment[];
  events: CommunityEvent[];
  monthlyCharges: MonthlyCharge[];
  attendances: EventAttendance[];
  isHydrated: boolean;
  ratePerHectare: number;
  
  // Auth
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  // Members
  addMember: (data: Omit<Member, 'id' | 'createdAt'>) => string | null;
  updateMember: (id: string, data: Omit<Member, 'id' | 'createdAt'>) => string | null;
  deleteMember: (id: string) => void;
  isCedulaUnique: (cedula: string, excludeId?: string) => boolean;
  
  // Monthly Charges
  generateMonthlyCharges: (month: string) => void;
  getUnpaidMonthlyCharges: (memberId: string) => MonthlyCharge[];
  
  // Events
  addEvent: (data: Omit<CommunityEvent, 'id' | 'createdAt'>) => CommunityEvent;
  updateEvent: (id: string, data: Omit<CommunityEvent, 'id' | 'createdAt'>) => void;
  deleteEvent: (id: string) => void;
  
  // Attendance
  initializeAttendance: (eventId: string, memberIds: string[]) => void;
  updateAttendance: (attendanceId: string, attended: boolean) => void;
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
  }) => Payment;
  
  // Reports
  getMemberDebtSummary: (memberId: string) => MemberDebtSummary;
  getAllDebtSummaries: () => MemberDebtSummary[];
}

const AppContext = createContext<AppContextType | null>(null);

function generateReceiptNumber(count: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(count + 1).padStart(4, '0');
  return `REC-${year}${month}-${seq}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [events, setEvents] = useState<CommunityEvent[]>(INITIAL_EVENTS);
  const [monthlyCharges, setMonthlyCharges] = useState<MonthlyCharge[]>(INITIAL_MONTHLY_CHARGES);
  const [attendances, setAttendances] = useState<EventAttendance[]>(INITIAL_EVENT_ATTENDANCES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('pm_auth_user');
      const savedMembers = localStorage.getItem('pm_members');
      const savedPayments = localStorage.getItem('pm_payments');
      const savedEvents = localStorage.getItem('pm_events');
      const savedMonthly = localStorage.getItem('pm_monthly_charges');
      const savedAttendances = localStorage.getItem('pm_attendances');
      
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      if (savedMembers) setMembers(JSON.parse(savedMembers));
      if (savedPayments) setPayments(JSON.parse(savedPayments));
      if (savedEvents) setEvents(JSON.parse(savedEvents));
      if (savedMonthly) setMonthlyCharges(JSON.parse(savedMonthly));
      if (savedAttendances) setAttendances(JSON.parse(savedAttendances));
    } catch {
      // ignore parse errors
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    if (currentUser) {
      localStorage.setItem('pm_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pm_auth_user');
    }
  }, [currentUser, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('pm_members', JSON.stringify(members));
  }, [members, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('pm_payments', JSON.stringify(payments));
  }, [payments, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('pm_events', JSON.stringify(events));
  }, [events, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('pm_monthly_charges', JSON.stringify(monthlyCharges));
  }, [monthlyCharges, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('pm_attendances', JSON.stringify(attendances));
  }, [attendances, isHydrated]);

  // Auth
  const isCedulaUnique = useCallback(
    (cedula: string, excludeId?: string): boolean => {
      return !members.some((m) => m.cedula === cedula && m.id !== excludeId);
    },
    [members]
  );

  const login = useCallback((username: string, password: string): boolean => {
    const user = AUTH_USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Members
  const addMember = useCallback(
    (data: Omit<Member, 'id' | 'createdAt'>): string | null => {
      if (!isCedulaUnique(data.cedula)) {
        return 'La cédula ya está registrada.';
      }
      const newMember: Member = {
        ...data,
        id: `m${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setMembers((prev) => [...prev, newMember]);
      return null;
    },
    [isCedulaUnique]
  );

  const updateMember = useCallback(
    (id: string, data: Omit<Member, 'id' | 'createdAt'>): string | null => {
      if (!isCedulaUnique(data.cedula, id)) {
        return 'La cédula ya está registrada.';
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data } : m))
      );
      return null;
    },
    [isCedulaUnique]
  );

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setMonthlyCharges((prev) => prev.filter((c) => c.memberId !== id));
    setAttendances((prev) => prev.filter((a) => a.memberId !== id));
  }, []);

  // Monthly Charges
  const generateMonthlyCharges = useCallback(
    (month: string) => {
      setMonthlyCharges((prev) => {
        const existingForMonth = prev.filter((c) => c.month === month);
        const existingMemberIds = new Set(existingForMonth.map((c) => c.memberId));
        
        const newCharges: MonthlyCharge[] = members
          .filter((m) => !existingMemberIds.has(m.id))
          .map((member) => ({
            id: `mc${Date.now()}-${member.id}`,
            memberId: member.id,
            month,
            amount: member.land.hectares * RATE_PER_HECTARE,
            paid: false,
            createdAt: new Date().toISOString(),
          }));
        
        return [...prev, ...newCharges];
      });
    },
    [members]
  );

  const getUnpaidMonthlyCharges = useCallback(
    (memberId: string): MonthlyCharge[] => {
      return monthlyCharges.filter((c) => c.memberId === memberId && !c.paid);
    },
    [monthlyCharges]
  );

  // Events
  const addEvent = useCallback(
    (data: Omit<CommunityEvent, 'id' | 'createdAt'>): CommunityEvent => {
      const newEvent: CommunityEvent = {
        ...data,
        id: `ev${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, newEvent]);
      return newEvent;
    },
    []
  );

  const updateEvent = useCallback(
    (id: string, data: Omit<CommunityEvent, 'id' | 'createdAt'>) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      );
      // Update fine amounts in attendances if event amount changed
      setAttendances((prev) =>
        prev.map((a) =>
          a.eventId === id && a.fineGenerated
            ? { ...a, fineAmount: data.amount }
            : a
        )
      );
    },
    []
  );

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setAttendances((prev) => prev.filter((a) => a.eventId !== id));
  }, []);

  // Attendance
  const initializeAttendance = useCallback(
    (eventId: string, memberIds: string[]) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      setAttendances((prev) => {
        const existingMemberIds = new Set(
          prev.filter((a) => a.eventId === eventId).map((a) => a.memberId)
        );
        
        const newAttendances: EventAttendance[] = memberIds
          .filter((mid) => !existingMemberIds.has(mid))
          .map((memberId) => ({
            id: `att${Date.now()}-${memberId}`,
            eventId,
            memberId,
            attended: false, // Default to not attended
            fineGenerated: true, // Auto-generate fine for non-attendance
            fineAmount: event.amount,
            finePaid: false,
            createdAt: new Date().toISOString(),
          }));
        
        return [...prev, ...newAttendances];
      });
    },
    [events]
  );

  const updateAttendance = useCallback(
    (attendanceId: string, attended: boolean) => {
      setAttendances((prev) =>
        prev.map((a) =>
          a.id === attendanceId
            ? {
                ...a,
                attended,
                fineGenerated: !attended,
                fineAmount: attended ? 0 : a.fineAmount,
              }
            : a
        )
      );
    },
    []
  );

  const getAttendanceForEvent = useCallback(
    (eventId: string): EventAttendance[] => {
      return attendances.filter((a) => a.eventId === eventId);
    },
    [attendances]
  );

  const getUnpaidFines = useCallback(
    (memberId: string): EventAttendance[] => {
      return attendances.filter(
        (a) => a.memberId === memberId && a.fineGenerated && !a.finePaid
      );
    },
    [attendances]
  );

  // Payments
  const addPayment = useCallback(
    (data: {
      memberId: string;
      memberName: string;
      concept: PaymentConcept;
      description: string;
      amount: number;
      date: string;
      monthlyChargeIds?: string[];
      attendanceIds?: string[];
    }): Payment => {
      let newPayment!: Payment;
      
      setPayments((prev) => {
        newPayment = {
          ...data,
          id: `p${Date.now()}`,
          receiptNumber: generateReceiptNumber(prev.length),
          createdAt: new Date().toISOString(),
        };
        return [...prev, newPayment];
      });

      // Mark monthly charges as paid
      if (data.monthlyChargeIds && data.monthlyChargeIds.length > 0) {
        setMonthlyCharges((prev) =>
          prev.map((c) =>
            data.monthlyChargeIds!.includes(c.id)
              ? { ...c, paid: true, paymentId: newPayment.id }
              : c
          )
        );
      }

      // Mark fines as paid
      if (data.attendanceIds && data.attendanceIds.length > 0) {
        setAttendances((prev) =>
          prev.map((a) =>
            data.attendanceIds!.includes(a.id)
              ? { ...a, finePaid: true, finePaymentId: newPayment.id }
              : a
          )
        );
      }

      return newPayment;
    },
    []
  );

  // Reports
  const getMemberDebtSummary = useCallback(
    (memberId: string): MemberDebtSummary => {
      const member = members.find((m) => m.id === memberId);
      if (!member) {
        return {
          memberId,
          memberName: 'Desconocido',
          cedula: '',
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
        (c) => c.memberId === memberId && !c.paid
      );
      const unpaidFinesList = attendances.filter(
        (a) => a.memberId === memberId && a.fineGenerated && !a.finePaid
      );
      const memberPayments = payments.filter((p) => p.memberId === memberId);

      const monthlyDebt = unpaidMonthlyCharges.reduce((sum, c) => sum + c.amount, 0);
      const fineDebt = unpaidFinesList.reduce((sum, a) => sum + a.fineAmount, 0);
      const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        memberId,
        memberName: member.name,
        cedula: member.cedula,
        hectares: member.land.hectares,
        monthlyRate: member.land.hectares * RATE_PER_HECTARE,
        unpaidMonths: unpaidMonthlyCharges.length,
        monthlyDebt,
        unpaidFines: unpaidFinesList.length,
        fineDebt,
        totalDebt: monthlyDebt + fineDebt,
        totalPaid,
        isUpToDate: monthlyDebt === 0 && fineDebt === 0,
      };
    },
    [members, monthlyCharges, attendances, payments]
  );

  const getAllDebtSummaries = useCallback((): MemberDebtSummary[] => {
    return members.map((m) => getMemberDebtSummary(m.id));
  }, [members, getMemberDebtSummary]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        members,
        payments,
        events,
        monthlyCharges,
        attendances,
        isHydrated,
        ratePerHectare: RATE_PER_HECTARE,
        login,
        logout,
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
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
