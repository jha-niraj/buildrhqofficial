CREATE TYPE "public"."pathfinder_sub_goal_kind" AS ENUM('TOPIC', 'TECHNICAL', 'BEHAVIORAL', 'CODING');--> statement-breakpoint
ALTER TYPE "public"."pathfinder_category" ADD VALUE 'INTERVIEW_PREP' BEFORE 'OTHER';--> statement-breakpoint
ALTER TABLE "pathfinder_goal" ADD COLUMN "source_job_description" text;--> statement-breakpoint
ALTER TABLE "pathfinder_goal" ADD COLUMN "source_company_url" text;--> statement-breakpoint
ALTER TABLE "pathfinder_goal" ADD COLUMN "source_company_info" jsonb;--> statement-breakpoint
ALTER TABLE "pathfinder_sub_goal" ADD COLUMN "kind" "pathfinder_sub_goal_kind" DEFAULT 'TOPIC' NOT NULL;