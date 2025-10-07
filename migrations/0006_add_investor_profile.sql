-- Add new columns for investor profile
ALTER TABLE risk_assessments ADD COLUMN answers JSONB;
ALTER TABLE risk_assessments ADD COLUMN investor_profile JSONB;

-- Migrate existing data to new format
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
);

-- Set investor_profile to a default empty object for now (will be computed by backend)
UPDATE risk_assessments
SET investor_profile = jsonb_build_object(
  'risk_tolerance', 50,
  'risk_capacity', 50,
  'investment_horizon', 50,
  'investor_experience', 50,
  'regions_selected', COALESCE(geographic_focus, '[]'::jsonb),
  'industry_exclusions', COALESCE(esg_exclusions, '[]'::jsonb)
);

-- Make new columns NOT NULL now that they have data
ALTER TABLE risk_assessments ALTER COLUMN answers SET NOT NULL;
ALTER TABLE risk_assessments ALTER COLUMN investor_profile SET NOT NULL;

-- Drop old columns
ALTER TABLE risk_assessments DROP COLUMN risk_tolerance;
ALTER TABLE risk_assessments DROP COLUMN time_horizon;
ALTER TABLE risk_assessments DROP COLUMN geographic_focus;
ALTER TABLE risk_assessments DROP COLUMN esg_exclusions;
ALTER TABLE risk_assessments DROP COLUMN life_stage;
ALTER TABLE risk_assessments DROP COLUMN income_stability;
ALTER TABLE risk_assessments DROP COLUMN emergency_fund;
ALTER TABLE risk_assessments DROP COLUMN debt_level;
ALTER TABLE risk_assessments DROP COLUMN investment_experience;
ALTER TABLE risk_assessments DROP COLUMN investment_knowledge;
ALTER TABLE risk_assessments DROP COLUMN dividend_vs_growth;
ALTER TABLE risk_assessments DROP COLUMN behavioral_reaction;
ALTER TABLE risk_assessments DROP COLUMN income_range;
ALTER TABLE risk_assessments DROP COLUMN net_worth_range;

