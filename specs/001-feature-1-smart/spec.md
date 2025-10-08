# Feature Specification: Smart Asset Allocation

**Feature Branch**: `001-feature-1-smart`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "Feature 1: Smart Asset Allocation - Determines the optimal split between stocks, bonds, and other assets"

## Clarifications

### Session 2025-10-08

- Q: What investment horizon thresholds determine equity adjustments? → A: Short (<5 yrs): +0%; Medium (5-15 yrs): +10%; Long (15+ yrs): +20%
- Q: How should the remaining percentage (after stocks + bonds) be allocated between cash and other assets? → A: User chooses cash/other split during profile setup
- Q: Confirm the maximum equity allocation for each risk capacity level. → A: Low: 60% max, Medium: 80% max, High: 100% max
- Q: How should the system handle exact boundary values (33, 66)? → A: Interpolate: average the two bands' allocations
- Q: Should the system maintain historical allocation recommendations? → A: Keep history: store all allocations with timestamps

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Asset Allocation for Conservative Investor (Priority: P1)

A user with low risk tolerance (score 0-33) completes their investor profile and receives a portfolio recommendation heavily weighted toward bonds with minimal equity exposure.

**Why this priority**: This is the foundational use case that demonstrates the core allocation logic. Without this working, the feature delivers no value.

**Independent Test**: Can be fully tested by creating an investor profile with low risk tolerance (e.g., score 20), short investment horizon, and low risk capacity, then verifying the system recommends 60-80% bonds and minimal equity exposure.

**Acceptance Scenarios**:

1. **Given** a user has risk tolerance score of 25, **When** they request asset allocation, **Then** the system recommends 70-80% bonds, 20-30% equity
2. **Given** a user has risk tolerance score of 10 and low risk capacity, **When** they request allocation, **Then** equity allocation is capped at 20% maximum regardless of other factors
3. **Given** a user has risk tolerance score of 30 and long investment horizon (20+ years), **When** they request allocation, **Then** equity allocation is increased by 10-15 percentage points from base allocation

---

### User Story 2 - Generate Asset Allocation for Moderate Risk Investor (Priority: P2)

A user with moderate risk tolerance (score 34-66) receives a balanced portfolio recommendation with roughly equal splits between equity and bonds.

**Why this priority**: This represents the middle-ground use case and tests the system's ability to balance competing factors. It's independent from conservative allocation logic.

**Independent Test**: Can be fully tested by creating an investor profile with moderate risk tolerance (e.g., score 50), medium investment horizon, and moderate risk capacity, then verifying the system recommends 40-60% equity and 40-60% bonds.

**Acceptance Scenarios**:

1. **Given** a user has risk tolerance score of 50, **When** they request asset allocation, **Then** the system recommends approximately 50% equity, 50% bonds
2. **Given** a user has risk tolerance score of 45 and medium investment horizon (10-15 years), **When** they request allocation, **Then** equity allocation is increased by 5-10 percentage points
3. **Given** a user has risk tolerance score of 60 but low risk capacity, **When** they request allocation, **Then** equity allocation is reduced by 10-20 percentage points to respect capacity constraints

---

### User Story 3 - Generate Asset Allocation for Aggressive Investor (Priority: P3)

A user with high risk tolerance (score 67-100) receives an equity-focused portfolio recommendation with minimal or no bond allocation.

**Why this priority**: This tests the upper boundary of the allocation logic. While important, it's less common than conservative/moderate profiles and can be validated independently.

**Independent Test**: Can be fully tested by creating an investor profile with high risk tolerance (e.g., score 85), long investment horizon, and high risk capacity, then verifying the system recommends 70-100% equity with minimal/no bonds.

**Acceptance Scenarios**:

1. **Given** a user has risk tolerance score of 85, **When** they request asset allocation, **Then** the system recommends 80-90% equity, 10-20% bonds or 0% bonds
2. **Given** a user has risk tolerance score of 95 and very long investment horizon (30+ years), **When** they request allocation, **Then** the system recommends 90-100% equity
3. **Given** a user has risk tolerance score of 75 but low risk capacity, **When** they request allocation, **Then** equity allocation is capped at 60% maximum

---

### User Story 4 - Adjust Portfolio Complexity by Experience Level (Priority: P4)

The system adjusts the number of holdings and portfolio structure based on the user's investment experience level, with beginners receiving simpler portfolios.

**Why this priority**: This enhances usability but isn't critical for the core allocation functionality. Can be implemented after basic allocation logic works.

**Independent Test**: Can be fully tested by generating allocations for two identical risk profiles but different experience levels, then verifying beginners receive 3-5 holdings while experienced investors receive 7-10 holdings.

**Acceptance Scenarios**:

1. **Given** a beginner investor with moderate risk profile, **When** they request allocation, **Then** the system recommends 3-5 total holdings (e.g., 1-2 stock funds, 1-2 bond funds, 1 cash/other)
2. **Given** an experienced investor with moderate risk profile, **When** they request allocation, **Then** the system recommends 7-10 total holdings with more granular asset class breakdown
3. **Given** a beginner investor with high risk profile, **When** they request allocation, **Then** the system limits portfolio to simple, broad-market holdings rather than sector-specific investments

---

### Edge Cases

- What happens when risk tolerance is at exact boundary values (33, 66)? System interpolates by averaging the allocation percentages of both adjacent bands (e.g., score 33 averages Low and Moderate band allocations).
- What happens when investment horizon conflicts with risk capacity (e.g., long horizon but low capacity)? Risk capacity takes priority as the limiting factor.
- What happens when experience level is "none" or "expert"? Use default complexity levels (3 holdings for none, 10+ for expert).
- What happens when user has zero risk tolerance? System should recommend 100% cash/money market with warning that returns will be minimal.
- What happens when calculated equity allocation exceeds 100% or goes below 0%? System must cap at 0-100% boundaries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate base asset allocation percentages based on user's risk tolerance score (0-100 scale)
- **FR-002**: System MUST apply three allocation bands: Low risk (0-33) recommends 60-80% bonds with 20-40% equity; Moderate risk (34-66) recommends 40-60% equity with 40-60% bonds; High risk (67-100) recommends 70-100% equity with 0-30% bonds
- **FR-003**: System MUST adjust equity allocation upward based on investment horizon: Short (<5 years) adds 0%, Medium (5-15 years) adds 10%, Long (15+ years) adds 20%
- **FR-004**: System MUST enforce risk capacity as a hard constraint that caps maximum equity allocation: Low capacity limits equity to 60%, Medium capacity to 80%, High capacity to 100%
- **FR-005**: System MUST adjust portfolio complexity based on user experience level, with beginners receiving 3-5 holdings and experienced investors receiving 7-10+ holdings
- **FR-006**: System MUST ensure all allocation percentages sum to exactly 100%
- **FR-007**: System MUST generate allocation recommendations that include specific asset class percentages (stocks, bonds, cash, other) where the remainder after stocks and bonds is split between cash and other assets according to user's preference specified in their profile
- **FR-008**: System MUST store all generated allocation recommendations with timestamps, maintaining complete history for each user profile
- **FR-009**: System MUST allow users to view their current allocation recommendation as well as access historical allocations
- **FR-010**: System MUST recalculate and create a new allocation entry (preserving previous ones) when user updates their investor profile (risk tolerance, horizon, capacity, or experience)

### Key Entities

- **Asset Allocation**: Represents the recommended portfolio split for a user, including percentages for stocks, bonds, cash, and other assets; total complexity score; and timestamp of generation
- **Investor Profile**: Contains user's risk tolerance score (0-100), investment horizon (years), risk capacity level (low/medium/high), experience level (beginner/intermediate/experienced/expert), and preference for cash vs. other assets allocation (percentage split)
- **Allocation Rule**: Defines the logic mapping risk profiles to asset class percentages, including base allocations, horizon adjustments, and capacity constraints

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive asset allocation recommendation within 2 seconds of completing their investor profile
- **SC-002**: 100% of generated allocations respect risk capacity constraints (low capacity limits equity to max 60%, medium to 80%, high to 100%)
- **SC-003**: Allocation percentages always sum to exactly 100% with no rounding errors visible to users
- **SC-004**: Beginner investors receive portfolios with 3-5 holdings while experienced investors receive 7-10 holdings, as measured by the number of recommended positions
- **SC-005**: 90% of users understand their allocation recommendation without requiring additional explanation or support
- **SC-006**: All allocation recommendations align with stated risk tolerance band (low/moderate/high) within defined percentage ranges

## Assumptions

1. **Risk tolerance measurement**: Assume risk tolerance score (0-100) is already calculated by a separate profiling system/questionnaire
2. **Investment horizon input**: Assume users provide investment horizon in years (e.g., 5, 10, 20, 30 years)
3. **Risk capacity levels**: Assume three discrete levels (low/medium/high) rather than continuous scale
4. **Experience levels**: Assume four levels (beginner/intermediate/experienced/expert) based on self-reported or assessed experience
5. **Asset classes**: Assume recommendations cover four primary asset classes: stocks (equity), bonds (fixed income), cash/money market, and other (alternatives, real estate, etc.)
6. **Rebalancing**: Asset allocation is static recommendation at point in time; automatic rebalancing is out of scope
7. **Currency**: All allocations are currency-agnostic (percentages only, no dollar amounts)
8. **Tax considerations**: Tax-advantaged vs taxable account optimization is out of scope
9. **Specific securities**: Recommendations are at asset class level, not specific ETFs/mutual funds/stocks
10. **Performance guarantees**: System provides recommendations only, with no guarantee of returns or performance

## Dependencies

- Investor profile data (risk tolerance, horizon, capacity, experience) must be collected and stored before allocation can be generated
- Risk scoring system must be operational to provide 0-100 risk tolerance scores

## Out of Scope

- Specific security/fund selection (e.g., recommending "VTI" or "BND" ETFs)
- Portfolio rebalancing automation
- Tax-loss harvesting or tax optimization
- Real-time market data integration
- Portfolio performance tracking
- Historical backtesting of allocation strategies
- Allocation recommendations for non-standard asset classes (cryptocurrency, commodities, private equity)
- Multi-goal portfolio management (retirement vs. house down payment)
