import { pgTable, uuid, text, timestamp, jsonb, pgEnum, boolean, integer, real } from 'drizzle-orm/pg-core';

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'clinic_admin', 'super_admin']);

// Appointment status enum
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'cancelled', 'reschedule_proposed', 'completed']);

// Notification types enum
export const notificationTypeEnum = pgEnum('notification_type', ['appointment_reminder', 'appointment_booked', 'appointment_cancelled', 'appointment_completed', 'record_uploaded', 'lab_result_ready', 'general']);

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
    specialization?: string;
    licenseNumber?: string;
    picture?: string;
    clinicId?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clinics table - primary tenant ledger responsible for organizational configuration
export const clinics = pgTable('clinics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email'), // Gmail account of clinic admin (used for Google OAuth login)
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  isActive: boolean('is_active').default(false), // Whether clinic has been activated via invitation
  activationToken: text('activation_token'), // Token sent via email for activation
  activatedAt: timestamp('activated_at'), // When the clinic activated their account
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

// Clinic Doctors junction table - manages doctor-clinic relationships
export const clinicDoctors = pgTable('clinic_doctors', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
});

// Notifications table - system-wide notification management
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').references(() => clinics.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>(),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  proposedTime: timestamp('proposed_time'),
  proposedBy: uuid('proposed_by').references(() => users.id, { onDelete: 'set null' }),
  rescheduleReason: text('reschedule_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Records table - secure metadata vault connected to Cloudinary asset storage
export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
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

// Doctor availability table - weekly recurring schedule for doctors
export const doctorAvailability = pgTable('doctor_availability', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: text('start_time').notNull(), // "09:00"
  endTime: text('end_time').notNull(), // "17:00"
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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

export type ClinicDoctor = typeof clinicDoctors.$inferSelect;
export type NewClinicDoctor = typeof clinicDoctors.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type DoctorAvailability = typeof doctorAvailability.$inferSelect;
export type NewDoctorAvailability = typeof doctorAvailability.$inferInsert;
