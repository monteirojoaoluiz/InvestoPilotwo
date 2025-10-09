/**
 * Pyodide Portfolio Optimizer
 * Uses Pyodide to run Python/CVXPY optimization in Node.js backend
 */
import { loadPyodide, PyodideInterface } from "pyodide";

import {
  ETFData,
  OptimizationParams,
  PortfolioStatistics,
  OptimizedPortfolio,
  GeographicRegion,
  IndustryExclusion,
} from "../shared/portfolio-types";
import {
  computePortfolioVolatility,
  computePortfolioReturn,
} from "./portfolioStatistics";

let pyodideInstance: PyodideInterface | null = null;
let isInitializing = false;
let initializationPromise: Promise<PyodideInterface> | null = null;

/**
 * Initialize Pyodide and install required packages
 */
async function initializePyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  isInitializing = true;
  initializationPromise = (async () => {
    console.log("Initializing Pyodide...");
    // For Node.js, we need to use the node_modules path
    // Pyodide will auto-detect and use the correct path
    const pyodide = await loadPyodide();

    console.log("Loading Python packages...");
    await pyodide.loadPackage(["numpy", "scipy"]);

    // Load micropip to install cvxpy
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    console.log("Installing CVXPY...");
    await micropip.install("cvxpy");

    console.log("Pyodide initialization complete!");
    pyodideInstance = pyodide;
    isInitializing = false;
    return pyodide;
  })();

  return initializationPromise;
}

/**
 * Optimize portfolio using CVXPY via Pyodide
 */
export async function optimizePortfolioWithPyodide(
  etfs: ETFData[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): Promise<OptimizedPortfolio> {
  const pyodide = await initializePyodide();

  const n = etfs.length;
  if (n === 0) {
    throw new Error("No ETFs available for optimization");
  }

  // Prepare data for Python
  const pythonCode = generateOptimizationCode(
    etfs,
    stats,
    params,
    industryExclusions,
  );

  try {
    // Run optimization in Python
    console.log("Running CVXPY optimization...");
    const result = await pyodide.runPythonAsync(pythonCode);

    // Parse results
    const weights = result.toJs();
    const weightsArray = Array.from(weights) as number[];

    // Build optimized portfolio
    return buildOptimizedPortfolio(
      etfs,
      weightsArray,
      stats,
      params,
      industryExclusions,
    );
  } catch (error) {
    console.error("CVXPY optimization failed:", error);
    throw new Error(`Portfolio optimization failed: ${error}`);
  }
}

/**
 * Generate Python code for CVXPY optimization
 */
function generateOptimizationCode(
  etfs: ETFData[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): string {
  const n = etfs.length;
  const regions: GeographicRegion[] = [
    "NL",
    "EU_EX_NL",
    "US",
    "DEV_EX_US_EU",
    "EM",
  ];

  // Convert data to Python-compatible format
  const mu = JSON.stringify(stats.expectedReturns);
  const sigma = JSON.stringify(stats.covarianceMatrix);
  const fees = JSON.stringify(stats.feePenalties);
  const illiq = JSON.stringify(stats.liquidityPenalties);
  const regionMatrix = JSON.stringify(stats.regionMatrix);
  const targetRegions = JSON.stringify(
    regions.map((r) => params.targetRegionMix[r]),
  );

  // Region allowed mask (1 for allowed regions, 0 for others)
  const regionAllowed = etfs.map((etf) => {
    const selectedRegions = regions.filter(
      (r) => params.targetRegionMix[r] > 0,
    );
    if (selectedRegions.length === 0) return 1; // All allowed if none selected

    // Check if ETF has exposure to any selected region
    return selectedRegions.some((region) => etf.regionExposure[region] > 0.1)
      ? 1
      : 0;
  });
  const regionAllowedStr = JSON.stringify(regionAllowed);

  // Industry exclusion matrix
  const hasExclusions = stats.industryExclusionMatrix.length > 0;
  const exclusionMatrix = hasExclusions
    ? JSON.stringify(stats.industryExclusionMatrix)
    : "[]";
  const epsilon = params.exclusionThreshold;

  // Parameters
  const lambda = params.riskAversion;
  const alpha = params.feePenalty;
  const beta = params.regionPenalty;
  const gamma = params.liquidityPenalty;
  const sigmaStarSquared = params.targetVolatility ** 2;
  const maxWeight = params.maxWeight;

  return `
import numpy as np
import cvxpy as cp

# Input data
n = ${n}
mu = np.array(${mu})
Sigma = np.array(${sigma})
fee = np.array(${fees})
illiq = np.array(${illiq})
A_reg = np.array(${regionMatrix})
t_reg = np.array(${targetRegions})
region_allowed = np.array(${regionAllowedStr})

# Parameters
lam = ${lambda}
alpha = ${alpha}
beta = ${beta}
gamma = ${gamma}
sigma_star_sq = ${sigmaStarSquared}
max_w = ${maxWeight}

# Decision variable
w = cp.Variable(n, nonneg=True)

# Objective function
objective = (
    mu @ w
    - lam * cp.quad_form(w, Sigma)
    - alpha * (fee @ w)
    - beta * cp.sum_squares(A_reg @ w - t_reg)
    - gamma * (illiq @ w)
)

# Constraints
constraints = [
    cp.sum(w) == 1,                      # Weights sum to 1
    cp.quad_form(w, Sigma) <= sigma_star_sq,  # Volatility cap
    w <= max_w,                          # Max single position
]

# Region whitelist constraint
constraints.append(w <= region_allowed)

# Industry exclusion constraints
${
  hasExclusions
    ? `
A_excl = np.array(${exclusionMatrix})
epsilon = ${epsilon}
for i in range(A_excl.shape[0]):
    constraints.append(A_excl[i] @ w <= epsilon)
`
    : ""
}

# Solve
prob = cp.Problem(cp.Maximize(objective), constraints)
prob.solve(solver=cp.OSQP, verbose=False)

# Return weights
if prob.status in ['optimal', 'optimal_inaccurate']:
    result = w.value
else:
    raise Exception(f"Optimization failed with status: {prob.status}")

result
`;
}

/**
 * Build OptimizedPortfolio from weights
 */
function buildOptimizedPortfolio(
  etfs: ETFData[],
  weights: number[],
  stats: PortfolioStatistics,
  params: OptimizationParams,
  industryExclusions: IndustryExclusion[],
): OptimizedPortfolio {
  // Filter out near-zero weights
  const threshold = 0.005; // 0.5% minimum
  const filteredIndices = weights
    .map((w, i) => ({ weight: w, index: i }))
    .filter((item) => item.weight >= threshold)
    .sort((a, b) => b.weight - a.weight);

  // Apply cardinality constraint
  const maxETFs = params.maxETFs;
  const selectedIndices = filteredIndices.slice(
    0,
    Math.min(maxETFs, filteredIndices.length),
  );

  // Renormalize
  const totalWeight = selectedIndices.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  const finalWeights = selectedIndices.map((item) => item.weight / totalWeight);
  const finalETFs = selectedIndices.map((item) => etfs[item.index]);

  // Compute portfolio metrics
  const expectedReturn = computePortfolioReturn(
    finalWeights,
    selectedIndices.map((item) => stats.expectedReturns[item.index]),
  );
  const expectedVolatility = computePortfolioVolatility(
    finalWeights,
    extractSubmatrix(
      stats.covarianceMatrix,
      selectedIndices.map((item) => item.index),
    ),
  );
  const sharpeRatio = expectedReturn / expectedVolatility;

  // Compute region exposure
  const regions: GeographicRegion[] = [
    "NL",
    "EU_EX_NL",
    "US",
    "DEV_EX_US_EU",
    "EM",
  ];
  const regionExposure: Record<GeographicRegion, number> = {
    NL: 0,
    EU_EX_NL: 0,
    US: 0,
    DEV_EX_US_EU: 0,
    EM: 0,
  };

  for (let i = 0; i < finalETFs.length; i++) {
    for (const region of regions) {
      regionExposure[region] +=
        finalWeights[i] * finalETFs[i].regionExposure[region];
    }
  }

  // Compute total fees
  const totalFees = finalWeights.reduce(
    (sum, w, i) => sum + w * finalETFs[i].ter,
    0,
  );

  // Build ETF details
  const etfDetails = finalETFs.map((etf, i) => ({
    ticker: etf.ticker,
    name: etf.name,
    weight: finalWeights[i],
    expectedReturn: stats.expectedReturns[selectedIndices[i].index],
    volatility: Math.sqrt(
      stats.covarianceMatrix[selectedIndices[i].index][
        selectedIndices[i].index
      ],
    ),
    ter: etf.ter,
  }));

  return {
    tickers: finalETFs.map((e) => e.ticker),
    weights: finalWeights,
    expectedReturn,
    expectedVolatility,
    sharpeRatio,
    regionExposure,
    totalFees,
    constraints: {
      excludedIndustries: industryExclusions,
      volatilityCap: params.targetVolatility,
      maxETFs: params.maxETFs,
      targetRegions: regions.filter((r) => params.targetRegionMix[r] > 0),
    },
    etfDetails,
  };
}

/**
 * Extract submatrix for selected indices
 */
function extractSubmatrix(matrix: number[][], indices: number[]): number[][] {
  return indices.map((i) => indices.map((j) => matrix[i][j]));
}

/**
 * Warm up Pyodide (call at server startup)
 */
export async function warmupPyodide(): Promise<void> {
  console.log("Warming up Pyodide for portfolio optimization...");
  await initializePyodide();
  console.log("Pyodide ready!");
}
