# Data Model: Smart Asset Allocation

**Feature**: 001-feature-1-smart | **Date**: 2025-10-08 | **Phase**: 1

## Overview

This document defines the data model for the Smart Asset Allocation feature, including database schema, entity relationships, validation rules, and state transitions.

## Entity Relationship Diagram

```
users (existing)
  │
  ├──< riskAssessments (existing)
  │     │
  │     └──< investorProfiles (NEW)
  │           │
  │           └──< assetAllocations (NEW)
  │
  └──< assetAllocations (NEW) [direct relationship for queries]
```

## Database Schema

### New Table: `investor_profiles`

Stores structured investor profile data computed from risk assessments and user inputs.

```sql
CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,

  -- Profile attributes
  risk_tolerance INTEGER NOT NULL CHECK (risk_tolerance >= 0 AND risk_tolerance <= 100),
  investment_horizon INTEGER NOT NULL CHECK (investment_horizon > 0),
  risk_capacity VARCHAR(10) NOT NULL CHECK (risk_capacity IN ('low', 'medium', 'high')),
  experience_level VARCHAR(15) NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'experienced', 'expert')),
  cash_other_preference INTEGER NOT NULL CHECK (cash_other_preference >= 0 AND cash_other_preference <= 100),

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes
  UNIQUE(user_id, created_at),  -- Enforce one profile per user per timestamp
  INDEX idx_investor_profiles_user_id (user_id),
  INDEX idx_investor_profiles_risk_assessment (risk_assessment_id)
);
```

**Field Descriptions**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `user_id` | UUID | User who owns this profile | FK to users; NOT NULL |
| `risk_assessment_id` | UUID | Source risk assessment | FK to risk_assessments; NOT NULL |
| `risk_tolerance` | INTEGER | Risk tolerance score | 0-100 scale |
| `investment_horizon` | INTEGER | Investment time horizon | Years (>0) |
| `risk_capacity` | VARCHAR | Risk capacity level | 'low', 'medium', 'high' |
| `experience_level` | VARCHAR | Investment experience | 'beginner', 'intermediate', 'experienced', 'expert' |
| `cash_other_preference` | INTEGER | Cash vs. other asset preference | 0-100 (0=all other, 100=all cash) |
| `created_at` | TIMESTAMP | Profile creation time | Auto-set |
| `updated_at` | TIMESTAMP | Last update time | Auto-updated |

**Validation Rules**:
- `risk_tolerance`: Must be 0-100 (derived from risk assessment questionnaire)
- `investment_horizon`: Must be positive integer (years)
- `risk_capacity`: Must be one of predefined levels
- `experience_level`: Must be one of predefined levels
- `cash_other_preference`: 0-100 where 0=100% other assets, 100=100% cash, 50=50/50 split

### New Table: `asset_allocations`

Stores calculated asset allocation recommendations with full history.

```sql
CREATE TABLE asset_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id) ON DELETE CASCADE,

  -- Allocation percentages (sum must equal 100)
  equity_percent NUMERIC(5,2) NOT NULL CHECK (equity_percent >= 0 AND equity_percent <= 100),
  bonds_percent NUMERIC(5,2) NOT NULL CHECK (bonds_percent >= 0 AND bonds_percent <= 100),
  cash_percent NUMERIC(5,2) NOT NULL CHECK (cash_percent >= 0 AND cash_percent <= 100),
  other_percent NUMERIC(5,2) NOT NULL CHECK (other_percent >= 0 AND other_percent <= 100),

  -- Complexity metric
  holdings_count INTEGER NOT NULL CHECK (holdings_count > 0),

  -- Calculation metadata
  allocation_metadata JSONB,  -- Stores calculation details (base allocation, adjustments applied, etc.)

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_asset_allocations_user_id (user_id),
  INDEX idx_asset_allocations_profile_id (investor_profile_id),
  INDEX idx_asset_allocations_user_created (user_id, created_at DESC),

  -- Constraint: percentages sum to 100
  CHECK (ABS((equity_percent + bonds_percent + cash_percent + other_percent) - 100) < 0.01)
);
```

**Field Descriptions**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `user_id` | UUID | User who owns this allocation | FK to users; NOT NULL |
| `investor_profile_id` | UUID | Profile used for calculation | FK to investor_profiles; NOT NULL |
| `equity_percent` | NUMERIC(5,2) | Stocks/equity allocation | 0.00-100.00 |
| `bonds_percent` | NUMERIC(5,2) | Bonds/fixed income allocation | 0.00-100.00 |
| `cash_percent` | NUMERIC(5,2) | Cash/money market allocation | 0.00-100.00 |
| `other_percent` | NUMERIC(5,2) | Other assets allocation | 0.00-100.00 |
| `holdings_count` | INTEGER | Number of holdings | Positive integer |
| `allocation_metadata` | JSONB | Calculation details | Optional; stores audit trail |
| `created_at` | TIMESTAMP | Allocation creation time | Auto-set; immutable |

**Validation Rules**:
- All percentage fields: 0.00-100.00 with 2 decimal precision
- Sum of all percentages must equal 100.00 (± 0.01 for rounding tolerance)
- `holdings_count`: Must be positive integer (typically 3-10 based on experience level)
- `allocation_metadata`: Optional JSONB for storing calculation audit trail (e.g., base allocation, horizon adjustment, capacity cap applied)

**Allocation Metadata Schema** (JSONB):
```typescript
{
  baseAllocation: {
    equity: number,
    bonds: number
  },
  horizonAdjustment: {
    equityIncrease: number,  // percentage points added
    horizonCategory: 'short' | 'medium' | 'long'
  },
  capacityConstraint: {
    originalEquity: number,
    cappedEquity: number,
    capApplied: boolean,
    capacityLevel: 'low' | 'medium' | 'high'
  },
  remainderSplit: {
    totalRemainder: number,
    cashPercent: number,
    otherPercent: number
  },
  boundaryInterpolation: {
    applied: boolean,
    riskTolerance: number,
    band1: string,
    band2: string
  }
}
```

## Entity Definitions

### InvestorProfile

**Purpose**: Represents a user's investment profile with structured attributes used for allocation calculations.

**Attributes**:
- `id`: Unique identifier
- `userId`: Owner of the profile
- `riskAssessmentId`: Source assessment
- `riskTolerance`: 0-100 risk score
- `investmentHorizon`: Years until investment goal
- `riskCapacity`: Financial ability to take risk
- `experienceLevel`: Investment experience
- `cashOtherPreference`: Cash vs. other asset preference
- `createdAt`: Profile creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships**:
- Belongs to one `User`
- Belongs to one `RiskAssessment`
- Has many `AssetAllocation` (one-to-many)

**State Transitions**:
- **Created**: New profile created from risk assessment or manual input
- **Updated**: Profile attributes modified (triggers new allocation calculation)
- **Archived**: User creates new profile (old profile remains for historical allocations)

**Business Rules**:
- One active profile per user (most recent by `created_at`)
- Profile cannot be deleted if allocations reference it (cascading delete handled by DB)
- Updating profile creates new record (immutable pattern)

### AssetAllocation

**Purpose**: Represents a calculated asset allocation recommendation at a point in time.

**Attributes**:
- `id`: Unique identifier
- `userId`: Owner of the allocation
- `investorProfileId`: Profile used for calculation
- `equityPercent`: Stock allocation percentage
- `bondsPercent`: Bond allocation percentage
- `cashPercent`: Cash allocation percentage
- `otherPercent`: Other assets allocation percentage
- `holdingsCount`: Number of recommended holdings
- `allocationMetadata`: Calculation audit trail (JSONB)
- `createdAt`: Allocation timestamp (immutable)

**Relationships**:
- Belongs to one `User`
- Belongs to one `InvestorProfile`

**State Transitions**:
- **Calculated**: New allocation created via API
- **Historical**: Newer allocation exists (becomes part of history view)

**Business Rules**:
- Allocations are immutable (never updated, only created)
- All percentages must sum to exactly 100% (±0.01 for rounding)
- Each profile version generates one allocation
- Oldest allocation per user is the "first recommendation"
- Most recent allocation per user is the "current recommendation"

## Validation Rules Summary

### Profile Validation

```typescript
// Zod schema (TypeScript)
const investorProfileSchema = z.object({
  riskTolerance: z.number().int().min(0).max(100),
  investmentHorizon: z.number().int().min(1),
  riskCapacity: z.enum(['low', 'medium', 'high']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
  cashOtherPreference: z.number().int().min(0).max(100),
});
```

### Allocation Validation

```typescript
// Zod schema (TypeScript)
const assetAllocationSchema = z.object({
  equityPercent: z.number().min(0).max(100).multipleOf(0.01),
  bondsPercent: z.number().min(0).max(100).multipleOf(0.01),
  cashPercent: z.number().min(0).max(100).multipleOf(0.01),
  otherPercent: z.number().min(0).max(100).multipleOf(0.01),
  holdingsCount: z.number().int().positive(),
}).refine(
  (data) => {
    const sum = data.equityPercent + data.bondsPercent + data.cashPercent + data.otherPercent;
    return Math.abs(sum - 100) < 0.01;
  },
  { message: 'Allocation percentages must sum to 100%' }
);
```

## Query Patterns

### Get Current Allocation for User

```sql
SELECT aa.*
FROM asset_allocations aa
WHERE aa.user_id = $1
ORDER BY aa.created_at DESC
LIMIT 1;
```

### Get Allocation History for User

```sql
SELECT aa.*, ip.risk_tolerance, ip.investment_horizon, ip.risk_capacity
FROM asset_allocations aa
JOIN investor_profiles ip ON aa.investor_profile_id = ip.id
WHERE aa.user_id = $1
ORDER BY aa.created_at DESC;
```

### Get Current Profile for User

```sql
SELECT ip.*
FROM investor_profiles ip
WHERE ip.user_id = $1
ORDER BY ip.created_at DESC
LIMIT 1;
```

## Migration Strategy

### Migration File: `XXXX_add_allocation_tables.sql`

```sql
-- Create investor_profiles table
CREATE TABLE investor_profiles (
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

CREATE UNIQUE INDEX idx_investor_profiles_user_created ON investor_profiles(user_id, created_at);
CREATE INDEX idx_investor_profiles_user_id ON investor_profiles(user_id);
CREATE INDEX idx_investor_profiles_risk_assessment ON investor_profiles(risk_assessment_id);

-- Create asset_allocations table
CREATE TABLE asset_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id) ON DELETE CASCADE,
  equity_percent NUMERIC(5,2) NOT NULL CHECK (equity_percent >= 0 AND equity_percent <= 100),
  bonds_percent NUMERIC(5,2) NOT NULL CHECK (bonds_percent >= 0 AND bonds_percent <= 100),
  cash_percent NUMERIC(5,2) NOT NULL CHECK (cash_percent >= 0 AND cash_percent <= 100),
  other_percent NUMERIC(5,2) NOT NULL CHECK (other_percent >= 0 AND other_percent <= 100),
  holdings_count INTEGER NOT NULL CHECK (holdings_count > 0),
  allocation_metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (ABS((equity_percent + bonds_percent + cash_percent + other_percent) - 100) < 0.01)
);

CREATE INDEX idx_asset_allocations_user_id ON asset_allocations(user_id);
CREATE INDEX idx_asset_allocations_profile_id ON asset_allocations(investor_profile_id);
CREATE INDEX idx_asset_allocations_user_created ON asset_allocations(user_id, created_at DESC);
```

## Drizzle ORM Schema

Add to `shared/schema.ts`:

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
  equityPercent: numeric("equity_percent", { precision: 5, scale: 2 }).notNull(),
  bondsPercent: numeric("bonds_percent", { precision: 5, scale: 2 }).notNull(),
  cashPercent: numeric("cash_percent", { precision: 5, scale: 2 }).notNull(),
  otherPercent: numeric("other_percent", { precision: 5, scale: 2 }).notNull(),
  holdingsCount: integer("holdings_count").notNull(),
  allocationMetadata: jsonb("allocation_metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Type Definitions

Add to `shared/types.ts`:

```typescript
import { z } from 'zod';

// Investor Profile
export const investorProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  riskAssessmentId: z.string().uuid(),
  riskTolerance: z.number().int().min(0).max(100),
  investmentHorizon: z.number().int().min(1),
  riskCapacity: z.enum(['low', 'medium', 'high']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
  cashOtherPreference: z.number().int().min(0).max(100),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type InvestorProfile = z.infer<typeof investorProfileSchema>;

// Asset Allocation
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
```
