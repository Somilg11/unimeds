CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'reschedule_proposed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."auth_token_purpose" AS ENUM('invite', 'password_reset');--> statement-breakpoint
CREATE TYPE "public"."clinic_status" AS ENUM('invited', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('clinic_admin', 'doctor');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('appointment_booked', 'appointment_confirmed', 'appointment_cancelled', 'appointment_completed', 'appointment_reschedule', 'appointment_reminder', 'record_uploaded', 'membership', 'general');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('patient', 'doctor', 'clinic_admin', 'super_admin');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"clinical_notes" text,
	"proposed_starts_at" timestamp with time zone,
	"proposed_by" uuid,
	"reschedule_reason" text,
	"cancelled_by" uuid,
	"cancellation_reason" text,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" text,
	"clinic_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" "auth_token_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role",
	"clinic_id" uuid,
	"user_id" uuid,
	"created_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"invited_by" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"description" text,
	"logo_url" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"latitude" real,
	"longitude" real,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"status" "clinic_status" DEFAULT 'invited' NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"settings" jsonb DEFAULT '{"slotDurationMinutes":30,"bookingWindowDays":30,"cancellationHours":4,"autoConfirm":false}'::jsonb NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clinic_id" uuid,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"clinic_id" uuid,
	"appointment_id" uuid,
	"title" text NOT NULL,
	"record_type" text DEFAULT 'general' NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text,
	"file_size" integer,
	"storage_public_id" text NOT NULL,
	"storage_resource_type" text NOT NULL,
	"storage_format" text,
	"ocr_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" "user_role" DEFAULT 'patient' NOT NULL,
	"password_hash" text,
	"google_sub" text,
	"avatar_url" text,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_members" ADD CONSTRAINT "clinic_members_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_members" ADD CONSTRAINT "clinic_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_members" ADD CONSTRAINT "clinic_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_doctor_slot_active_uq" ON "appointments" USING btree ("doctor_id","starts_at") WHERE status in ('pending', 'confirmed', 'reschedule_proposed');--> statement-breakpoint
CREATE INDEX "appointments_patient_idx" ON "appointments" USING btree ("patient_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointments_doctor_idx" ON "appointments" USING btree ("doctor_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointments_clinic_idx" ON "appointments" USING btree ("clinic_id","starts_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_clinic_idx" ON "audit_logs" USING btree ("clinic_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_hash_uq" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_tokens_email_idx" ON "auth_tokens" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "clinic_members_uq" ON "clinic_members" USING btree ("clinic_id","user_id","role");--> statement-breakpoint
CREATE INDEX "clinic_members_user_idx" ON "clinic_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clinics_slug_uq" ON "clinics" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "clinics_email_uq" ON "clinics" USING btree ("email");--> statement-breakpoint
CREATE INDEX "clinics_status_idx" ON "clinics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "availability_doctor_clinic_idx" ON "doctor_availability" USING btree ("doctor_id","clinic_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "records_public_id_uq" ON "records" USING btree ("storage_public_id");--> statement-breakpoint
CREATE INDEX "records_patient_idx" ON "records" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "records_clinic_idx" ON "records" USING btree ("clinic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_sub_uq" ON "users" USING btree ("google_sub");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");