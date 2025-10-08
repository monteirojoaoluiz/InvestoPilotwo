/**
 * Profile Scoring Module
 *
 * Implements the questionnaire → profile scoring logic per specification.
 * Takes front-end questionnaire answers and computes 6 investor profile features.
 */

export interface QuestionnaireAnswers {
  lifeStage: string;
  riskTolerance: string;
  timeHorizon: string;
  geographicFocus: string[];
  esgExclusions: string[];
  incomeStability: string;
  emergencyFund: string;
  debtLevel: string;
  investmentExperience: string;
  investmentKnowledge: string;
  dividendVsGrowth: string;
  behavioralReaction: string;
  incomeRange: string;
  netWorthRange: string;
}

export interface InvestorProfile {
  risk_tolerance: number; // 0-100
  risk_capacity: number; // 0-100
  investment_horizon: number; // 0-100
  investor_experience: number; // 0-100
  regions_selected: string[]; // ["NL", "US", ...]
  industry_exclusions: string[]; // ["TOBACCO", "FOSSIL_FUELS", ...]
}

// Map front-end values to spec answer codes
const LIFE_STAGE_MAP: Record<string, string> = {
  "early-career": "A",
  "mid-career": "B",
  "nearing-retirement": "C",
  retired: "D",
};

const RISK_TOLERANCE_MAP: Record<string, string> = {
  conservative: "A",
  moderate: "B",
  aggressive: "C",
};

const TIME_HORIZON_MAP: Record<string, string> = {
  "under-3-years": "A",
  "three-to-seven-years": "B",
  "over-seven-years": "C",
};

const INCOME_STABILITY_MAP: Record<string, string> = {
  "very-stable": "A",
  "somewhat-stable": "B",
  unstable: "C",
};

const EMERGENCY_FUND_MAP: Record<string, string> = {
  yes: "A",
  partial: "B",
  no: "C",
};

const DEBT_LEVEL_MAP: Record<string, string> = {
  "low-none": "A",
  manageable: "B",
  high: "C",
};

const INVESTMENT_EXPERIENCE_MAP: Record<string, string> = {
  none: "A",
  beginner: "B",
  intermediate: "C",
  advanced: "D",
};

const INVESTMENT_KNOWLEDGE_MAP: Record<string, string> = {
  beginner: "A",
  intermediate: "B",
  advanced: "C",
};

const DIVIDEND_VS_GROWTH_MAP: Record<string, string> = {
  "dividend-focus": "A",
  balanced: "B",
  "growth-focus": "C",
};

const BEHAVIORAL_REACTION_MAP: Record<string, string> = {
  "sell-all": "A",
  "sell-some": "B",
  hold: "C",
  "buy-more": "D",
};

const INCOME_RANGE_MAP: Record<string, string> = {
  "<50k": "A",
  "50-100k": "B",
  "100-250k": "C",
  "250k+": "D",
};

const NET_WORTH_MAP: Record<string, string> = {
  "<100k": "A",
  "100-500k": "B",
  "500k-1M": "C",
  "1M+": "D",
};

// Region code mapping: front-end → backend
const REGION_MAP: Record<string, string> = {
  netherlands: "NL",
  "europe-ex-nl": "EU_EX_NL",
  "united-states": "US",
  "developed-ex-us-europe": "DEV_EX_US_EU",
  "emerging-markets": "EM",
};

// Industry code mapping: front-end → backend
const INDUSTRY_MAP: Record<string, string> = {
  tobacco: "TOBACCO",
  "fossil-fuels": "FOSSIL_FUELS",
  "defense-industry": "DEFENSE",
  gambling: "GAMBLING",
  "adult-entertainment": "ADULT",
  "non-esg-funds": "NO_ESG_SCREEN",
};

const ALL_INDUSTRY_CODES = [
  "TOBACCO",
  "FOSSIL_FUELS",
  "DEFENSE",
  "GAMBLING",
  "ADULT",
  "NO_ESG_SCREEN",
];

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute investor profile from questionnaire answers
 */
export function computeInvestorProfile(
  answers: QuestionnaireAnswers,
): InvestorProfile {
  // Map front-end codes to spec codes
  const q1 = LIFE_STAGE_MAP[answers.lifeStage] || "B";
  const q2 = RISK_TOLERANCE_MAP[answers.riskTolerance] || "B";
  const q3 = TIME_HORIZON_MAP[answers.timeHorizon] || "B";
  const q6 = INCOME_STABILITY_MAP[answers.incomeStability] || "B";
  const q7 = EMERGENCY_FUND_MAP[answers.emergencyFund] || "B";
  const q8 = DEBT_LEVEL_MAP[answers.debtLevel] || "B";
  const q9 = INVESTMENT_EXPERIENCE_MAP[answers.investmentExperience] || "B";
  const q10 = INVESTMENT_KNOWLEDGE_MAP[answers.investmentKnowledge] || "A";
  const q11 = DIVIDEND_VS_GROWTH_MAP[answers.dividendVsGrowth] || "B";
  const q12 = BEHAVIORAL_REACTION_MAP[answers.behavioralReaction] || "C";
  const q13 = INCOME_RANGE_MAP[answers.incomeRange] || "B";
  const q14 = NET_WORTH_MAP[answers.netWorthRange] || "B";

  // Q4 - Geographic regions (map to backend codes)
  const geographicFocusArray = Array.isArray(answers.geographicFocus)
    ? answers.geographicFocus
    : [];
  const regions_selected = geographicFocusArray
    .map((region) => REGION_MAP[region])
    .filter(Boolean);

  // Q5 - Industry exclusions (inverted logic: what's NOT checked = excluded)
  // Front-end sends esgExclusions as what IS excluded
  const esgExclusionsArray = Array.isArray(answers.esgExclusions)
    ? answers.esgExclusions
    : [];
  const industry_exclusions = esgExclusionsArray
    .map((industry) => INDUSTRY_MAP[industry])
    .filter(Boolean);

  // === RISK TOLERANCE ===
  let tolerance = 50; // base

  // Q2 - Feeling about market ups/downs
  if (q2 === "A") tolerance -= 30;
  else if (q2 === "C") tolerance += 30;

  // Q3 - When will you use this money?
  if (q3 === "A") tolerance -= 30;
  else if (q3 === "C") tolerance += 30;

  // Q9 - Investment experience
  if (q9 === "A") tolerance -= 10;
  else if (q9 === "C") tolerance += 10;
  else if (q9 === "D") tolerance += 20;

  // Q11 - Investor profile (dividend vs growth)
  if (q11 === "B") tolerance += 10;
  else if (q11 === "C") tolerance += 20;

  // Q12 - 20% loss reaction
  if (q12 === "A") tolerance -= 40;
  else if (q12 === "B") tolerance -= 20;
  else if (q12 === "C") tolerance += 10;
  else if (q12 === "D") tolerance += 30;

  tolerance = clamp(tolerance, 0, 100);

  // === RISK CAPACITY ===
  let capacity = 0;

  // Q1 - Financial journey (sets base)
  if (q1 === "A") capacity = 40;
  else if (q1 === "B") capacity = 70;
  else if (q1 === "C") capacity = 50;
  else if (q1 === "D") capacity = 20;

  // Q6 - Income stability
  if (q6 === "A") capacity += 40;
  else if (q6 === "B") capacity += 20;
  else if (q6 === "C") capacity -= 10;

  // Q7 - Emergency fund
  if (q7 === "A") capacity += 20;
  else if (q7 === "B") capacity += 10;

  // Q8 - Debt situation
  if (q8 === "A") capacity += 20;
  else if (q8 === "B") capacity += 10;
  else if (q8 === "C") capacity -= 20;

  // Q13 - Income range
  if (q13 === "A") capacity -= 20;
  else if (q13 === "C") capacity += 10;
  else if (q13 === "D") capacity += 20;

  // Q14 - Net worth
  if (q14 === "A") capacity -= 20;
  else if (q14 === "C") capacity += 10;
  else if (q14 === "D") capacity += 20;

  capacity = clamp(capacity, 0, 100);

  // Q7 override: if no emergency fund, capacity = 0
  if (q7 === "C") {
    capacity = 0;
  }

  // === INVESTMENT HORIZON ===
  let horizon = 0;

  // Q1 - Financial journey base
  if (q1 === "A") horizon = 70;
  else if (q1 === "B") horizon = 80;
  else if (q1 === "C") horizon = 0;
  else if (q1 === "D") horizon = 20;

  // Q3 - When will you use this money?
  let q3_horizon = 50;
  if (q3 === "A") q3_horizon = 0;
  else if (q3 === "B") q3_horizon = 50;
  else if (q3 === "C") q3_horizon = 100;

  // Weighted average: 30% Q1, 70% Q3
  horizon = 0.3 * horizon + 0.7 * q3_horizon;

  // Q11 - Investor profile adjustment
  if (q11 === "A") horizon -= 10;
  else if (q11 === "C") horizon += 10;

  horizon = clamp(horizon, 0, 100);

  // === INVESTOR EXPERIENCE ===
  let experience = 0;

  // Q9 - Investment experience (base)
  if (q9 === "A") experience = 20;
  else if (q9 === "B") experience = 40;
  else if (q9 === "C") experience = 70;
  else if (q9 === "D") experience = 100;

  // Q10 - Investment knowledge
  if (q10 === "B") experience += 10;
  else if (q10 === "C") experience += 20;

  experience = clamp(experience, 0, 100);

  return {
    risk_tolerance: Math.round(tolerance),
    risk_capacity: Math.round(capacity),
    investment_horizon: Math.round(horizon),
    investor_experience: Math.round(experience),
    regions_selected,
    industry_exclusions,
  };
}

/**
 * Validate questionnaire answers
 */
export function validateQuestionnaireAnswers(answers: QuestionnaireAnswers): {
  valid: boolean;
  error?: string;
} {
  // Ensure geographicFocus is an array
  if (!Array.isArray(answers.geographicFocus)) {
    return { valid: false, error: "geographicFocus must be an array" };
  }

  // Ensure esgExclusions is an array
  if (!Array.isArray(answers.esgExclusions)) {
    return { valid: false, error: "esgExclusions must be an array" };
  }

  // Q4 validation: must select at least one region
  if (answers.geographicFocus.length === 0) {
    return {
      valid: false,
      error: "Please select at least one geographic region (Q4)",
    };
  }

  return { valid: true };
}
