-- Migration: Change esg_only boolean to esg_exclusions jsonb array
ALTER TABLE "risk_assessments" ADD COLUMN IF NOT EXISTS "esg_exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint

-- Migrate existing data: if esg_only was true (ESG focused), keep empty array; if false, add 'non-esg-funds' exclusion
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'esg_only') THEN
    UPDATE "risk_assessments" SET "esg_exclusions" = CASE WHEN "esg_only" = true THEN '["non-esg-funds"]'::jsonb ELSE '[]'::jsonb END;
    ALTER TABLE "risk_assessments" DROP COLUMN "esg_only";
  END IF;
END $$;