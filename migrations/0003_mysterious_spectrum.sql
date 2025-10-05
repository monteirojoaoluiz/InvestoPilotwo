-- Add geographic_focus column if it doesn't exist, then change type to jsonb
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'geographic_focus') THEN
		ALTER TABLE "risk_assessments" ADD COLUMN "geographic_focus" jsonb NOT NULL DEFAULT '[]'::jsonb;
	END IF;
END $$;
--> statement-breakpoint

-- Ensure geographic_focus is jsonb type
ALTER TABLE "risk_assessments" ALTER COLUMN "geographic_focus" SET DATA TYPE jsonb;
--> statement-breakpoint

-- Add dividend_vs_growth column if it doesn't exist
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'dividend_vs_growth') THEN
		ALTER TABLE "risk_assessments" ADD COLUMN "dividend_vs_growth" varchar;
	END IF;
END $$;