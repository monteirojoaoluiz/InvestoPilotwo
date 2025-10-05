-- Alter risk_assessments table to rename us_only to geographic_focus
ALTER TABLE "risk_assessments" RENAME COLUMN "us_only" TO "geographic_focus";
ALTER TABLE "risk_assessments" ALTER COLUMN "geographic_focus" TYPE jsonb USING CASE WHEN "geographic_focus" = 't' THEN '["united-states"]'::jsonb ELSE '["europe-ex-nl"]'::jsonb END;
