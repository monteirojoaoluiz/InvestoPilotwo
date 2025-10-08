# Quickstart: Smart Asset Allocation

**Feature**: 001-feature-1-smart | **Date**: 2025-10-08 | **Branch**: `001-feature-1-smart`

## Overview

This quickstart guide helps developers set up and implement the Smart Asset Allocation feature. Follow the steps in order to add asset allocation calculation and historical tracking to the InvestoPilot application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running (Docker or local)
- Project repository cloned
- Environment variables configured (.env file)

## Development Setup

### 1. Checkout Feature Branch

```bash
git checkout 001-feature-1-smart
```

### 2. Install Dependencies (if needed)

```bash
npm install
```

All required dependencies are already in package.json:
- `drizzle-orm` - Database ORM
- `zod` - Schema validation
- `@tanstack/react-query` - React state management
- `express` - Backend framework

### 3. Database Migration

Create and run the migration to add new tables:

```bash
# Generate migration file
npm run db:push

# Or manually create migration file:
# Create file: migrations/XXXX_add_allocation_tables.sql
# Copy SQL from data-model.md migration section
```

Verify tables created:

```sql
-- Connect to your database
psql $DATABASE_URL

-- Check tables exist
\dt investor_profiles
\dt asset_allocations
```

## Implementation Steps

### Step 1: Update Database Schema

**File**: `shared/schema.ts`

Add the new tables (copy from [data-model.md](./data-model.md)):

```typescript
export const investorProfiles = pgTable("investor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  riskAssessmentId: varchar("risk_assessment_id").notNull().references(() => riskAssessments.id, { onDelete: 'cascade' }),
  riskTolerance: integer("risk_tolerance").notNull(),
  investmentHorizon: integer("investment_horizon").notNull(),
  riskCapacity: varchar("risk_capacity", { length: 10 }).notNull(),
  experienceLevel: varchar("experience_level", { length: 15 }).notNull(),
  cashOtherPreference: integer("cash_other_preference").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assetAllocations = pgTable("asset_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  investorProfileId: varchar("investor_profile_id").notNull().references(() => investorProfiles.id, { onDelete: 'cascade' }),
  equityPercent: varchar("equity_percent").notNull(),  // Stored as string, parsed as number
  bondsPercent: varchar("bonds_percent").notNull(),
  cashPercent: varchar("cash_percent").notNull(),
  otherPercent: varchar("other_percent").notNull(),
  holdingsCount: integer("holdings_count").notNull(),
  allocationMetadata: jsonb("allocation_metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**File**: `shared/types.ts`

Add type definitions (copy from [data-model.md](./data-model.md)):

```typescript
import { z } from 'zod';

export const investorProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  riskAssessmentId: z.string().uuid(),
  riskTolerance: z.number().int().min(0).max(100),
  investmentHorizon: z.number().int().min(1),
  riskCapacity: z.enum(['low', 'medium', 'high']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
  cashOtherPreference: z.number().int().min(0).max(100),
});

export type InvestorProfile = z.infer<typeof investorProfileSchema>;

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
});

export type AssetAllocation = z.infer<typeof assetAllocationSchema>;
```

### Step 2: Implement Allocation Engine

**File**: `server/services/allocation-engine.ts` (NEW)

Create the allocation calculation logic (see [research.md](./research.md) for algorithm details):

```typescript
import type { InvestorProfile, AssetAllocation } from '@shared/types';

interface BaseAllocation {
  equity: number;
  bonds: number;
}

export function calculateAllocation(profile: InvestorProfile): Omit<AssetAllocation, 'id' | 'userId' | 'investorProfileId'> {
  // 1. Base allocation from risk tolerance
  const base = getBaseAllocation(profile.riskTolerance);

  // 2. Adjust for investment horizon
  const horizonAdjusted = applyHorizonAdjustment(base, profile.investmentHorizon);

  // 3. Apply risk capacity constraint
  const capacityCapped = applyCapacityConstraint(horizonAdjusted, profile.riskCapacity);

  // 4. Split remainder into cash/other
  const finalAllocation = applyRemainder(capacityCapped, profile.cashOtherPreference);

  // 5. Calculate holdings count
  const holdingsCount = calculateHoldingsCount(finalAllocation, profile.experienceLevel);

  // 6. Normalize to ensure sum = 100%
  return normalizeAllocation({ ...finalAllocation, holdingsCount });
}

function getBaseAllocation(riskTolerance: number): BaseAllocation {
  // Boundary interpolation for exact 33 or 66
  if (riskTolerance === 33) {
    return { equity: 40, bonds: 60 };  // Average of Low (30/70) and Moderate (50/50)
  }
  if (riskTolerance === 66) {
    return { equity: 67.5, bonds: 32.5 };  // Average of Moderate (50/50) and High (85/15)
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

function applyHorizonAdjustment(base: BaseAllocation, horizon: number): BaseAllocation {
  let equityIncrease = 0;

  if (horizon < 5) {
    equityIncrease = 0;  // Short term
  } else if (horizon < 15) {
    equityIncrease = 10;  // Medium term
  } else {
    equityIncrease = 20;  // Long term
  }

  return {
    equity: Math.min(base.equity + equityIncrease, 100),
    bonds: Math.max(base.bonds - equityIncrease, 0),
  };
}

function applyCapacityConstraint(allocation: BaseAllocation, capacity: string): BaseAllocation {
  const caps = { low: 60, medium: 80, high: 100 };
  const maxEquity = caps[capacity as keyof typeof caps];

  if (allocation.equity > maxEquity) {
    const excess = allocation.equity - maxEquity;
    return {
      equity: maxEquity,
      bonds: allocation.bonds + excess,
    };
  }

  return allocation;
}

function applyRemainder(allocation: BaseAllocation, cashPreference: number): {
  equity: number;
  bonds: number;
  cash: number;
  other: number;
} {
  const remainder = 100 - allocation.equity - allocation.bonds;
  const cash = (remainder * cashPreference) / 100;
  const other = remainder - cash;

  return {
    ...allocation,
    cash: Number(cash.toFixed(2)),
    other: Number(other.toFixed(2)),
  };
}

function calculateHoldingsCount(
  allocation: { equity: number; bonds: number; cash: number; other: number },
  experienceLevel: string
): number {
  const baseHoldings = {
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

  return Math.round(activeClasses * baseHoldings[experienceLevel as keyof typeof baseHoldings]);
}

function normalizeAllocation(allocation: {
  equity: number;
  bonds: number;
  cash: number;
  other: number;
  holdingsCount: number;
}): any {
  const sum = allocation.equity + allocation.bonds + allocation.cash + allocation.other;
  const factor = 100 / sum;

  return {
    equityPercent: Number((allocation.equity * factor).toFixed(2)),
    bondsPercent: Number((allocation.bonds * factor).toFixed(2)),
    cashPercent: Number((allocation.cash * factor).toFixed(2)),
    otherPercent: Number((allocation.other * factor).toFixed(2)),
    holdingsCount: allocation.holdingsCount,
  };
}
```

### Step 3: Add Data Access Layer

**File**: `server/storage.ts` (EXTEND EXISTING)

Add functions for investor profiles and allocations:

```typescript
// Add to existing storage.ts

export async function createInvestorProfile(data: {
  userId: string;
  riskAssessmentId: string;
  riskTolerance: number;
  investmentHorizon: number;
  riskCapacity: string;
  experienceLevel: string;
  cashOtherPreference: number;
}) {
  const [profile] = await db.insert(schema.investorProfiles).values(data).returning();
  return profile;
}

export async function getInvestorProfileById(id: string) {
  const [profile] = await db.select().from(schema.investorProfiles).where(eq(schema.investorProfiles.id, id));
  return profile;
}

export async function getUserCurrentProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(schema.investorProfiles)
    .where(eq(schema.investorProfiles.userId, userId))
    .orderBy(desc(schema.investorProfiles.createdAt))
    .limit(1);
  return profile;
}

export async function createAssetAllocation(data: {
  userId: string;
  investorProfileId: string;
  equityPercent: number;
  bondsPercent: number;
  cashPercent: number;
  otherPercent: number;
  holdingsCount: number;
  allocationMetadata?: any;
}) {
  const [allocation] = await db.insert(schema.assetAllocations).values({
    ...data,
    equityPercent: data.equityPercent.toString(),
    bondsPercent: data.bondsPercent.toString(),
    cashPercent: data.cashPercent.toString(),
    otherPercent: data.otherPercent.toString(),
  }).returning();
  return allocation;
}

export async function getUserCurrentAllocation(userId: string) {
  const [allocation] = await db
    .select()
    .from(schema.assetAllocations)
    .where(eq(schema.assetAllocations.userId, userId))
    .orderBy(desc(schema.assetAllocations.createdAt))
    .limit(1);
  return allocation;
}

export async function getUserAllocationHistory(userId: string, limit = 10, offset = 0) {
  const allocations = await db
    .select()
    .from(schema.assetAllocations)
    .where(eq(schema.assetAllocations.userId, userId))
    .orderBy(desc(schema.assetAllocations.createdAt))
    .limit(limit)
    .offset(offset);
  return allocations;
}
```

### Step 4: Add API Routes

**File**: `server/routes.ts` (EXTEND EXISTING)

Add routes per [asset-allocation-api.yaml](./contracts/asset-allocation-api.yaml):

```typescript
// Add to existing routes.ts

import { calculateAllocation } from './services/allocation-engine';
import { investorProfileSchema, assetAllocationSchema } from '@shared/types';

// Investor Profile Routes
app.post('/api/investor-profiles', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const validated = investorProfileSchema.parse({ ...req.body, userId });
    const profile = await storage.createInvestorProfile(validated);
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
});

app.get('/api/investor-profiles/user/:userId', async (req, res, next) => {
  try {
    const profile = await storage.getUserCurrentProfile(req.params.userId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Asset Allocation Routes
app.post('/api/asset-allocations', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { investorProfileId } = req.body;
    const profile = await storage.getInvestorProfileById(investorProfileId);
    if (!profile) return res.status(400).json({ message: 'Profile not found' });

    // Calculate allocation
    const allocation = calculateAllocation(profile);

    // Store result
    const stored = await storage.createAssetAllocation({
      userId,
      investorProfileId,
      ...allocation,
    });

    res.status(201).json(stored);
  } catch (error) {
    next(error);
  }
});

app.get('/api/asset-allocations/user/:userId/current', async (req, res, next) => {
  try {
    const allocation = await storage.getUserCurrentAllocation(req.params.userId);
    if (!allocation) return res.status(404).json({ message: 'No allocation found' });
    res.json(allocation);
  } catch (error) {
    next(error);
  }
});

app.get('/api/asset-allocations/user/:userId', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const allocations = await storage.getUserAllocationHistory(req.params.userId, limit, offset);
    res.json({ allocations, limit, offset });
  } catch (error) {
    next(error);
  }
});
```

### Step 5: Create Frontend Components

**File**: `client/src/hooks/use-allocation.ts` (NEW)

Create React Query hooks:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InvestorProfile, AssetAllocation } from '@shared/types';

export function useCurrentAllocation(userId: string) {
  return useQuery({
    queryKey: ['allocation', 'current', userId],
    queryFn: async () => {
      const res = await fetch(`/api/asset-allocations/user/${userId}/current`);
      if (!res.ok) throw new Error('Failed to fetch allocation');
      return res.json() as Promise<AssetAllocation>;
    },
  });
}

export function useAllocationHistory(userId: string) {
  return useQuery({
    queryKey: ['allocation', 'history', userId],
    queryFn: async () => {
      const res = await fetch(`/api/asset-allocations/user/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      const res = await fetch('/api/asset-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorProfileId: profileId }),
      });
      if (!res.ok) throw new Error('Failed to create allocation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation'] });
    },
  });
}
```

**File**: `client/src/components/AssetAllocationView.tsx` (NEW)

Create allocation display component (basic structure):

```typescript
import { useCurrentAllocation } from '../hooks/use-allocation';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export function AssetAllocationView({ userId }: { userId: string }) {
  const { data: allocation, isLoading, error } = useCurrentAllocation(userId);

  if (isLoading) return <div>Loading allocation...</div>;
  if (error) return <div>Error loading allocation</div>;
  if (!allocation) return <div>No allocation found</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AllocationBar label="Stocks" percent={allocation.equityPercent} color="blue" />
          <AllocationBar label="Bonds" percent={allocation.bondsPercent} color="green" />
          <AllocationBar label="Cash" percent={allocation.cashPercent} color="yellow" />
          <AllocationBar label="Other" percent={allocation.otherPercent} color="purple" />
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Recommended holdings: {allocation.holdingsCount}
        </p>
      </CardContent>
    </Card>
  );
}

function AllocationBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{percent.toFixed(2)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded h-2">
        <div className={`bg-${color}-500 h-2 rounded`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
```

## Testing the Feature

### Manual Testing Checklist

See [spec.md](./spec.md) User Scenarios for detailed test cases. Quick smoke test:

1. **Create Investor Profile**:
   ```bash
   curl -X POST http://localhost:5000/api/investor-profiles \
     -H "Content-Type: application/json" \
     -d '{
       "riskAssessmentId": "your-assessment-id",
       "riskTolerance": 50,
       "investmentHorizon": 15,
       "riskCapacity": "medium",
       "experienceLevel": "intermediate",
       "cashOtherPreference": 50
     }'
   ```

2. **Calculate Allocation**:
   ```bash
   curl -X POST http://localhost:5000/api/asset-allocations \
     -H "Content-Type: application/json" \
     -d '{ "investorProfileId": "profile-id-from-step-1" }'
   ```

3. **Verify Results**:
   - Check allocation percentages sum to 100%
   - Verify equity is within capacity constraints
   - Confirm horizon adjustment applied correctly

## Next Steps

After completing implementation:
1. Run `/speckit.tasks` to generate detailed task breakdown
2. Commit changes: `git add . && git commit -m "feat: implement smart asset allocation"`
3. Test all user stories from spec.md manually
4. Create PR to main branch

## Troubleshooting

**Migration Fails**:
- Check DATABASE_URL is set in .env
- Ensure PostgreSQL is running
- Verify foreign key references exist (users, riskAssessments tables)

**Allocation Calculation Returns NaN**:
- Check all profile inputs are valid numbers
- Verify cash_other_preference is 0-100
- Ensure no division by zero in remainder logic

**API Returns 401 Unauthorized**:
- Check user is authenticated (session cookie present)
- Verify userId in session matches requested resource

## Reference Documents

- [spec.md](./spec.md) - Feature specification
- [research.md](./research.md) - Technical research and algorithm design
- [data-model.md](./data-model.md) - Database schema details
- [contracts/asset-allocation-api.yaml](./contracts/asset-allocation-api.yaml) - OpenAPI specification
