ALTER TABLE "cover_letter" ALTER COLUMN "job_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cover_letter" ADD COLUMN "resume_draft_id" text;--> statement-breakpoint
ALTER TABLE "resume_draft" ADD COLUMN "source_draft_id" text;--> statement-breakpoint
ALTER TABLE "resume_draft" ADD COLUMN "tailored_for_company" text;--> statement-breakpoint
ALTER TABLE "cover_letter" ADD CONSTRAINT "cover_letter_resume_draft_id_resume_draft_id_fk" FOREIGN KEY ("resume_draft_id") REFERENCES "public"."resume_draft"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "resume_draft_one_default_per_user" ON "resume_draft" USING btree ("user_id") WHERE "resume_draft"."is_default";