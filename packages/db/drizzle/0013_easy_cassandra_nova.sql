ALTER TABLE "credit_transfer_out" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "credit_transfer_out" CASCADE;--> statement-breakpoint
ALTER TABLE "user_profile" ALTER COLUMN "cover_gradient" SET DEFAULT '#525252,#a3a3a3';--> statement-breakpoint
ALTER TABLE "pathfinder_group" ALTER COLUMN "color" SET DEFAULT '#525252';