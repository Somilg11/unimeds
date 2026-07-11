ALTER TYPE "public"."appointment_status" ADD VALUE 'completed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'appointment_completed' BEFORE 'record_uploaded';