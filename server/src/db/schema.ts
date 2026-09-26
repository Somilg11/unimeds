import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  boolean,
  integer,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'clinic_admin', 'super_admin']);

export const clinicStatusEnum = pgEnum('clinic_status', ['invited', 'active', 'suspended']);

// Role a user holds inside a specific clinic (tenant membership)
export const memberRoleEnum = pgEnum('member_role', ['clinic_admin', 'doctor']);

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'reschedule_proposed',
  'cancelled',
  'completed',
  'no_show',
]);

export const authTokenPurposeEnum = pgEnum('auth_token_purpose', ['invite', 'password_reset']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'appointment_booked',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_completed',
  'appointment_reschedule',
  'appointment_reminder',
  'record_uploaded',
  'membership',
  'general',
]);

// ---------------------------------------------------------------------------
// Profile shapes
// ---------------------------------------------------------------------------

export type EmergencyContact = { name?: string; phone?: string; relation?: string };

export type UserProfile = {
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  // doctor-only
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
  yearsOfExperience?: number | null;
};

export type ClinicSettings = {
  slotDurationMinutes: number;
  bookingWindowDays: number;
  cancellationHours: number;
  autoConfirm: boolean;
};

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  slotDurationMinutes: 30,
  bookingWindowDays: 30,
  cancellationHours: 4,
  autoConfirm: false,
};

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(), // always stored lower-cased
    name: text('name').notNull().default(''),
    role: userRoleEnum('role').notNull().default('patient'),
    passwordHash: text('password_hash'),
    googleSub: text('google_sub'),
    avatarUrl: text('avatar_url'),
    profile: jsonb('profile').$type<UserProfile>().notNull().default({}),
    isActive: boolean('is_active').notNull().default(true),
    // Bumped on password change / "sign out everywhere" to revoke issued JWTs
    tokenVersion: integer('token_version').notNull().default(0),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('users_email_uq').on(t.email),
    uniqueIndex('users_google_sub_uq').on(t.googleSub),
    index('users_role_idx').on(t.role),
  ]
);

export const clinics = pgTable(
  'clinics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    email: text('email').notNull(), // primary admin / contact email
    phone: text('phone'),
    description: text('description'),
    logoUrl: text('logo_url'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    timezone: text('timezone').notNull().default('Asia/Kolkata'),
    status: clinicStatusEnum('status').notNull().default('invited'),
    plan: text('plan').notNull().default('starter'),
    settings: jsonb('settings').$type<ClinicSettings>().notNull().default(DEFAULT_CLINIC_SETTINGS),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('clinics_slug_uq').on(t.slug),
    uniqueIndex('clinics_email_uq').on(t.email),
    index('clinics_status_idx').on(t.status),
  ]
);

// Tenant membership: which users belong to which clinic, and as what
export const clinicMembers = pgTable(
  'clinic_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('clinic_members_uq').on(t.clinicId, t.userId, t.role),
    index('clinic_members_user_idx').on(t.userId),
  ]
);

// One-time tokens: staff invites and password resets. Only the SHA-256 hash is stored.
export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    purpose: authTokenPurposeEnum('purpose').notNull(),
    tokenHash: text('token_hash').notNull(),
    email: text('email').notNull(),
    role: userRoleEnum('role'),
    clinicId: uuid('clinic_id').references(() => clinics.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('auth_tokens_hash_uq').on(t.tokenHash), index('auth_tokens_email_idx').on(t.email)]
);

// Weekly recurring schedule. Times are wall-clock "HH:MM" in the clinic's timezone.
export const doctorAvailability = pgTable(
  'doctor_availability',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday … 6=Saturday
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('availability_doctor_clinic_idx').on(t.doctorId, t.clinicId)]
);

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: appointmentStatusEnum('status').notNull().default('pending'),
    reason: text('reason'), // patient-provided
    clinicalNotes: text('clinical_notes'), // doctor-provided
    proposedStartsAt: timestamp('proposed_starts_at', { withTimezone: true }),
    proposedBy: uuid('proposed_by').references(() => users.id, { onDelete: 'set null' }),
    rescheduleReason: text('reschedule_reason'),
    cancelledBy: uuid('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
    cancellationReason: text('cancellation_reason'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // Hard guarantee against double booking of a doctor's slot
    uniqueIndex('appointments_doctor_slot_active_uq')
      .on(t.doctorId, t.startsAt)
      .where(sql`status in ('pending', 'confirmed', 'reschedule_proposed')`),
    index('appointments_patient_idx').on(t.patientId, t.startsAt),
    index('appointments_doctor_idx').on(t.doctorId, t.startsAt),
    index('appointments_clinic_idx').on(t.clinicId, t.startsAt),
  ]
);

export const records = pgTable(
  'records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    clinicId: uuid('clinic_id').references(() => clinics.id, { onDelete: 'set null' }),
    appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    recordType: text('record_type').notNull().default('general'),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type'),
    fileSize: integer('file_size'),
    storagePublicId: text('storage_public_id').notNull(),
    storageResourceType: text('storage_resource_type').notNull(), // image | raw | video
    storageFormat: text('storage_format'),
    // Reserved for the AI engine (OCR / structured extraction)
    ocrData: jsonb('ocr_data').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('records_public_id_uq').on(t.storagePublicId),
    index('records_patient_idx').on(t.patientId, t.createdAt),
    index('records_clinic_idx').on(t.clinicId),
  ]
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    clinicId: uuid('clinic_id').references(() => clinics.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    link: text('link'),
    data: jsonb('data').$type<Record<string, unknown>>(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)]
);

// Append-only compliance ledger. No API deletes from this table.
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorRole: text('actor_role'),
    clinicId: uuid('clinic_id').references(() => clinics.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_logs_created_idx').on(t.createdAt),
    index('audit_logs_clinic_idx').on(t.clinicId, t.createdAt),
    index('audit_logs_action_idx').on(t.action),
  ]
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type Clinic = typeof clinics.$inferSelect;
export type ClinicMember = typeof clinicMembers.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type MedicalRecord = typeof records.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type DoctorAvailability = typeof doctorAvailability.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type AppointmentStatus = (typeof appointmentStatusEnum.enumValues)[number];
