ALTER TABLE "department_selections" ADD COLUMN "user_chosen_slugs" jsonb;--> statement-breakpoint
ALTER TABLE "department_selections" ADD COLUMN "ai_recommended_slug" text;--> statement-breakpoint
ALTER TABLE "department_selections" ADD COLUMN "recommendation_version" text;--> statement-breakpoint
ALTER TABLE "department_selections" ADD COLUMN "recommendation" jsonb;--> statement-breakpoint
ALTER TABLE "department_selections" ADD COLUMN "confirmed_at" timestamp with time zone;