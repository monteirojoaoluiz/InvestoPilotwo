-- Create investor_profiles table
CREATE TABLE IF NOT EXISTS investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  risk_tolerance INTEGER NOT NULL CHECK (risk_tolerance >= 0 AND risk_tolerance <= 100),
  investment_horizon INTEGER NOT NULL CHECK (investment_horizon > 0),
  risk_capacity VARCHAR(10) NOT NULL CHECK (risk_capacity IN ('low', 'medium', 'high')),
  experience_level VARCHAR(15) NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'experienced', 'expert')),
  cash_other_preference INTEGER NOT NULL CHECK (cash_other_preference >= 0 AND cash_other_preference <= 100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_investor_profiles_user_created ON investor_profiles(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_risk_assessment ON investor_profiles(risk_assessment_id);

-- Create asset_allocations table
CREATE TABLE IF NOT EXISTS asset_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id) ON DELETE CASCADE,
  equity_percent VARCHAR NOT NULL,
  bonds_percent VARCHAR NOT NULL,
  cash_percent VARCHAR NOT NULL,
  other_percent VARCHAR NOT NULL,
  holdings_count INTEGER NOT NULL CHECK (holdings_count > 0),
  allocation_metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_allocations_user_id ON asset_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_profile_id ON asset_allocations(investor_profile_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_user_created ON asset_allocations(user_id, created_at DESC);
