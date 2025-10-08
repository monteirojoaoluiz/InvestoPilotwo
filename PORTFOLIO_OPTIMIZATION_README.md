# Portfolio Optimization System

## Overview

This system implements **modern portfolio theory** and **convex optimization** to generate efficient, personalized investment portfolios based on user risk assessments. It uses **CVXPY** (via Pyodide) running on the Node.js backend to solve the portfolio optimization problem.

## Architecture

### Files Created

#### Backend (Server)
- **`shared/portfolio-types.ts`** - TypeScript type definitions for ETF data, optimization parameters, and results
- **`server/portfolioMapping.ts`** - Maps risk assessment answers to optimization parameters
- **`server/portfolioStatistics.ts`** - Computes expected returns, covariance matrices, and constraint matrices
- **`server/portfolioOptimizerPyodide.ts`** - CVXPY-based portfolio optimizer using Pyodide
- **`server/etfDatabase.ts`** - Sample ETF database with real-world characteristics
- **`server/routes.ts`** - API endpoint `/api/portfolio/optimize` for portfolio generation

#### Frontend (Client)
- **`client/src/components/OptimizedPortfolio.tsx`** - Portfolio visualization component
- **`client/src/pages/portfolio-optimization.tsx`** - Portfolio optimization page

## Mathematical Formulation

### Objective Function

The optimizer **maximizes** the following objective:

```
max  μ'w - λ·w'Σw - α·fee'w - β·||A_reg·w - t_reg||² - γ·illiq'w
 w
```

Where:
- **μ** = expected excess returns (annual, after shrinkage)
- **w** = portfolio weights (decision variables)
- **λ** = risk aversion parameter (0.5 to 2.5, based on risk score)
- **Σ** = covariance matrix (Ledoit-Wolf shrinkage)
- **α** = fee penalty weight (default: 1.0)
- **fee** = total expense ratios (TER)
- **β** = region deviation penalty (default: 10.0)
- **A_reg** = region exposure matrix (5 regions × n ETFs)
- **t_reg** = target region mix
- **γ** = liquidity penalty (default: 2.0)
- **illiq** = illiquidity scores

### Constraints

1. **Budget**: `Σw_i = 1` (weights sum to 100%)
2. **Long-only**: `w_i ≥ 0` (no short selling)
3. **Volatility cap**: `√(w'Σw) ≤ σ*` (target risk level)
4. **Position size**: `0 ≤ w_i ≤ 0.40` (max 40% per ETF)
5. **Geographic**: `w ≤ region_allowed` (only selected regions)
6. **Industry exclusions**: `A_excl·w ≤ ε` (max 0.5% exposure to excluded industries)
7. **Cardinality**: `card(w) ≤ K` (max 3-10 ETFs based on experience)

## Risk Profile Mapping

### 1. Risk Score Computation

```typescript
risk_score = 0.40 × risk_tolerance 
           + 0.30 × risk_capacity
           + 0.20 × investment_horizon
           + 0.10 × investor_experience
```

All inputs are normalized to 0-100 scale.

### 2. Parameter Derivation

| Parameter | Formula | Range |
|-----------|---------|-------|
| Target Volatility (σ*) | `5% + 0.15 × (risk_score/100)` | 5% - 20% |
| Max ETFs (K) | `round(3 + 7 × (experience/100))` | 3 - 10 |
| Risk Aversion (λ) | `2.0 × (1 - risk_score/100) + 0.5` | 0.5 - 2.5 |

### 3. Risk Capacity Factors

Computed from financial situation:
- **Income stability**: ±20 points
- **Emergency fund**: ±25 points  
- **Debt level**: ±25 points
- **Income range**: ±15 points

## Statistical Methods

### Covariance Estimation

Uses **Ledoit-Wolf shrinkage** to improve stability:

```
Σ_shrunk = δ·Σ_target + (1-δ)·Σ_sample
```

Where `Σ_target` is a constant-correlation model and δ = 0.4.

### Expected Returns

Two approaches:
1. **Grand-mean shrinkage** (default): Historical mean shrunk toward market average
2. **Black-Litterman** (optional): Equilibrium returns with "views" based on risk score

### Liquidity Penalty

```
illiq_i = 0.5 × (1 - log(AUM_i + 1) / log(10000))
        + 0.5 × spread_i × 100
```

## ETF Universe

Sample database includes:
- **US Equity**: VUSA, CSPX, ESGV
- **European Equity**: VEUR, MEUD, AEX
- **Emerging Markets**: VFEM, EIMI
- **Developed ex-US/EU**: VJPN, VAPX
- **Global**: VWRL, IWDA
- **Bonds**: AGGH, IEAG

Each ETF has:
- Historical returns (60+ months)
- Regional exposure breakdown
- Industry exposures
- Liquidity metrics (AUM, spread, volume)
- ESG compliance flag

## API Usage

### Endpoint

```
POST /api/portfolio/optimize
```

### Authentication

Requires authenticated session (via cookie).

### Prerequisites

User must have completed risk assessment (`/api/risk-assessment`).

### Response

```json
{
  "id": "uuid",
  "userId": "uuid",
  "riskAssessmentId": "uuid",
  "allocations": [
    {
      "ticker": "VUSA",
      "name": "Vanguard S&P 500 UCITS ETF",
      "percentage": 35.5,
      "assetType": "equity"
    }
  ],
  "totalValue": 0,
  "totalReturn": 612,
  "optimization": {
    "expectedReturn": 0.0612,
    "expectedVolatility": 0.1085,
    "sharpeRatio": 0.56,
    "regionExposure": {
      "US": 0.45,
      "EU_EX_NL": 0.25,
      "DEV_EX_US_EU": 0.20,
      "EM": 0.10,
      "NL": 0.00
    },
    "totalFees": 0.0014,
    "constraints": {
      "excludedIndustries": ["TOBACCO", "FOSSIL_FUELS"],
      "volatilityCap": 0.12,
      "maxETFs": 6,
      "targetRegions": ["US", "EU_EX_NL", "DEV_EX_US_EU", "EM"]
    }
  }
}
```

## Frontend Integration

### Usage Example

```tsx
import PortfolioOptimizationPage from '@/pages/portfolio-optimization';

// In your router:
<Route path="/portfolio/optimize" element={<PortfolioOptimizationPage />} />
```

### Component Features

- Triggers optimization with loading state
- Displays portfolio metrics (return, risk, Sharpe ratio)
- Shows allocation breakdown with visual progress bars
- Geographic exposure chart
- Cost breakdown
- Constraint summary with ESG exclusions
- Disclaimer and risk warnings

## Performance Considerations

### Pyodide Initialization

- Loads ~50MB of WebAssembly on first use
- Cached after initial load (~30-60 seconds)
- Subsequent optimizations are fast (~1-2 seconds)
- Server startup triggers async warm-up

### Optimization Speed

- **Simple problem** (10 ETFs, no exclusions): ~1s
- **Complex problem** (15 ETFs, multiple constraints): ~2-3s
- Uses OSQP solver (fast, production-ready)

### Caching Strategy

Consider caching:
- ETF historical data (update weekly)
- Covariance matrices (recompute monthly)
- Optimization results (refresh quarterly or on profile change)

## Testing & Validation

### Unit Tests (Recommended)

```typescript
// Test risk score computation
expect(computeRiskScore({
  riskTolerance: 70,
  riskCapacity: 60,
  investmentHorizon: 80,
  investorExperience: 50,
})).toEqual({ overall: 67, ... });

// Test parameter mapping
const params = mapRiskProfileToParams(riskProfile);
expect(params.targetVolatility).toBeGreaterThan(0.05);
expect(params.maxETFs).toBeGreaterThanOrEqual(3);
```

### Integration Tests

1. Complete risk assessment
2. Call `/api/portfolio/optimize`
3. Verify response contains valid portfolio
4. Check constraints are satisfied
5. Validate portfolio sums to 100%

### Edge Cases

- No ETFs match criteria → Return 400 with message
- Very conservative profile → Bond-heavy allocation
- Very aggressive profile → Equity-focused
- Single region selected → 100% in that region
- All industries excluded → ESG-only funds

## Deployment Considerations

### Environment Variables

Ensure these are set:
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL)
- Session secrets, etc.

### Production Optimizations

1. **Preload Pyodide**: Initialized at server startup
2. **Database indexes**: On `userId`, `riskAssessmentId`
3. **Rate limiting**: Limit optimization requests (computationally expensive)
4. **Monitoring**: Log optimization times and failures

### Scaling

For high traffic:
- Consider worker pool for Pyodide instances
- Queue optimization requests
- Cache common profiles
- Use read replicas for ETF data

## Future Enhancements

### Short-term
- [ ] Add transaction cost modeling for rebalancing
- [ ] Support custom ETF selection
- [ ] Multi-currency portfolios
- [ ] Tax-loss harvesting suggestions

### Medium-term
- [ ] Factor-based portfolio construction
- [ ] Monte Carlo simulations for risk visualization
- [ ] Backtesting with historical data
- [ ] Robo-advisor chat integration

### Long-term
- [ ] Real-time portfolio monitoring
- [ ] Automatic rebalancing triggers
- [ ] Options for tactical tilts
- [ ] Machine learning for return forecasting

## References

1. **Markowitz, H. (1952)** - "Portfolio Selection", Journal of Finance
2. **Ledoit & Wolf (2004)** - "Honey, I Shrunk the Sample Covariance Matrix"
3. **Black & Litterman (1992)** - "Global Portfolio Optimization"
4. **Diamond & Boyd (2016)** - "CVXPY: A Python-Embedded Modeling Language"

## License

MIT License - See LICENSE file for details.

## Support

For questions or issues:
- Open GitHub issue
- Contact: [your-email]
- Documentation: [wiki-link]
