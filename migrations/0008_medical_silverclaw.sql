-- Add new columns with IF NOT EXISTS checks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'answers') THEN
    ALTER TABLE "risk_assessments" ADD COLUMN "answers" jsonb NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'investor_profile') THEN
    ALTER TABLE "risk_assessments" ADD COLUMN "investor_profile" jsonb NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "risk_tolerance";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "time_horizon";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "geographic_focus";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "esg_only";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "life_stage";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "income_stability";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "emergency_fund";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "debt_level";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "investment_experience";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "investment_knowledge";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "dividend_vs_growth";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "behavioral_reaction";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "income_range";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN IF EXISTS "net_worth_range";