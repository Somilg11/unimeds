ALTER TYPE "public"."appointment_status" ADD VALUE 'reschedule_proposed';--> statement-breakpoint
CREATE TABLE "doctor_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "proposed_time" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "proposed_by" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "reschedule_reason" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "zip_code" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "is_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "activation_token" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "activated_at" timestamp;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "uploaded_by" uuid;--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;