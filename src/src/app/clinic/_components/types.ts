import type { Appointment, AppointmentStatus, ClinicSettings, RecordItem, Role } from '@/lib/types';

// Shapes specific to the clinic-admin API (docs/api.md → Clinic admin)

export type Clinic = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  status: 'invited' | 'active' | 'suspended';
  plan: string;
  settings: ClinicSettings;
};

export type ClinicOverview = {
  clinic: { id: string; name: string; timezone: string; status: string };
  today: Appointment[];
  pending: Appointment[];
  stats: { next7Days: number; pending: number; patients: number; completed30d: number; doctors: number };
};

export type TeamMember = {
  id: string;
  role: 'doctor' | 'clinic_admin';
  isActive: boolean;
  joinedAt: string | null;
  upcoming: number;
  user: { id: string; name: string; email: string; avatarUrl: string | null; specialization: string | null; phone: string | null };
};

export type TeamInvite = { id: string; email: string; role: 'doctor' | 'clinic_admin'; expiresAt: string; createdAt: string };

export type Team = { members: TeamMember[]; invites: TeamInvite[] };

export type InviteResult = { inviteId: string; inviteUrl: string; emailSent: boolean };

export type ClinicPatientRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  visits: number;
  lastVisit: string | null;
  nextVisit: string | null;
};

export type ClinicPatientDetail = {
  patient: { id: string; name: string; email: string; avatarUrl: string | null; phone: string | null; dateOfBirth: string | null; gender: string | null } | null;
  appointments: Appointment[];
  records: RecordItem[];
};

export type AuditEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  actor: { id: string; name: string; role: Role } | null;
};

export type Analytics = {
  range: { months: number; since: string };
  kpis: { totalAppointments: number; noShowRate: number; cancellationRate: number; newPatients: number };
  trend: Array<{ month: string; total: number; completed: number; cancelled: number; noShow: number }>;
  statusBreakdown: Array<{ status: AppointmentStatus; count: number }>;
  doctorPerformance: Array<{
    doctorId: string;
    name: string;
    specialization: string | null;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    patients: number;
  }>;
};
