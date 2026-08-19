ALTER TABLE "project_idea_upvote" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_v2_error_vote" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_v2_feature_suggestion" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_v2_global_leaderboard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_v2_invitation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_v2_leaderboard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_v2_member" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_v2_sprint_suggestion" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "project_idea_upvote" CASCADE;--> statement-breakpoint
DROP TABLE "project_v2_error_vote" CASCADE;--> statement-breakpoint
DROP TABLE "project_v2_feature_suggestion" CASCADE;--> statement-breakpoint
DROP TABLE "project_v2_global_leaderboard" CASCADE;--> statement-breakpoint
DROP TABLE "project_v2_invitation" CASCADE;--> statement-breakpoint
DROP TABLE "project_v2_leaderboard" CASCADE;--> statement-breakpoint
DROP TABLE "project_v2_member" CASCADE;--> statement-breakpoint
DROP TABLE "project_v2_sprint_suggestion" CASCADE;--> statement-breakpoint
DROP INDEX "idx_project_idea_upvotes";--> statement-breakpoint
ALTER TABLE "project_idea" DROP COLUMN "upvotes";--> statement-breakpoint
DROP TYPE "public"."feature_suggestion_status";--> statement-breakpoint
DROP TYPE "public"."feature_suggestion_type";--> statement-breakpoint
DROP TYPE "public"."project_v2_member_role";--> statement-breakpoint
DROP TYPE "public"."suggestion_source";