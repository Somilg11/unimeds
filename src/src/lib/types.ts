// Shapes returned by the Unimeds API (see docs/api.md)

export type Role = 'patient' | 'doctor' | 'clinic_admin' | 'super_admin';

export type AppointmentStatus = 'pending' | 'confirmed' | 'reschedule_proposed' | 'cancelled' | 'completed' | 'no_show';

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };

export type Appointment = {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  clinicalNotes: string | null;
  proposedStartsAt: string | null;
  rescheduleReason: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  patient: { id: string; name: string; email: string; avatarUrl: string | null };
  doctor: { id: string; name: string; avatarUrl: string | null; specialization: string | null };
  clinic: { id: string; name: string; timezone: string; address: string | null; city: string | null };
};

export const RECORD_TYPES = [
  'general',
  'prescription',
  'lab_report',
  'imaging',
  'discharge_summary',
  'vaccination',
  'insurance',
  'other',
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export type RecordItem = {
  id: string;
  patientId: string;
  title: string;
  recordType: RecordType;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  appointmentId: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string; role: Role } | null;
  clinic: { id: string; name: string } | null;
  patient?: { id: string; name: string };
};

export type EmergencyContact = { name?: string; phone?: string; relation?: string };

export type UserProfile = {
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
  yearsOfExperience?: number | null;
};

export type Membership = {
  clinicId: string;
  clinicName: string;
  clinicStatus: 'invited' | 'active' | 'suspended';
  timezone: string;
  role: 'doctor' | 'clinic_admin';
  isActive: boolean;
};

export type Me = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  profile: UserProfile;
  hasPassword: boolean;
  createdAt: string;
  memberships: Membership[];
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  clinicId: string | null;
};

export type Slot = { startsAt: string; endsAt: string; label: string };

export type AvailabilityBlock = { id?: string; clinicId?: string; dayOfWeek: number; startTime: string; endTime: string };

export type ClinicSettings = {
  slotDurationMinutes: number;
  bookingWindowDays: number;
  cancellationHours: number;
  autoConfirm: boolean;
};

export type PublicClinic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  doctorCount?: number;
  distanceKm?: number | null;
};

export type PublicDoctor = {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialization: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  clinics: Array<{ id: string; name: string; city: string | null; address: string | null; timezone: string; distanceKm?: number | null }>;
};

export type UploadTicket = { uploadUrl: string; fields: Record<string, string | number>; publicId: string; maxBytes: number };
