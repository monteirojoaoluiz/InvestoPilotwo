-- Add new columns for investor profile (with IF NOT EXISTS checks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'answers') THEN
    ALTER TABLE risk_assessments ADD COLUMN answers JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'investor_profile') THEN
    ALTER TABLE risk_assessments ADD COLUMN investor_profile JSONB;
  END IF;
END $$;

-- Migrate existing data to new format (only if old columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'life_stage') THEN
    UPDATE risk_assessments
    SET answers = jsonb_build_object(
      'lifeStage', life_stage,
      'riskTolerance', risk_tolerance,
      'timeHorizon', time_horizon,
      'geographicFocus', geographic_focus,
      'esgExclusions', esg_exclusions,
      'incomeStability', income_stability,
      'emergencyFund', emergency_fund,
      'debtLevel', debt_level,
      'investmentExperience', investment_experience,
      'investmentKnowledge', investment_knowledge,
      'dividendVsGrowth', dividend_vs_growth,
      'behavioralReaction', behavioral_reaction,
      'incomeRange', income_range,
      'netWorthRange', net_worth_range
    )
    WHERE answers IS NULL;
  END IF;
END $$;

-- Set investor_profile to a default empty object for now (will be computed by backend)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_assessments' AND column_name = 'geographic_focus') THEN
    UPDATE risk_assessments
    SET investor_profile = jsonb_build_object(
      'risk_tolerance', 50,
      'risk_capacity', 50,
      'investment_horizon', 50,
      'investor_experience', 50,
      'regions_selected', COALESCE(geographic_focus, '[]'::jsonb),
      'industry_exclusions', COALESCE(esg_exclusions, '[]'::jsonb)
    )
    WHERE investor_profile IS NULL;
  ELSE
    -- If old columns don't exist, set default values
    UPDATE risk_assessments
    SET investor_profile = jsonb_build_object(
      'risk_tolerance', 50,
      'risk_capacity', 50,
      'investment_horizon', 50,
      'investor_experience', 50,
      'regions_selected', '[]'::jsonb,
      'industry_exclusions', '[]'::jsonb
    )
    WHERE investor_profile IS NULL;
  END IF;
END $$;

-- Make new columns NOT NULL now that they have data
DO $$
BEGIN
  ALTER TABLE risk_assessments ALTER COLUMN answers SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE risk_assessments ALTER COLUMN investor_profile SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop old columns (if they exist)
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS risk_tolerance;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS time_horizon;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS geographic_focus;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS esg_exclusions;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS life_stage;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS income_stability;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS emergency_fund;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS debt_level;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS investment_experience;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS investment_knowledge;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS dividend_vs_growth;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS behavioral_reaction;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS income_range;
ALTER TABLE risk_assessments DROP COLUMN IF EXISTS net_worth_range;

