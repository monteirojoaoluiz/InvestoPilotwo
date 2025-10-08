/**
 * Risk tolerance levels and their characteristics
 */

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

export interface RiskProfile {
  level: RiskLevel;
  name: string;
  description: string;
  stockAllocation: number; // Percentage
  bondAllocation: number; // Percentage
  expectedAnnualReturn: number; // Percentage
  expectedVolatility: number; // Percentage
}

/**
 * Risk profiles defining investment characteristics
 */
export const RISK_PROFILES: Record<RiskLevel, RiskProfile> = {
  conservative: {
    level: 'conservative',
    name: 'Conservative',
    description: 'Lower risk with focus on capital preservation and stable income',
    stockAllocation: 40,
    bondAllocation: 60,
    expectedAnnualReturn: 4.5,
    expectedVolatility: 8,
  },
  moderate: {
    level: 'moderate',
    name: 'Moderate',
    description: 'Balanced approach seeking growth with moderate risk',
    stockAllocation: 70,
    bondAllocation: 30,
    expectedAnnualReturn: 6.5,
    expectedVolatility: 12,
  },
  aggressive: {
    level: 'aggressive',
    name: 'Aggressive',
    description: 'Higher risk targeting maximum long-term growth',
    stockAllocation: 90,
    bondAllocation: 10,
    expectedAnnualReturn: 8.5,
    expectedVolatility: 16,
  },
};

/**
 * Map investor profile scores to risk levels
 */
export function mapScoreToRiskLevel(riskTolerance: number): RiskLevel {
  if (riskTolerance < 35) return 'conservative';
  if (riskTolerance < 65) return 'moderate';
  return 'aggressive';
}

/**
 * Get risk profile by level
 */
export function getRiskProfile(level: RiskLevel): RiskProfile {
  return RISK_PROFILES[level];
}

