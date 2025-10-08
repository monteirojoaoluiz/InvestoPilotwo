# Research: Smart Asset Allocation

**Feature**: 001-feature-1-smart | **Date**: 2025-10-08 | **Phase**: 0

## Purpose

This document consolidates research findings for implementing the Smart Asset Allocation feature. All technical decisions and patterns are documented here to inform Phase 1 design.

## Research Areas

### 1. Asset Allocation Algorithm Design

**Decision**: Implement a rule-based allocation engine with layered logic (base allocation → horizon adjustment → capacity constraint)

**Rationale**:
- Spec provides clear allocation bands and adjustment rules
- Deterministic logic ensures predictable, testable outcomes
- Simple JavaScript/TypeScript implementation without external dependencies
- Matches POC goal of learning fundamentals before exploring AI-driven approaches

**Alternatives Considered**:
- **Modern Portfolio Theory (MPT) / Mean-Variance Optimization**: Rejected - requires historical return data, covariance matrices, and optimization libraries (over-engineered for POC)
- **Monte Carlo Simulation**: Rejected - adds complexity and runtime without value for deterministic rule-based system
- **Machine Learning Model**: Rejected - requires training data, model versioning, and ML infrastructure (future enhancement)

**Implementation Pattern**:
```typescript
// Layered calculation approach
function calculateAllocation(profile: InvestorProfile): AssetAllocation {
  // 1. Base allocation from risk tolerance band
  const baseAllocation = getBaseAllocation(profile.riskTolerance);

  // 2. Adjust for investment horizon
  const horizonAdjusted = applyHorizonAdjustment(baseAllocation, profile.investmentHorizon);

  // 3. Apply risk capacity constraint (hard cap)
  const capacityCapped = applyCapacityConstraint(horizonAdjusted, profile.riskCapacity);

  // 4. Split remainder into cash/other based on user preference
  const finalAllocation = applyRemainder(capacityCapped, profile.cashOtherPreference);

  // 5. Ensure sum = 100%
  return normalizeAllocation(finalAllocation);
}
```

### 2. Investor Profile Data Model

**Decision**: Extend existing `riskAssessments` table with new `investorProfiles` table for structured profile data

**Rationale**:
- Existing `riskAssessments` table stores raw questionnaire answers in JSONB (flexible but unstructured)
- New `investorProfiles` table provides typed, indexed columns for allocation algorithm inputs
- Separation of concerns: questionnaire data vs. computed profile features
- Enables efficient querying and joins for allocation history

**Alternatives Considered**:
- **Store profile in riskAssessments.investorProfile JSONB field**: Rejected - lacks type safety, indexing, and makes queries complex
- **Compute profile on-the-fly from answers**: Rejected - adds latency and couples scoring logic to allocation logic
- **Single denormalized table with all fields**: Rejected - mixes concerns and makes schema rigid

**Schema Design**:
```sql
CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  risk_assessment_id UUID REFERENCES risk_assessments(id),
  risk_tolerance INTEGER NOT NULL,  -- 0-100 score
  investment_horizon INTEGER NOT NULL,  -- years
  risk_capacity VARCHAR NOT NULL,  -- 'low' | 'medium' | 'high'
  experience_level VARCHAR NOT NULL,  -- 'beginner' | 'intermediate' | 'experienced' | 'expert'
  cash_other_preference INTEGER NOT NULL,  -- 0-100 (percentage to allocate to cash vs other)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. Allocation Storage & History Tracking

**Decision**: Store each allocation calculation as a separate record with timestamp and reference to investor profile version

**Rationale**:
- Spec clarification confirmed historical storage requirement
- Enables users to see how recommendations changed over time
- Supports future features: trend analysis, rebalancing alerts, performance attribution
- Immutable append-only pattern simplifies concurrency and auditing

**Alternatives Considered**:
- **Update single record in place**: Rejected - loses history per spec requirement
- **Store diffs/patches**: Rejected - adds complexity for marginal storage savings
- **Keep last N allocations**: Rejected - spec clarification specified "all allocations"

**Schema Design**:
```sql
CREATE TABLE asset_allocations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  investor_profile_id UUID REFERENCES investor_profiles(id),
  equity_percent NUMERIC(5,2) NOT NULL,  -- 0.00-100.00
  bonds_percent NUMERIC(5,2) NOT NULL,
  cash_percent NUMERIC(5,2) NOT NULL,
  other_percent NUMERIC(5,2) NOT NULL,
  holdings_count INTEGER NOT NULL,  -- complexity metric
  created_at TIMESTAMP
);
```

### 4. Portfolio Complexity (Holdings Count)

**Decision**: Calculate holdings count as a function of experience level and asset class diversity

**Rationale**:
- Spec defines complexity as "number of holdings" (3-5 for beginners, 7-10+ for experienced)
- Holdings represent individual funds/securities within each asset class
- Complexity affects UX: beginners see simpler recommendations (1-2 funds per asset class)

**Implementation Logic**:
```typescript
function calculateHoldingsCount(
  allocation: AssetAllocation,
  experienceLevel: ExperienceLevel
): number {
  const baseHoldingsMap = {
    beginner: 1,        // 1 holding per asset class
    intermediate: 1.5,  // 1-2 holdings per asset class
    experienced: 2,     // 2 holdings per asset class
    expert: 2.5         // 2-3 holdings per asset class
  };

  const activeAssetClasses = [
    allocation.equityPercent > 0,
    allocation.bondsPercent > 0,
    allocation.cashPercent > 0,
    allocation.otherPercent > 0
  ].filter(Boolean).length;

  const baseHoldings = baseHoldingsMap[experienceLevel];
  return Math.round(activeAssetClasses * baseHoldings);
}
```

### 5. Boundary Value Interpolation

**Decision**: Implement linear interpolation for exact boundary risk tolerance scores (33, 66)

**Rationale**:
- Spec clarification specified "average the two bands' allocations"
- Prevents jarring jumps at boundaries (better UX)
- Simple formula: `result = (band1 + band2) / 2`

**Implementation**:
```typescript
function getBaseAllocation(riskTolerance: number): BaseAllocation {
  // Exact boundaries: interpolate
  if (riskTolerance === 33) {
    const low = { equity: 30, bonds: 70 };  // midpoint of Low band
    const moderate = { equity: 50, bonds: 50 };  // midpoint of Moderate band
    return { equity: (low.equity + moderate.equity) / 2, bonds: (low.bonds + moderate.bonds) / 2 };
  }

  if (riskTolerance === 66) {
    const moderate = { equity: 50, bonds: 50 };
    const high = { equity: 85, bonds: 15 };  // midpoint of High band
    return { equity: (moderate.equity + high.equity) / 2, bonds: (moderate.bonds + high.bonds) / 2 };
  }

  // Normal cases: use band logic
  if (riskTolerance < 33) return getRandomInRange(20, 40, 60, 80);  // Low band
  if (riskTolerance < 67) return getRandomInRange(40, 60, 40, 60);  // Moderate band
  return getRandomInRange(70, 100, 0, 30);  // High band
}
```

### 6. API Design Patterns

**Decision**: RESTful endpoints following existing Express routing patterns in the codebase

**Rationale**:
- Project uses Express with manual route definitions (no framework abstraction)
- Existing patterns: `/api/users`, `/api/risk-assessments`, `/api/portfolio-recommendations`
- Maintain consistency for easier onboarding and maintenance

**Endpoint Design**:
```
POST   /api/investor-profiles          Create/update investor profile
GET    /api/investor-profiles/:id      Get specific profile
GET    /api/investor-profiles/user/:userId  Get user's current profile

POST   /api/asset-allocations          Calculate and store new allocation
GET    /api/asset-allocations/:id      Get specific allocation
GET    /api/asset-allocations/user/:userId  Get user's allocation history (all)
GET    /api/asset-allocations/user/:userId/current  Get user's most recent allocation
```

### 7. Frontend State Management

**Decision**: Use React Query (TanStack Query) for server state, React hooks for local UI state

**Rationale**:
- Project already uses `@tanstack/react-query` (package.json)
- Handles caching, refetching, optimistic updates automatically
- Separates server state (allocations, profiles) from UI state (form inputs, modals)

**Hook Pattern**:
```typescript
// hooks/use-allocation.ts
export function useAllocation(userId: string) {
  return useQuery({
    queryKey: ['allocation', userId],
    queryFn: () => fetch(`/api/asset-allocations/user/${userId}/current`).then(r => r.json()),
  });
}

export function useAllocationHistory(userId: string) {
  return useQuery({
    queryKey: ['allocation-history', userId],
    queryFn: () => fetch(`/api/asset-allocations/user/${userId}`).then(r => r.json()),
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: InvestorProfile) =>
      fetch('/api/asset-allocations', { method: 'POST', body: JSON.stringify(profile) }),
    onSuccess: () => queryClient.invalidateQueries(['allocation']),
  });
}
```

### 8. Validation Strategy

**Decision**: Use Zod schemas for request/response validation at API boundaries

**Rationale**:
- Project uses Zod with `drizzle-zod` for schema generation (package.json)
- Type-safe validation with automatic TypeScript type inference
- Single source of truth for data shapes

**Validation Schemas**:
```typescript
// shared/types.ts
export const investorProfileSchema = z.object({
  riskTolerance: z.number().int().min(0).max(100),
  investmentHorizon: z.number().int().min(1),
  riskCapacity: z.enum(['low', 'medium', 'high']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
  cashOtherPreference: z.number().int().min(0).max(100),
});

export const assetAllocationSchema = z.object({
  equityPercent: z.number().min(0).max(100),
  bondsPercent: z.number().min(0).max(100),
  cashPercent: z.number().min(0).max(100),
  otherPercent: z.number().min(0).max(100),
  holdingsCount: z.number().int().positive(),
}).refine(
  (data) => Math.abs((data.equityPercent + data.bondsPercent + data.cashPercent + data.otherPercent) - 100) < 0.01,
  { message: 'Allocation percentages must sum to 100%' }
);
```

## Technology Stack Summary

| Component | Technology | Justification |
|-----------|------------|---------------|
| Language | TypeScript | Existing project standard; type safety for financial calculations |
| Backend Framework | Express | Existing project standard; simple routing for REST API |
| ORM | Drizzle ORM | Existing project standard; type-safe SQL with minimal overhead |
| Database | PostgreSQL | Existing project standard; supports JSONB and numeric types |
| Frontend Framework | React 18 | Existing project standard; component-based UI |
| State Management | React Query | Existing project standard; server state caching and sync |
| Validation | Zod | Existing project standard; runtime + compile-time validation |
| UI Components | Radix UI + Tailwind | Existing project standard; accessible primitives + utility CSS |

## Open Questions Resolved

All technical unknowns from plan.md Technical Context have been resolved:

- ✅ **Allocation algorithm approach**: Rule-based with layered logic
- ✅ **Profile data model**: New `investorProfiles` table extending risk assessments
- ✅ **Historical storage pattern**: Immutable append-only allocations table
- ✅ **Complexity calculation**: Experience-based holdings count formula
- ✅ **Boundary interpolation**: Linear averaging of adjacent bands
- ✅ **API design**: RESTful endpoints following existing patterns
- ✅ **Frontend patterns**: React Query for server state, Zod for validation

## Next Steps

Proceed to **Phase 1: Design & Contracts**
- Generate `data-model.md` with complete schema definitions
- Generate `contracts/asset-allocation-api.yaml` with OpenAPI specification
- Generate `quickstart.md` with developer setup instructions
- Update agent context with new patterns and decisions
