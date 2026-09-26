// Response shapes for the super-admin API (docs/api.md → Super admin)
import type { ClinicSettings, Role } from '@/lib/types';

export type ClinicStatus = 'invited' | 'active' | 'suspended';
export type Plan = 'starter' | 'growth' | 'enterprise';
export const PLANS: Plan[] = ['starter', 'growth', 'enterprise'];
export const PLAN_LABEL: Record<Plan, string> = { starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' };
export const CLINIC_STATUSES: ClinicStatus[] = ['invited', 'active', 'suspended'];

export type AdminOverview = {
  users: { patients: number; doctors: number; admins: number; newLast30: number };
  clinics: { total: number; active: number; invited: number; suspended: number };
  appointments: { total: number; last30: number; completed: number };
  records: number;
  activity: Array<{ day: string; bookings: number; signups: number }>;
};

export type AdminClinicRow = {
  id: string;
  name: string;
  slug: string;
  email: string;
  city: string | null;
  status: ClinicStatus;
  plan: Plan;
  timezone: string;
  createdAt: string;
  activatedAt: string | null;
  doctors: number;
  admins: number;
  appointments30d: number;
};

export type AdminClinic = {
  id: string;
  name: string;
  slug: string;
  email: string;
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
  status: ClinicStatus;
  plan: Plan;
  settings: ClinicSettings;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClinicMemberRole = 'doctor' | 'clinic_admin';

export type AdminClinicDetail = {
  clinic: AdminClinic;
  members: Array<{
    id: string;
    role: ClinicMemberRole;
    isActive: boolean;
    joinedAt: string;
    user: { id: string; name: string; email: string; isActive: boolean };
  }>;
  invites: Array<{ id: string; email: string; role: ClinicMemberRole; expiresAt: string; createdAt: string }>;
  stats: { total: number; upcoming: number; patients: number };
};

export type InviteResult = { inviteId?: string; inviteUrl: string; emailSent: boolean };

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  clinics: string[];
};

export type AuditEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string; role: Role } | null;
  clinic: { id: string; name: string } | null;
};

/** "APPOINTMENT_RESCHEDULE_PROPOSED" → "Appointment reschedule proposed" */
export function humanizeAction(action: string) {
  const s = action.toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
