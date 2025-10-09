/**
 * Portfolio Statistics Module
 * Computes expected returns, covariance matrix, and constraint matrices
 */
import {
  ETFData,
  PortfolioStatistics,
  GeographicRegion,
  IndustryExclusion,
  OptimizationParams,
} from "../shared/portfolio-types";

/**
 * Compute sample mean returns from historical data
 */
function computeSampleMean(returns: number[]): number {
  if (returns.length === 0) return 0;
  return returns.reduce((sum, r) => sum + r, 0) / returns.length;
}

/**
 * Compute sample covariance matrix
 */
function computeSampleCovariance(etfs: ETFData[]): number[][] {
  const n = etfs.length;
  const minLength = Math.min(...etfs.map((e) => e.monthlyReturns.length));

  // Compute means
  const means = etfs.map((etf) =>
    computeSampleMean(etf.monthlyReturns.slice(-minLength)),
  );

  // Compute covariance matrix
  const cov: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      const returns_i = etfs[i].monthlyReturns.slice(-minLength);
      const returns_j = etfs[j].monthlyReturns.slice(-minLength);

      for (let t = 0; t < minLength; t++) {
        sum += (returns_i[t] - means[i]) * (returns_j[t] - means[j]);
      }

      cov[i][j] = sum / (minLength - 1);
    }
  }

  return cov;
}

/**
 * Ledoit-Wolf shrinkage for covariance matrix
 * Shrinks sample covariance toward constant correlation model
 */
function shrinkCovariance(sampleCov: number[][]): number[][] {
  const n = sampleCov.length;

  // Compute sample variances and average correlation
  const variances = sampleCov.map((row, i) => row[i]);
  const avgStd = Math.sqrt(variances.reduce((a, b) => a + b, 0) / n);

  // Compute average correlation
  let sumCorr = 0;
  let countCorr = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const corr =
          sampleCov[i][j] / Math.sqrt(sampleCov[i][i] * sampleCov[j][j]);
        sumCorr += corr;
        countCorr++;
      }
    }
  }
  const avgCorr = countCorr > 0 ? sumCorr / countCorr : 0.3;

  // Target matrix: constant correlation with sample variances
  const target: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        target[i][j] = variances[i];
      } else {
        target[i][j] = avgCorr * Math.sqrt(variances[i] * variances[j]);
      }
    }
  }

  // Shrinkage intensity (simplified, typically 0.3-0.5)
  const shrinkage = 0.4;

  // Shrunk covariance
  const shrunk: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      shrunk[i][j] =
        shrinkage * target[i][j] + (1 - shrinkage) * sampleCov[i][j];
    }
  }

  return shrunk;
}

/**
 * Compute expected returns using grand-mean shrinkage
 * Shrinks historical means toward the overall market mean
 */
function computeExpectedReturns(
  etfs: ETFData[],
  shrinkageIntensity: number = 0.5,
): number[] {
  const n = etfs.length;

  // Compute sample means (monthly)
  const sampleMeans = etfs.map((etf) => computeSampleMean(etf.monthlyReturns));

  // Grand mean (equal-weighted average)
  const grandMean = sampleMeans.reduce((a, b) => a + b, 0) / n;

  // Shrink toward grand mean
  const expectedReturns = sampleMeans.map(
    (mean) => shrinkageIntensity * grandMean + (1 - shrinkageIntensity) * mean,
  );

  // Annualize (12 months)
  return expectedReturns.map((r) => r * 12);
}

/**
 * Black-Litterman expected returns (simplified)
 * Uses equilibrium returns based on risk aversion and adjusts with "views"
 */
function computeBlackLittermanReturns(
  etfs: ETFData[],
  covMatrix: number[][],
  riskAversion: number,
  params: OptimizationParams,
): number[] {
  // Equilibrium market weights based on target region mix
  const equilibriumWeights = computeEquilibriumWeights(etfs, params);

  // Implied equilibrium returns: Π = λ * Σ * w_eq
  const impliedReturns = matrixVectorMultiply(
    scalarMatrixMultiply(riskAversion, covMatrix),
    equilibriumWeights,
  );

  // For now, use implied returns directly
  // In a full implementation, add "views" to adjust specific ETF expectations

  return impliedReturns;
}

/**
 * Compute equilibrium weights based on target region mix
 */
function computeEquilibriumWeights(
  etfs: ETFData[],
  params: OptimizationParams,
): number[] {
  const n = etfs.length;
  const weights = new Array(n).fill(0);

  // Score each ETF by region alignment
  const scores = etfs.map((etf) => {
    let score = 0;
    const regions: GeographicRegion[] = [
      "NL",
      "EU_EX_NL",
      "US",
      "DEV_EX_US_EU",
      "EM",
    ];
    for (const region of regions) {
      score += etf.regionExposure[region] * params.targetRegionMix[region];
    }
    return score;
  });

  // Normalize to sum to 1
  const totalScore = scores.reduce((a, b) => a + b, 0);
  if (totalScore > 0) {
    return scores.map((s) => s / totalScore);
  }

  // Fallback: equal weights
  return new Array(n).fill(1 / n);
}

/**
 * Compute liquidity penalty for each ETF
 * Higher penalty for lower AUM and higher spreads
 */
function computeLiquidityPenalty(etfs: ETFData[]): number[] {
  return etfs.map((etf) => {
    // Normalize AUM (lower AUM = higher penalty)
    const aumPenalty = Math.max(0, 1 - Math.log(etf.aum + 1) / Math.log(10000));

    // Spread penalty (higher spread = higher penalty)
    const spreadPenalty = etf.avgSpread * 100; // Convert to basis points

    return aumPenalty * 0.5 + spreadPenalty * 0.5;
  });
}

/**
 * Build region exposure matrix (5 regions x n ETFs)
 */
function buildRegionMatrix(etfs: ETFData[]): number[][] {
  const regions: GeographicRegion[] = [
    "NL",
    "EU_EX_NL",
    "US",
    "DEV_EX_US_EU",
    "EM",
  ];

  return regions.map((region) => etfs.map((etf) => etf.regionExposure[region]));
}

/**
 * Build industry exclusion matrix
 * Each row = exposure to one excluded industry
 */
function buildIndustryExclusionMatrix(
  etfs: ETFData[],
  exclusions: IndustryExclusion[],
): number[][] {
  if (exclusions.length === 0) return [];

  return exclusions.map((industry) =>
    etfs.map((etf) => etf.industryExposure[industry] || 0),
  );
}

/**
 * Main function: compute all statistics needed for optimization
 */
export function computePortfolioStatistics(
  etfs: ETFData[],
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): PortfolioStatistics {
  // Compute covariance matrix
  const sampleCov = computeSampleCovariance(etfs);
  const covarianceMatrix = shrinkCovariance(sampleCov);

  // Compute expected returns (use Black-Litterman for more sophisticated approach)
  const expectedReturns = computeExpectedReturns(etfs);
  // Alternative: const expectedReturns = computeBlackLittermanReturns(etfs, covarianceMatrix, params.riskAversion, params);

  // Compute penalties
  const feePenalties = etfs.map((etf) => etf.ter / 100); // Convert percentage to decimal
  const liquidityPenalties = computeLiquidityPenalty(etfs);

  // Build constraint matrices
  const regionMatrix = buildRegionMatrix(etfs);
  const industryExclusionMatrix = buildIndustryExclusionMatrix(
    etfs,
    industryExclusions,
  );

  return {
    expectedReturns,
    covarianceMatrix,
    feePenalties,
    liquidityPenalties,
    regionMatrix,
    industryExclusionMatrix,
  };
}

/**
 * Filter ETFs based on hard constraints
 */
export function filterETFsByConstraints(
  etfs: ETFData[],
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): ETFData[] {
  return etfs.filter((etf) => {
    // Check region constraints
    const regions: GeographicRegion[] = [
      "NL",
      "EU_EX_NL",
      "US",
      "DEV_EX_US_EU",
      "EM",
    ];
    const selectedRegions = regions.filter(
      (r) => params.targetRegionMix[r] > 0,
    );

    if (selectedRegions.length > 0) {
      // ETF must have some exposure to selected regions
      const hasExposure = selectedRegions.some(
        (region) => etf.regionExposure[region] > 0.1, // At least 10% exposure
      );
      if (!hasExposure) return false;
    }

    // Check industry exclusions (hard filter if ESG screening required)
    if (industryExclusions.length > 0 && !etf.esgCompliant) {
      // If not ESG compliant, check if it violates exclusions significantly
      for (const industry of industryExclusions) {
        if ((etf.industryExposure[industry] || 0) > 0.05) {
          return false; // More than 5% exposure to excluded industry
        }
      }
    }

    // Minimum liquidity requirements
    if (etf.aum < 50) return false; // At least €50M AUM
    if (etf.avgSpread > 0.005) return false; // Max 0.5% spread

    // Must have sufficient return history
    if (etf.monthlyReturns.length < 36) return false; // At least 3 years

    return true;
  });
}

// Helper functions for matrix operations

function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) =>
    row.reduce((sum, val, i) => sum + val * vector[i], 0),
  );
}

function scalarMatrixMultiply(scalar: number, matrix: number[][]): number[][] {
  return matrix.map((row) => row.map((val) => val * scalar));
}

/**
 * Compute portfolio volatility from weights and covariance matrix
 */
export function computePortfolioVolatility(
  weights: number[],
  covMatrix: number[][],
): number {
  // w^T * Σ * w
  let variance = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      variance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  return Math.sqrt(variance);
}

/**
 * Compute portfolio expected return from weights and expected returns
 */
export function computePortfolioReturn(
  weights: number[],
  expectedReturns: number[],
): number {
  return weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
}
