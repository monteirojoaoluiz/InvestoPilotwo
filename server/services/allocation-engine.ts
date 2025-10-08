import type { InvestorProfile as InvestorProfileDB } from '@shared/schema';
import type { AllocationMetadata } from '@shared/types';

interface BaseAllocation {
  equity: number;
  bonds: number;
}

interface AllocationResult {
  equityPercent: number;
  bondsPercent: number;
  cashPercent: number;
  otherPercent: number;
  holdingsCount: number;
  allocationMetadata: AllocationMetadata;
}

/**
 * T007: Get base allocation from risk tolerance band with boundary interpolation
 */
export function getBaseAllocation(riskTolerance: number): BaseAllocation & {
  interpolated?: { band1: string; band2: string }
} {
  // Boundary interpolation for exact 33 or 66
  if (riskTolerance === 33) {
    // Average of Low (30/70) and Moderate (50/50)
    return {
      equity: 40,
      bonds: 60,
      interpolated: { band1: 'low', band2: 'moderate' }
    };
  }

  if (riskTolerance === 66) {
    // Average of Moderate (50/50) and High (85/15)
    return {
      equity: 67.5,
      bonds: 32.5,
      interpolated: { band1: 'moderate', band2: 'high' }
    };
  }

  // Band logic
  if (riskTolerance < 33) {
    // Low risk: 20-40% equity, 60-80% bonds
    const equity = 20 + (riskTolerance / 33) * 20;
    return { equity, bonds: 100 - equity };
  } else if (riskTolerance < 67) {
    // Moderate risk: 40-60% equity, 40-60% bonds
    const equity = 40 + ((riskTolerance - 33) / 33) * 20;
    return { equity, bonds: 100 - equity };
  } else {
    // High risk: 70-100% equity, 0-30% bonds
    const equity = 70 + ((riskTolerance - 67) / 33) * 30;
    return { equity: Math.min(equity, 100), bonds: Math.max(100 - equity, 0) };
  }
}

/**
 * T008: Apply horizon adjustment (Short <5y: +0%, Medium 5-15y: +10%, Long 15+y: +20%)
 */
export function applyHorizonAdjustment(
  base: BaseAllocation,
  horizon: number
): { allocation: BaseAllocation; adjustment: { equityIncrease: number; category: 'short' | 'medium' | 'long' } } {
  let equityIncrease = 0;
  let category: 'short' | 'medium' | 'long';

  if (horizon < 5) {
    equityIncrease = 0;
    category = 'short';
  } else if (horizon < 15) {
    equityIncrease = 10;
    category = 'medium';
  } else {
    equityIncrease = 20;
    category = 'long';
  }

  return {
    allocation: {
      equity: Math.min(base.equity + equityIncrease, 100),
      bonds: Math.max(base.bonds - equityIncrease, 0),
    },
    adjustment: { equityIncrease, category }
  };
}

/**
 * T009: Apply capacity constraint (Low: 60% max, Medium: 80% max, High: 100% max)
 */
export function applyCapacityConstraint(
  allocation: BaseAllocation,
  capacity: string
): {
  allocation: BaseAllocation;
  constraint: { originalEquity: number; cappedEquity: number; capApplied: boolean; capacityLevel: string }
} {
  const caps: Record<string, number> = { low: 60, medium: 80, high: 100 };
  const maxEquity = caps[capacity] || 100;
  const originalEquity = allocation.equity;

  if (allocation.equity > maxEquity) {
    const excess = allocation.equity - maxEquity;
    return {
      allocation: {
        equity: maxEquity,
        bonds: allocation.bonds + excess,
      },
      constraint: {
        originalEquity,
        cappedEquity: maxEquity,
        capApplied: true,
        capacityLevel: capacity
      }
    };
  }

  return {
    allocation,
    constraint: {
      originalEquity,
      cappedEquity: originalEquity,
      capApplied: false,
      capacityLevel: capacity
    }
  };
}

/**
 * T010: Split remainder into cash/other based on user preference
 */
export function applyRemainder(
  allocation: BaseAllocation,
  cashPreference: number
): {
  equity: number;
  bonds: number;
  cash: number;
  other: number;
  remainderSplit: { totalRemainder: number; cashPercent: number; otherPercent: number }
} {
  const remainder = 100 - allocation.equity - allocation.bonds;
  const cash = (remainder * cashPreference) / 100;
  const other = remainder - cash;

  return {
    ...allocation,
    cash: Number(cash.toFixed(2)),
    other: Number(other.toFixed(2)),
    remainderSplit: {
      totalRemainder: remainder,
      cashPercent: cash,
      otherPercent: other
    }
  };
}

/**
 * T011: Calculate holdings count based on experience level
 */
export function calculateHoldingsCount(
  allocation: { equity: number; bonds: number; cash: number; other: number },
  experienceLevel: string
): number {
  const baseHoldings: Record<string, number> = {
    beginner: 1,
    intermediate: 1.5,
    experienced: 2,
    expert: 2.5,
  };

  const activeClasses = [
    allocation.equity > 0,
    allocation.bonds > 0,
    allocation.cash > 0,
    allocation.other > 0,
  ].filter(Boolean).length;

  return Math.round(activeClasses * (baseHoldings[experienceLevel] || 1));
}

/**
 * T012: Normalize allocation to ensure sum = 100%
 */
export function normalizeAllocation(allocation: {
  equity: number;
  bonds: number;
  cash: number;
  other: number;
  holdingsCount: number;
}): {
  equityPercent: number;
  bondsPercent: number;
  cashPercent: number;
  otherPercent: number;
  holdingsCount: number;
} {
  const sum = allocation.equity + allocation.bonds + allocation.cash + allocation.other;

  // If already normalized (within tolerance), return as-is
  if (Math.abs(sum - 100) < 0.01) {
    return {
      equityPercent: Number(allocation.equity.toFixed(2)),
      bondsPercent: Number(allocation.bonds.toFixed(2)),
      cashPercent: Number(allocation.cash.toFixed(2)),
      otherPercent: Number(allocation.other.toFixed(2)),
      holdingsCount: allocation.holdingsCount,
    };
  }

  // Normalize to exactly 100%
  const factor = 100 / sum;

  return {
    equityPercent: Number((allocation.equity * factor).toFixed(2)),
    bondsPercent: Number((allocation.bonds * factor).toFixed(2)),
    cashPercent: Number((allocation.cash * factor).toFixed(2)),
    otherPercent: Number((allocation.other * factor).toFixed(2)),
    holdingsCount: allocation.holdingsCount,
  };
}

/**
 * T013: Main allocation calculation function that orchestrates all steps
 */
export function calculateAllocation(profile: InvestorProfileDB): AllocationResult {
  // 1. Base allocation from risk tolerance
  const baseResult = getBaseAllocation(profile.riskTolerance);
  const { interpolated, ...base } = baseResult;

  // 2. Adjust for investment horizon
  const { allocation: horizonAdjusted, adjustment: horizonAdjustment } = applyHorizonAdjustment(
    base,
    profile.investmentHorizon
  );

  // 3. Apply risk capacity constraint
  const { allocation: capacityCapped, constraint: capacityConstraint } = applyCapacityConstraint(
    horizonAdjusted,
    profile.riskCapacity
  );

  // 4. Split remainder into cash/other
  const { remainderSplit, ...finalAllocation } = applyRemainder(
    capacityCapped,
    profile.cashOtherPreference
  );

  // 5. Calculate holdings count
  const holdingsCount = calculateHoldingsCount(finalAllocation, profile.experienceLevel);

  // 6. Normalize to ensure sum = 100%
  const normalized = normalizeAllocation({ ...finalAllocation, holdingsCount });

  // Build metadata for audit trail
  const metadata: AllocationMetadata = {
    baseAllocation: {
      equity: base.equity,
      bonds: base.bonds,
    },
    horizonAdjustment: {
      equityIncrease: horizonAdjustment.equityIncrease,
      horizonCategory: horizonAdjustment.category,
    },
    capacityConstraint: {
      originalEquity: capacityConstraint.originalEquity,
      cappedEquity: capacityConstraint.cappedEquity,
      capApplied: capacityConstraint.capApplied,
      capacityLevel: capacityConstraint.capacityLevel as 'low' | 'medium' | 'high',
    },
    remainderSplit: {
      totalRemainder: remainderSplit.totalRemainder,
      cashPercent: remainderSplit.cashPercent,
      otherPercent: remainderSplit.otherPercent,
    },
  };

  // Add boundary interpolation if applicable
  if (interpolated) {
    metadata.boundaryInterpolation = {
      applied: true,
      riskTolerance: profile.riskTolerance,
      band1: interpolated.band1,
      band2: interpolated.band2,
    };
  }

  return {
    ...normalized,
    allocationMetadata: metadata,
  };
}
