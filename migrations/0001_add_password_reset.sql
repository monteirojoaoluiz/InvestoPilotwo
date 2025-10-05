-- Add password column to users table
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
		ALTER TABLE "users" ADD COLUMN "password" varchar;
	END IF;
END $$;
--> statement-breakpoint
