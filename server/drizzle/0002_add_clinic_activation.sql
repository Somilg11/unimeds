ALTER TABLE "clinics" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "is_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "activation_token" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "activated_at" timestamp;
