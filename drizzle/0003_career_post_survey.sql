CREATE TABLE "career_post_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"survey_version" text NOT NULL,
	"department_slugs" jsonb NOT NULL,
	"department_answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"comparison_answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"experience_answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "career_post_surveys" ADD CONSTRAINT "career_post_surveys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "career_post_surveys_user_idx" ON "career_post_surveys" USING btree ("user_id");