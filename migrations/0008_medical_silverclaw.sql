ALTER TABLE "risk_assessments" ADD COLUMN "answers" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD COLUMN "investor_profile" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "risk_tolerance";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "time_horizon";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "geographic_focus";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "esg_only";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "life_stage";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "income_stability";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "emergency_fund";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "debt_level";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "investment_experience";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "investment_knowledge";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "dividend_vs_growth";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "behavioral_reaction";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "income_range";--> statement-breakpoint
ALTER TABLE "risk_assessments" DROP COLUMN "net_worth_range";