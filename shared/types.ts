import { z } from 'zod';

// Investor Profile Types
export const investorProfileInputSchema = z.object({
  riskAssessmentId: z.string().uuid(),
  riskTolerance: z.number().int().min(0).max(100),
  investmentHorizon: z.number().int().min(1),
  riskCapacity: z.enum(['low', 'medium', 'high']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
  cashOtherPreference: z.number().int().min(0).max(100),
});

export const investorProfileSchema = investorProfileInputSchema.extend({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type InvestorProfileInput = z.infer<typeof investorProfileInputSchema>;
export type InvestorProfile = z.infer<typeof investorProfileSchema>;

// Asset Allocation Types
export const assetAllocationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  investorProfileId: z.string().uuid(),
  equityPercent: z.number().min(0).max(100).multipleOf(0.01),
  bondsPercent: z.number().min(0).max(100).multipleOf(0.01),
  cashPercent: z.number().min(0).max(100).multipleOf(0.01),
  otherPercent: z.number().min(0).max(100).multipleOf(0.01),
  holdingsCount: z.number().int().positive(),
  allocationMetadata: z.record(z.unknown()).optional(),
  createdAt: z.date().optional(),
}).refine(
  (data) => {
    const sum = data.equityPercent + data.bondsPercent + data.cashPercent + data.otherPercent;
    return Math.abs(sum - 100) < 0.01;
  },
  { message: 'Allocation percentages must sum to 100%' }
);

export type AssetAllocation = z.infer<typeof assetAllocationSchema>;

// Allocation Metadata (for audit trail)
export type AllocationMetadata = {
  baseAllocation: {
    equity: number;
    bonds: number;
  };
  horizonAdjustment: {
    equityIncrease: number;
    horizonCategory: 'short' | 'medium' | 'long';
  };
  capacityConstraint: {
    originalEquity: number;
    cappedEquity: number;
    capApplied: boolean;
    capacityLevel: 'low' | 'medium' | 'high';
  };
  remainderSplit: {
    totalRemainder: number;
    cashPercent: number;
    otherPercent: number;
  };
  boundaryInterpolation?: {
    applied: boolean;
    riskTolerance: number;
    band1: string;
    band2: string;
  };
};

// API Response Types
export type AllocationHistoryResponse = {
  allocations: AssetAllocation[];
  total: number;
  limit: number;
  offset: number;
};
