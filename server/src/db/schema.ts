import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'clinic_admin', 'super_admin']);

// Appointment status enum
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'cancelled']);

// Users table - manages platform identities across all supported roles
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authId: text('auth_id').unique().notNull(), // NextAuth user identifier
  role: userRoleEnum('role').notNull().default('patient'),
  profileData: jsonb('profile_data').$type<{
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    medicalIdentifier?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clinics table - primary tenant ledger responsible for organizational configuration
export const clinics = pgTable('clinics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  n8nWebhookUrls: jsonb('n8n_webhook_urls').$type<{
    appointmentBooked?: string;
    appointmentCancelled?: string;
    recordUploaded?: string;
    notificationBase?: string;
  }>(),
  settings: jsonb('settings').$type<{
    timezone?: string;
    bookingWindowDays?: number;
    cancellationHours?: number;
    features?: {
      voiceReminders?: boolean;
      emailNotifications?: boolean;
      whatsappNotifications?: boolean;
    };
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Appointments table - transaction-heavy scheduling engine
export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  slotTime: timestamp('slot_time').notNull(),
  status: appointmentStatusEnum('status').notNull().default('pending'),
  notes: text('notes'), // Consultation notes added by doctor
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Records table - secure metadata vault connected to Cloudinary asset storage
export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(), // Cloudinary asset URL
  recordType: text('record_type').notNull(), // Document category (e.g., 'prescription', 'lab_report', 'imaging')
  ocrData: jsonb('ocr_data').$type<{
    extractedText?: string;
    doctorName?: string;
    date?: string;
    medications?: string[];
    diagnoses?: string[];
    summary?: string;
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    processedAt?: string;
  }>(),
  fileName: text('file_name').notNull(),
  fileSize: text('file_size'), // File size in bytes
  mimeType: text('mime_type'), // e.g., 'application/pdf', 'image/jpeg'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit logs table - immutable append-only compliance ledger
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // e.g., 'LOGIN', 'RECORD_UPLOAD', 'APPOINTMENT_BOOK'
  targetResource: text('target_resource').notNull(), // e.g., 'records:uuid', 'appointments:uuid'
  metadata: jsonb('metadata').$type<{
    ipAddress?: string;
    userAgent?: string;
    changes?: { [key: string]: any };
    previousState?: { [key: string]: any };
    newState?: { [key: string]: any };
  }>(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type MedicalRecord = typeof records.$inferSelect;
export type NewMedicalRecord = typeof records.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
