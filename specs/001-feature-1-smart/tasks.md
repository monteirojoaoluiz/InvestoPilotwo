# Tasks: Smart Asset Allocation

**Input**: Design documents from `/specs/001-feature-1-smart/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL per constitution (manual testing sufficient for POC)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions
- **Web app monorepo**: `server/`, `client/src/`, `shared/`
- Database migrations: `migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Add new Drizzle schema tables to `shared/schema.ts` (investorProfiles, assetAllocations)
- [x] T002 [P] Add TypeScript type definitions to `shared/types.ts` (InvestorProfile, AssetAllocation, AllocationMetadata)
- [x] T003 [P] Add Zod validation schemas to `shared/types.ts` (investorProfileSchema, assetAllocationSchema)
- [x] T004 Create database migration file `migrations/[timestamp]_add_allocation_tables.sql` with table definitions from data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Run database migration to create `investor_profiles` and `asset_allocations` tables (execute T004 migration)
- [x] T006 Create allocation engine service file `server/services/allocation-engine.ts` with core calculation functions
- [x] T007 Implement `getBaseAllocation()` function in `server/services/allocation-engine.ts` (handles risk tolerance bands and boundary interpolation)
- [x] T008 Implement `applyHorizonAdjustment()` function in `server/services/allocation-engine.ts` (horizon thresholds: <5y +0%, 5-15y +10%, 15+y +20%)
- [x] T009 Implement `applyCapacityConstraint()` function in `server/services/allocation-engine.ts` (caps: low 60%, medium 80%, high 100%)
- [x] T010 Implement `applyRemainder()` function in `server/services/allocation-engine.ts` (split cash/other based on user preference)
- [x] T011 Implement `calculateHoldingsCount()` function in `server/services/allocation-engine.ts` (experience-based complexity)
- [x] T012 Implement `normalizeAllocation()` function in `server/services/allocation-engine.ts` (ensure sum = 100%)
- [x] T013 Implement main `calculateAllocation()` function in `server/services/allocation-engine.ts` (orchestrates T007-T012 with metadata tracking)
- [x] T014 [P] Add data access functions to `server/storage.ts`: createInvestorProfile(), getInvestorProfileById(), getUserCurrentProfile()
- [x] T015 [P] Add data access functions to `server/storage.ts`: createAssetAllocation(), getUserCurrentAllocation(), getUserAllocationHistory()

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Generate Asset Allocation for Conservative Investor (Priority: P1) 🎯 MVP

**Goal**: A user with low risk tolerance (0-33) completes their investor profile and receives a portfolio recommendation heavily weighted toward bonds with minimal equity exposure.

**Independent Test**: Create an investor profile with risk tolerance 20-30, short horizon, low capacity, then verify system recommends 60-80% bonds and 20-40% equity with horizon adjustments applied correctly.

### Implementation for User Story 1

- [ ] T016 [P] [US1] Add POST `/api/investor-profiles` route to `server/routes.ts` (create/update investor profile)
- [ ] T017 [P] [US1] Add GET `/api/investor-profiles/user/:userId` route to `server/routes.ts` (get user's current profile)
- [ ] T018 [US1] Add POST `/api/asset-allocations` route to `server/routes.ts` (calculate allocation from profile, depends on T016)
- [ ] T019 [US1] Add GET `/api/asset-allocations/user/:userId/current` route to `server/routes.ts` (get user's current allocation)
- [ ] T020 [P] [US1] Create React Query hook `useCurrentAllocation()` in `client/src/hooks/use-allocation.ts`
- [ ] T021 [P] [US1] Create React Query hook `useCreateAllocation()` in `client/src/hooks/use-allocation.ts` (mutation with cache invalidation)
- [ ] T022 [P] [US1] Create `InvestorProfileForm` component in `client/src/components/InvestorProfileForm.tsx` (form for profile attributes)
- [ ] T023 [US1] Create `AssetAllocationView` component in `client/src/components/AssetAllocationView.tsx` (displays allocation percentages and holdings count)
- [ ] T024 [US1] Create page `client/src/pages/portfolio-allocation.tsx` integrating InvestorProfileForm and AssetAllocationView
- [ ] T025 [US1] Add navigation link to portfolio allocation page in app sidebar/menu

**Checkpoint**: User Story 1 complete - User can create conservative profile and see bond-heavy allocation recommendation

---

## Phase 4: User Story 2 - Generate Asset Allocation for Moderate Risk Investor (Priority: P2)

**Goal**: A user with moderate risk tolerance (34-66) receives a balanced portfolio recommendation with roughly equal splits between equity and bonds.

**Independent Test**: Create investor profile with risk tolerance 45-55, medium horizon, moderate capacity, then verify system recommends approximately 50/50 equity/bonds split with horizon and capacity adjustments.

### Implementation for User Story 2

- [ ] T026 [US2] Update `getBaseAllocation()` in `server/services/allocation-engine.ts` to ensure moderate band (34-66) calculation is correct (40-60% equity range)
- [ ] T027 [US2] Add acceptance scenario test cases in `AssetAllocationView` component: display warning if allocation doesn't match expected band for profile
- [ ] T028 [US2] Extend `InvestorProfileForm` component to show allocation preview for different risk tolerance values (moderate range visualization)
- [ ] T029 [US2] Add validation in POST `/api/investor-profiles` route to reject invalid moderate profiles (risk tolerance 34-66 with conflicting parameters)

**Checkpoint**: User Story 2 complete - User can create moderate profile and see balanced allocation recommendation independently testable from US1

---

## Phase 5: User Story 3 - Generate Asset Allocation for Aggressive Investor (Priority: P3)

**Goal**: A user with high risk tolerance (67-100) receives an equity-focused portfolio recommendation with minimal or no bond allocation.

**Independent Test**: Create investor profile with risk tolerance 85-95, long horizon, high capacity, then verify system recommends 80-100% equity with minimal/no bonds and correct capacity caps.

### Implementation for User Story 3

- [ ] T030 [US3] Update `getBaseAllocation()` in `server/services/allocation-engine.ts` to ensure high risk band (67-100) calculation is correct (70-100% equity range)
- [ ] T031 [US3] Add edge case handling in `applyCapacityConstraint()` for high risk + low capacity conflict (cap at 60% equity regardless of risk tolerance)
- [ ] T032 [US3] Extend `AssetAllocationView` component to highlight when capacity constraint was applied (show original vs. capped equity)
- [ ] T033 [US3] Add allocation metadata display in `AssetAllocationView` to show calculation audit trail for aggressive profiles
- [ ] T034 [US3] Add visual indicator in `InvestorProfileForm` when user selects high risk + low capacity (warning about constraint)

**Checkpoint**: User Story 3 complete - User can create aggressive profile and see equity-heavy allocation recommendation with capacity constraints

---

## Phase 6: User Story 4 - Adjust Portfolio Complexity by Experience Level (Priority: P4)

**Goal**: The system adjusts the number of holdings and portfolio structure based on the user's investment experience level, with beginners receiving simpler portfolios (3-5 holdings) and experienced investors receiving more granular portfolios (7-10 holdings).

**Independent Test**: Generate allocations for two identical risk profiles but different experience levels (beginner vs. experienced), then verify beginners receive 3-5 holdings while experienced investors receive 7-10 holdings.

### Implementation for User Story 4

- [ ] T035 [US4] Verify `calculateHoldingsCount()` function in `server/services/allocation-engine.ts` correctly maps experience levels (beginner=1x, intermediate=1.5x, experienced=2x, expert=2.5x holdings per asset class)
- [ ] T036 [US4] Extend `AssetAllocationView` component to display holdings breakdown by experience level (show how holdings are distributed across asset classes)
- [ ] T037 [US4] Add experience level selector to `InvestorProfileForm` with descriptions (beginner: 3-5 holdings, experienced: 7-10 holdings)
- [ ] T038 [US4] Add holdings count calculation preview in `InvestorProfileForm` that updates as user changes experience level
- [ ] T039 [US4] Update allocation metadata in `server/services/allocation-engine.ts` to include holdings calculation details (asset classes × experience multiplier)

**Checkpoint**: User Story 4 complete - User can see portfolio complexity adjusted based on experience level independently from risk/horizon settings

---

## Phase 7: Allocation History & Historical Tracking

**Goal**: Users can view their allocation history and track changes over time

**Independent Test**: Create multiple profiles for same user with different parameters, calculate allocations, then verify history API returns all allocations in chronological order.

### Implementation for Allocation History

- [ ] T040 [P] [History] Add GET `/api/asset-allocations/user/:userId` route to `server/routes.ts` (get allocation history with pagination)
- [ ] T041 [P] [History] Add GET `/api/investor-profiles/:id` route to `server/routes.ts` (get specific profile by ID)
- [ ] T042 [P] [History] Create React Query hook `useAllocationHistory()` in `client/src/hooks/use-allocation.ts`
- [ ] T043 [History] Create `AllocationHistory` component in `client/src/components/AllocationHistory.tsx` (timeline view of historical allocations)
- [ ] T044 [History] Add history tab to `client/src/pages/portfolio-allocation.tsx` showing AllocationHistory component
- [ ] T045 [History] Add comparison view in `AllocationHistory` component to show allocation changes between versions

**Checkpoint**: Allocation history complete - Users can view and compare historical allocation recommendations

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T046 [P] Add loading states to `AssetAllocationView` component (skeleton loaders while calculating)
- [ ] T047 [P] Add error handling to all API routes in `server/routes.ts` (use existing error middleware)
- [ ] T048 [P] Add input validation error messages to `InvestorProfileForm` component (Zod validation errors)
- [ ] T049 Add allocation calculation audit trail logging in `server/services/allocation-engine.ts` (log each step with metadata)
- [ ] T050 [P] Add visual chart/pie chart to `AssetAllocationView` component for allocation percentages (use existing Recharts library)
- [ ] T051 [P] Add responsive design to `InvestorProfileForm` and `AssetAllocationView` components (mobile-friendly layouts)
- [ ] T052 Verify edge cases from spec.md: boundary values (33, 66), horizon conflicts, zero risk tolerance, overflow/underflow
- [ ] T053 Run manual testing checklist from quickstart.md (all user story acceptance scenarios)
- [ ] T054 [P] Update README.md or documentation with feature overview and usage instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational (Phase 2) completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Allocation History (Phase 7)**: Depends on at least US1 (Phase 3) being complete
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independently testable from US1 (tests moderate risk band)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independently testable from US1/US2 (tests high risk band + constraints)
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Independently testable (tests complexity calculation regardless of risk)
- **Allocation History**: Depends on US1 being complete (needs allocation data to display)

### Within Each User Story

- Backend routes before frontend hooks (API must exist)
- Hooks before components (data fetching before UI)
- Components before pages (building blocks before composition)
- Core functionality before polish (working feature before optimization)

### Parallel Opportunities

- **Setup (Phase 1)**: All 4 tasks (T001-T004) can run in parallel [different files]
- **Foundational (Phase 2)**: T014 and T015 can run in parallel [both extend storage.ts but different functions]
- **User Story 1**: T016+T017 parallel, T020+T021 parallel, T022+T023 parallel
- **User Story 2**: All 4 tasks can potentially run in parallel if working on copies/branches
- **User Story 3**: T030+T031 parallel, T032+T033+T034 parallel
- **User Story 4**: T035+T039 parallel, T036+T037+T038 parallel
- **Allocation History**: T040+T041+T042 parallel
- **Polish**: T046, T047, T048, T050, T051, T054 can all run in parallel [different files]
- **Different user stories can be worked on in parallel by different team members after Foundational phase**

---

## Parallel Example: User Story 1 (MVP)

```bash
# After Foundational phase completes, launch User Story 1 tasks in groups:

# Group 1: Backend routes (run together)
Task T016: "Add POST /api/investor-profiles route"
Task T017: "Add GET /api/investor-profiles/user/:userId route"

# Group 2: More backend routes (after Group 1)
Task T018: "Add POST /api/asset-allocations route"
Task T019: "Add GET /api/asset-allocations/user/:userId/current route"

# Group 3: Frontend hooks (run together, after Group 2)
Task T020: "Create useCurrentAllocation() hook"
Task T021: "Create useCreateAllocation() mutation hook"

# Group 4: Frontend components (run together, after Group 3)
Task T022: "Create InvestorProfileForm component"
Task T023: "Create AssetAllocationView component"

# Group 5: Integration (after Group 4)
Task T024: "Create portfolio-allocation page"
Task T025: "Add navigation link"
```

---

## Parallel Example: Multiple User Stories (Team Strategy)

```bash
# After Foundational phase (Phase 2) completes:

# Developer A implements User Story 1 (P1)
# Developer B implements User Story 2 (P2)
# Developer C implements User Story 3 (P3)

# All three stories can proceed independently and test independently
# Each story validates a different risk band and allocation logic
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T015) - CRITICAL, blocks everything
3. Complete Phase 3: User Story 1 (T016-T025) - MVP delivered!
4. **STOP and VALIDATE**: Test conservative investor allocation manually
5. Deploy/demo if ready

**MVP Deliverable**: Users with low risk tolerance can create profiles and receive bond-heavy allocation recommendations. This validates the core allocation engine and entire flow.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - conservative investors)
3. Add User Story 2 → Test independently → Deploy/Demo (adds moderate investors)
4. Add User Story 3 → Test independently → Deploy/Demo (adds aggressive investors)
5. Add User Story 4 → Test independently → Deploy/Demo (adds complexity adjustment)
6. Add Allocation History → Test independently → Deploy/Demo (adds historical tracking)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (conservative allocation) - T016-T025
   - **Developer B**: User Story 2 (moderate allocation) - T026-T029
   - **Developer C**: User Story 3 (aggressive allocation) - T030-T034
   - **Developer D**: User Story 4 (complexity) - T035-T039
3. Stories complete and integrate independently
4. History feature (T040-T045) can start once US1 is complete
5. Polish tasks (T046-T054) distributed across team

---

## Task Count Summary

- **Total Tasks**: 54
- **Setup (Phase 1)**: 4 tasks
- **Foundational (Phase 2)**: 11 tasks (CRITICAL PATH)
- **User Story 1 (Phase 3)**: 10 tasks (MVP)
- **User Story 2 (Phase 4)**: 4 tasks
- **User Story 3 (Phase 5)**: 5 tasks
- **User Story 4 (Phase 6)**: 5 tasks
- **Allocation History (Phase 7)**: 6 tasks
- **Polish (Phase 8)**: 9 tasks

### Independent Test Criteria

- **US1**: Create low risk tolerance profile → Verify 60-80% bonds, 20-40% equity
- **US2**: Create moderate risk profile → Verify ~50/50 split with adjustments
- **US3**: Create high risk profile → Verify 70-100% equity with capacity caps
- **US4**: Create same profile with different experience → Verify holdings count changes (3-5 vs 7-10)
- **History**: Create multiple profiles → Verify all allocations stored and retrievable

### MVP Scope Recommendation

**Minimum Viable Product = User Story 1 only** (Tasks T001-T025)
- Validates entire technical architecture
- Delivers value to conservative investors (largest user segment)
- Tests core allocation engine logic
- Establishes foundation for incremental additions
- ~25 tasks total for complete MVP

---

## Notes

- [P] tasks = different files or independent functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are optional per POC constitution - manual testing sufficient
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution compliance: Speed over perfection, manual testing, existing tech stack only
