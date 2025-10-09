-- Add optimization column with IF NOT EXISTS check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_recommendations' AND column_name = 'optimization') THEN
    ALTER TABLE "portfolio_recommendations" ADD COLUMN "optimization" jsonb;
  END IF;
END $$;