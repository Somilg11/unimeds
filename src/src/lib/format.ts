import type { AppointmentStatus, RecordType, Role } from '@/lib/types';

/** Formats an ISO instant in a given IANA timezone (defaults to the browser's). */
export function formatDateTime(iso: string | Date, timeZone?: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
    ...opts,
  }).format(new Date(iso));
}

export const formatDate = (iso: string | Date, timeZone?: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone }).format(new Date(iso));

export const formatTime = (iso: string | Date, timeZone?: string) =>
  new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso));

export const formatWeekday = (iso: string | Date, timeZone?: string) =>
  new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone }).format(new Date(iso));

/** Short zone label, e.g. "IST". Shown when the clinic zone differs from the viewer's. */
export function zoneLabel(timeZone: string, at: Date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
}

export const isBrowserZone = (timeZone: string) => Intl.DateTimeFormat().resolvedOptions().timeZone === timeZone;

/** YYYY-MM-DD for "today + offset days" in a timezone. */
export function isoDateInZone(timeZone: string, offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  return parts; // en-CA yields YYYY-MM-DD
}

export function relativeTime(iso: string | Date) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return formatDate(iso);
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const initials = (name?: string | null) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  reschedule_proposed: 'New time proposed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show',
};

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  general: 'General',
  prescription: 'Prescription',
  lab_report: 'Lab report',
  imaging: 'Imaging',
  discharge_summary: 'Discharge summary',
  vaccination: 'Vaccination',
  insurance: 'Insurance',
  other: 'Other',
};

export const ROLE_LABEL: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  clinic_admin: 'Clinic admin',
  super_admin: 'Platform admin',
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
