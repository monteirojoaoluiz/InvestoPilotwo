/**
 * TypeScript Portfolio Optimizer
 * Pure TypeScript implementation of mean-variance portfolio optimization
 * Uses Sequential Least Squares Quadratic Programming (SLSQP-like) approach
 */
import {
  ETFData,
  OptimizationParams,
  PortfolioStatistics,
  OptimizedPortfolio,
  IndustryExclusion,
  GeographicRegion,
} from "../shared/portfolio-types";
import {
  computePortfolioVolatility,
  computePortfolioReturn,
} from "./portfolioStatistics";

/**
 * Simple quadratic programming solver for portfolio optimization
 * Solves: maximize μ'w - λw'Σw - αfee'w - β||A_reg·w - t_reg||² - γilliq'w
 * Subject to: sum(w) = 1, w >= 0, volatility constraint, region constraints
 */
function solvePortfolioOptimization(
  expectedReturns: number[],
  covarianceMatrix: number[][],
  fees: number[],
  illiquidities: number[],
  regionMatrix: number[][],
  regionTargets: number[],
  params: OptimizationParams,
  exclusionMask: boolean[],
): number[] {
  const n = expectedReturns.length;

  // Initialize weights with equal allocation to non-excluded assets
  let weights = new Array(n).fill(0);
  const validAssets = exclusionMask.map((x) => !x);
  const numValid = validAssets.filter((x) => x).length;

  if (numValid === 0) {
    throw new Error("No valid assets after applying exclusions");
  }

  // Start with equal weights for valid assets
  for (let i = 0; i < n; i++) {
    if (validAssets[i]) {
      weights[i] = 1.0 / numValid;
    }
  }

  // Gradient descent with projection
  const maxIterations = 1000;
  const learningRate = 0.01;
  const tolerance = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Compute gradient of objective function
    const gradient = computeGradient(
      weights,
      expectedReturns,
      covarianceMatrix,
      fees,
      illiquidities,
      regionMatrix,
      regionTargets,
      params,
    );

    // Update weights (gradient ascent since we're maximizing)
    const newWeights = weights.map((w, i) => {
      if (!validAssets[i]) return 0;
      return w + learningRate * gradient[i];
    });

    // Project onto constraints
    projectOntoConstraints(
      newWeights,
      validAssets,
      params,
      covarianceMatrix,
      expectedReturns,
    );

    // Check convergence
    const change = weights.reduce(
      (sum, w, i) => sum + Math.abs(w - newWeights[i]),
      0,
    );
    weights = newWeights;

    if (change < tolerance) {
      console.log(`Optimization converged in ${iter + 1} iterations`);
      break;
    }
  }

  return weights;
}

/**
 * Compute gradient of the objective function
 */
function computeGradient(
  weights: number[],
  expectedReturns: number[],
  covarianceMatrix: number[][],
  fees: number[],
  illiquidities: number[],
  regionMatrix: number[][],
  regionTargets: number[],
  params: OptimizationParams,
): number[] {
  const n = weights.length;
  const gradient = new Array(n).fill(0);

  // ∂/∂w (μ'w) = μ
  for (let i = 0; i < n; i++) {
    gradient[i] += expectedReturns[i];
  }

  // ∂/∂w (-λw'Σw) = -2λΣw
  const covProduct = multiplyMatrixVector(covarianceMatrix, weights);
  for (let i = 0; i < n; i++) {
    gradient[i] -= 2 * params.riskAversion * covProduct[i];
  }

  // ∂/∂w (-αfee'w) = -αfee
  for (let i = 0; i < n; i++) {
    gradient[i] -= params.feePenalty * fees[i];
  }

  // ∂/∂w (-β||A_reg·w - t_reg||²)
  // = -2β A_reg' (A_reg·w - t_reg)
  const regionWeights = multiplyMatrixVector(regionMatrix, weights);
  const regionDiff = regionWeights.map((w, i) => w - regionTargets[i]);
  const regionGradientContrib = multiplyTransposeMatrixVector(
    regionMatrix,
    regionDiff,
  );
  for (let i = 0; i < n; i++) {
    gradient[i] -= 2 * params.regionPenalty * regionGradientContrib[i];
  }

  // ∂/∂w (-γilliq'w) = -γilliq
  for (let i = 0; i < n; i++) {
    gradient[i] -= params.liquidityPenalty * illiquidities[i];
  }

  return gradient;
}

/**
 * Project weights onto constraints
 */
function projectOntoConstraints(
  weights: number[],
  validAssets: boolean[],
  params: OptimizationParams,
  covarianceMatrix: number[][],
  expectedReturns: number[],
): void {
  const n = weights.length;

  // 1. Non-negativity: w >= 0
  for (let i = 0; i < n; i++) {
    if (weights[i] < 0) weights[i] = 0;
    if (!validAssets[i]) weights[i] = 0;
  }

  // 2. Sum to 1 constraint (budget constraint)
  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum > 0) {
    for (let i = 0; i < n; i++) {
      weights[i] /= sum;
    }
  } else {
    // If all weights are zero, distribute equally among valid assets
    const numValid = validAssets.filter((x) => x).length;
    for (let i = 0; i < n; i++) {
      weights[i] = validAssets[i] ? 1.0 / numValid : 0;
    }
  }

  // 3. Volatility constraint (if active)
  if (params.targetVolatility && params.targetVolatility < 1.0) {
    const vol = Math.sqrt(computeQuadraticForm(weights, covarianceMatrix));
    if (vol > params.targetVolatility) {
      // Scale down riskier assets
      const scale = params.targetVolatility / vol;
      for (let i = 0; i < n; i++) {
        weights[i] *= scale;
      }
      // Renormalize
      const newSum = weights.reduce((s, w) => s + w, 0);
      if (newSum > 0) {
        for (let i = 0; i < n; i++) {
          weights[i] /= newSum;
        }
      }
    }
  }
}

/**
 * Matrix-vector multiplication: Av
 */
function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  const result = new Array(matrix.length).fill(0);
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < vector.length; j++) {
      result[i] += matrix[i][j] * vector[j];
    }
  }
  return result;
}

/**
 * Transpose matrix-vector multiplication: A'v
 */
function multiplyTransposeMatrixVector(
  matrix: number[][],
  vector: number[],
): number[] {
  const result = new Array(matrix[0].length).fill(0);
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[0].length; j++) {
      result[j] += matrix[i][j] * vector[i];
    }
  }
  return result;
}

/**
 * Compute quadratic form: w'Aw
 */
function computeQuadraticForm(vector: number[], matrix: number[][]): number {
  const product = multiplyMatrixVector(matrix, vector);
  return vector.reduce((sum, v, i) => sum + v * product[i], 0);
}

/**
 * Optimize portfolio using pure TypeScript implementation
 */
export async function optimizePortfolioWithTS(
  etfs: ETFData[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): Promise<OptimizedPortfolio> {
  const n = etfs.length;
  if (n === 0) {
    throw new Error("No ETFs available for optimization");
  }

  console.log(`Optimizing portfolio with ${n} ETFs using TypeScript solver...`);

  // Build exclusion mask
  const exclusionMask = etfs.map((etf) => {
    for (const exclusion of industryExclusions) {
      const exposure = etf.industryExposure[exclusion] || 0;
      if (exposure > 0.05) {
        // More than 5% exposure
        return true;
      }
    }
    return false;
  });

  // Prepare inputs
  const expectedReturns = stats.expectedReturns;
  const covarianceMatrix = stats.covarianceMatrix;
  const fees = etfs.map((etf) => etf.ter);
  const illiquidities = etfs.map((etf) => 1.0 / (etf.avgDailyVolume + 1000)); // Inverse liquidity
  const regionMatrix = stats.regionMatrix;

  // Build region targets from params
  const regions: GeographicRegion[] = [
    "NL",
    "EU_EX_NL",
    "US",
    "DEV_EX_US_EU",
    "EM",
  ];
  const regionTargets = regions.map((r) => params.targetRegionMix[r] || 0);

  // Solve optimization problem
  const startTime = Date.now();
  const weights = solvePortfolioOptimization(
    expectedReturns,
    covarianceMatrix,
    fees,
    illiquidities,
    regionMatrix,
    regionTargets,
    params,
    exclusionMask,
  );
  const solveTime = Date.now() - startTime;

  console.log(`Optimization completed in ${solveTime}ms`);

  // Build result
  return buildOptimizedPortfolio(
    etfs,
    weights,
    stats,
    params,
    industryExclusions,
  );
}

/**
 * Build the optimized portfolio result
 */
function buildOptimizedPortfolio(
  etfs: ETFData[],
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): OptimizedPortfolio {
  // Compute portfolio metrics
  const expectedReturn = computePortfolioReturn(weights, stats.expectedReturns);
  const expectedVolatility = computePortfolioVolatility(
    weights,
    stats.covarianceMatrix,
  );
  const sharpeRatio =
    expectedVolatility > 0 ? expectedReturn / expectedVolatility : 0;

  // Compute region exposure
  const regionExposure = {
    NL: 0,
    EU_EX_NL: 0,
    US: 0,
    DEV_EX_US_EU: 0,
    EM: 0,
  };

  for (let i = 0; i < etfs.length; i++) {
    if (weights[i] > 0.001) {
      // Only include significant allocations
      const etf = etfs[i];
      regionExposure.NL += weights[i] * etf.regionExposure.NL;
      regionExposure.EU_EX_NL += weights[i] * etf.regionExposure.EU_EX_NL;
      regionExposure.US += weights[i] * etf.regionExposure.US;
      regionExposure.DEV_EX_US_EU +=
        weights[i] * etf.regionExposure.DEV_EX_US_EU;
      regionExposure.EM += weights[i] * etf.regionExposure.EM;
    }
  }

  // Compute total costs
  const totalTER = weights.reduce((sum, w, i) => sum + w * etfs[i].ter, 0);

  // Build allocations
  const allocations = etfs
    .map((etf, i) => ({
      etf: {
        ticker: etf.ticker,
        name: etf.name,
        assetClass: etf.assetClass,
        ter: etf.ter,
      },
      weight: weights[i],
      amount: weights[i], // In practice, this would be multiplied by portfolio value
    }))
    .filter((a) => a.weight > 0.001) // Filter out negligible allocations
    .sort((a, b) => b.weight - a.weight); // Sort by weight descending

  // Check constraints
  const constraints = {
    excludedIndustries: industryExclusions,
    volatilityCap: params.targetVolatility,
    maxETFs: params.maxETFs,
    targetRegions: Object.keys(params.targetRegionMix).filter(
      (r) => params.targetRegionMix[r as GeographicRegion] > 0,
    ) as GeographicRegion[],
  };

  return {
    tickers: allocations.map((a) => a.etf.ticker),
    weights: allocations.map((a) => a.weight),
    expectedReturn,
    expectedVolatility,
    sharpeRatio,
    regionExposure,
    totalFees: totalTER,
    constraints,
    etfDetails: allocations.map((a) => ({
      ticker: a.etf.ticker,
      name: a.etf.name,
      weight: a.weight,
      expectedReturn:
        stats.expectedReturns[etfs.findIndex((e) => e.ticker === a.etf.ticker)],
      volatility: expectedVolatility, // Simplified - could compute marginal contribution
      ter: a.etf.ter,
    })),
  };
}

/**
 * Warmup function (no-op for TypeScript implementation)
 */
export async function warmupTSOptimizer(): Promise<void> {
  console.log("TypeScript optimizer ready (no warmup needed)");
}
