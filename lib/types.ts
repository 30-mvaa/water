export type Role = 'admin' | 'user';

export interface AuthUser {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
}

// Land/Terrain details for each member
export interface LandDetails {
  hectares: number;
  location: string;
  description: string;
}

export interface Member {
  id: string;
  cedula: string;
  name: string;
  email: string;
  phone: string;
  land: LandDetails;
  createdAt: string;
}

// Monthly charge type - auto-calculated based on hectares x $4
export interface MonthlyCharge {
  id: string;
  memberId: string;
  month: string; // YYYY-MM format
  amount: number; // hectares * 4
  paid: boolean;
  paymentId?: string;
  createdAt: string;
}

// Event types
export type EventType = 'meeting' | 'work';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: 'Reunión',
  work: 'Trabajo Comunitario',
};

export interface CommunityEvent {
  id: string;
  name: string;
  type: EventType;
  date: string;
  amount: number; // Cost for not attending (fine)
  createdAt: string;
}

// Attendance record
export interface EventAttendance {
  id: string;
  eventId: string;
  memberId: string;
  attended: boolean;
  fineGenerated: boolean;
  fineAmount: number;
  finePaid: boolean;
  finePaymentId?: string;
  createdAt: string;
}

// Payment concepts
export type PaymentConcept = 'monthly' | 'event_fine' | 'other';

export const CONCEPT_LABELS: Record<PaymentConcept, string> = {
  monthly: 'Cuota Mensual',
  event_fine: 'Multa por Inasistencia',
  other: 'Otro',
};

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  concept: PaymentConcept;
  description: string;
  amount: number;
  date: string;
  receiptNumber: string;
  createdAt: string;
  // References for what was paid
  monthlyChargeIds?: string[];
  attendanceIds?: string[];
}

// Calculated debt summary for a member
export interface MemberDebtSummary {
  memberId: string;
  memberName: string;
  cedula: string;
  hectares: number;
  monthlyRate: number;
  unpaidMonths: number;
  monthlyDebt: number;
  unpaidFines: number;
  fineDebt: number;
  totalDebt: number;
  totalPaid: number;
  isUpToDate: boolean;
}
