# Implementation Plan: Smart Asset Allocation

**Branch**: `001-feature-1-smart` | **Date**: 2025-10-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-feature-1-smart/spec.md`

## Summary

This feature implements an intelligent asset allocation engine that recommends optimal portfolio splits (stocks, bonds, cash, other) based on user's investor profile (risk tolerance, investment horizon, risk capacity, experience level). The system applies risk-based allocation bands, adjusts for investment horizon, enforces risk capacity constraints, and tailors portfolio complexity to experience level. All allocation recommendations are stored historically with timestamps, allowing users to track changes over time.

## Technical Context

**Language/Version**: TypeScript (Node 18+), React 18+
**Primary Dependencies**: Express, Drizzle ORM, PostgreSQL client, Zod, React Query
**Storage**: PostgreSQL (Neon/Supabase for production, Docker for local)
**Testing**: Manual testing (POC scope - automated tests optional)
**Target Platform**: Web application (desktop-first, responsive optional)
**Project Type**: Web (frontend + backend monorepo)
**Performance Goals**: Allocation calculation within 2 seconds; handle single user demo load
**Constraints**: POC-focused; no real financial data; basic validation only
**Scale/Scope**: Single user portfolio demo; 4 asset classes; historical tracking

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Alignment with Constitution Principles

**I. Speed Over Perfection** ✅
- Feature uses existing stack (TypeScript, React, Express, Drizzle) - no new technology to learn
- Desktop-first approach acceptable for POC scope
- Algorithm is straightforward business logic with clear rules from spec
- Can ship MVP with just core allocation logic (P1 user story)

**II. Basic Security (Not Production-Grade)** ✅
- No new security concerns - uses existing user authentication
- Allocation data is demo/test data only (not real financial portfolios)
- Basic input validation with Zod schemas sufficient
- No PII beyond existing user data

**III. AI Experimentation & Learning** ✅
- This feature establishes data foundation for future AI portfolio recommendations
- Allocation logic is deterministic (rules-based), not AI-driven
- Sets up investor profile schema for AI chat features to reference
- Enables future experimentation with AI-suggested rebalancing

**IV. Pragmatic Data Handling** ✅
- Extends existing schema (`riskAssessments`, `users` tables)
- New tables: `assetAllocations`, `investorProfiles` use Drizzle ORM patterns already established
- TypeScript types from Zod schemas maintain type safety
- JSONB storage for allocation history keeps schema flexible

**V. Manual Testing is Sufficient** ✅
- Test scenarios clearly defined in spec (4 user stories with acceptance criteria)
- Can manually verify allocation percentages, capacity constraints, horizon adjustments
- Edge cases testable by creating profiles with boundary values

**VI. "Good Enough" Performance** ✅
- Allocation calculation is pure JavaScript math - no external API calls
- Database writes are single inserts (minimal latency)
- Loading states in UI for better UX during profile updates
- No premature optimization needed for POC scale

### Constitution Gates

| Gate | Status | Justification |
|------|--------|---------------|
| No new tech stack | ✅ PASS | Uses existing TypeScript, React, Express, Drizzle, PostgreSQL |
| Desktop-first acceptable | ✅ PASS | Web UI with existing responsive component library (Radix UI, Tailwind) |
| Manual testing sufficient | ✅ PASS | 4 user stories with clear acceptance scenarios provide manual test plan |
| Basic security only | ✅ PASS | No new security requirements beyond existing authentication |
| Speed prioritized | ✅ PASS | Straightforward implementation - no complex abstractions needed |

**Overall Assessment**: ✅ **APPROVED** - Feature aligns with all constitution principles. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```
specs/001-feature-1-smart/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── asset-allocation-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Web application (frontend + backend monorepo)
server/
├── db.ts                      # Database connection (existing)
├── routes.ts                  # API routes (existing - will extend)
├── storage.ts                 # Data access layer (existing - will extend)
├── services/
│   └── allocation-engine.ts   # NEW: Asset allocation calculation logic
└── index.ts                   # Express server (existing)

shared/
├── schema.ts                  # Drizzle schema (existing - will extend with new tables)
└── types.ts                   # TypeScript types (existing - will extend)

client/src/
├── components/
│   ├── InvestorProfileForm.tsx    # NEW: Profile setup/edit UI
│   ├── AssetAllocationView.tsx    # NEW: Display allocation recommendations
│   └── AllocationHistory.tsx      # NEW: Historical allocations timeline
├── pages/
│   └── portfolio-allocation.tsx   # NEW: Main allocation feature page
└── hooks/
    └── use-allocation.ts          # NEW: React Query hooks for allocation API

migrations/
└── [timestamp]_add_allocation_tables.sql  # NEW: Database migration
```

**Structure Decision**: Using existing web application monorepo structure (client/ + server/ + shared/). This feature extends the current investor profile workflow (risk assessment) with asset allocation recommendations. Frontend components follow existing patterns (Radix UI + Tailwind + React Query). Backend follows existing storage layer pattern with service layer for business logic.

## Complexity Tracking

*No constitutional violations - this section is not required.*

---

*Note: Phase 0 (research.md) and Phase 1 (data-model.md, contracts/, quickstart.md) artifacts will be generated in the next steps of the /speckit.plan command execution.*
