/**
 * Profile Humanizer Utility
 * 
 * Converts investor profile numeric scores and codes to human-readable labels
 */

export interface InvestorProfile {
  risk_tolerance: number;
  risk_capacity: number;
  investment_horizon: number;
  investor_experience: number;
  regions_selected: string[];
  industry_exclusions: string[];
}

// Region code to display name mapping (backend → display)
const REGION_DISPLAY_MAP: Record<string, string> = {
  'NL': 'Netherlands',
  'EU_EX_NL': 'Europe (ex-NL)',
  'US': 'United States',
  'DEV_EX_US_EU': 'Developed Markets (ex-US/EU)',
  'EM': 'Emerging Markets',
};

// Industry code to display name mapping (backend → display)
const INDUSTRY_DISPLAY_MAP: Record<string, string> = {
  'TOBACCO': 'Tobacco',
  'FOSSIL_FUELS': 'Fossil Fuels',
  'DEFENSE': 'Defense',
  'GAMBLING': 'Gambling',
  'ADULT': 'Adult Entertainment',
  'NO_ESG_SCREEN': 'Non-ESG Funds',
};

/**
 * Humanize Risk Tolerance score
 */
export function humanizeRiskTolerance(score: number): string {
  if (score <= 33) return 'Conservative';
  if (score <= 66) return 'Moderate';
  return 'Aggressive';
}

/**
 * Humanize Risk Capacity score
 */
export function humanizeRiskCapacity(score: number): string {
  if (score <= 33) return 'Limited';
  if (score <= 66) return 'Moderate';
  return 'Strong';
}

/**
 * Humanize Investment Horizon score
 */
export function humanizeInvestmentHorizon(score: number): string {
  if (score <= 33) return 'Short-term (0-5 years)';
  if (score <= 66) return 'Medium-term (5-15 years)';
  return 'Long-term (15+ years)';
}

/**
 * Humanize Investor Experience score
 */
export function humanizeInvestorExperience(score: number): string {
  if (score <= 25) return 'Beginner';
  if (score <= 50) return 'Some Experience';
  if (score <= 75) return 'Intermediate';
  return 'Advanced';
}

/**
 * Humanize regions array
 */
export function humanizeRegions(regions: string[]): string {
  if (!regions || regions.length === 0) return 'No regions selected';
  
  const displayNames = regions
    .map(code => REGION_DISPLAY_MAP[code] || code)
    .filter(Boolean);
  
  if (displayNames.length === 0) return 'No regions selected';
  if (displayNames.length === 1) return displayNames[0];
  if (displayNames.length === 2) return displayNames.join(' and ');
  
  const last = displayNames.pop();
  return `${displayNames.join(', ')}, and ${last}`;
}

/**
 * Humanize industry exclusions array
 */
export function humanizeIndustryExclusions(exclusions: string[]): string {
  if (!exclusions || exclusions.length === 0) return 'No exclusions';
  
  const count = exclusions.length;
  if (count === 1) {
    const displayName = INDUSTRY_DISPLAY_MAP[exclusions[0]] || exclusions[0];
    return `Excludes ${displayName}`;
  }
  
  return `${count} exclusions`;
}

/**
 * Get detailed list of excluded industries
 */
export function getExcludedIndustriesList(exclusions: string[]): string[] {
  if (!exclusions || exclusions.length === 0) return [];
  
  return exclusions
    .map(code => INDUSTRY_DISPLAY_MAP[code] || code)
    .filter(Boolean);
}

/**
 * Humanize entire profile
 */
export function humanizeProfile(profile: InvestorProfile) {
  return {
    riskTolerance: humanizeRiskTolerance(profile.risk_tolerance),
    riskCapacity: humanizeRiskCapacity(profile.risk_capacity),
    investmentHorizon: humanizeInvestmentHorizon(profile.investment_horizon),
    investorExperience: humanizeInvestorExperience(profile.investor_experience),
    regions: humanizeRegions(profile.regions_selected),
    industryExclusions: humanizeIndustryExclusions(profile.industry_exclusions),
    excludedIndustriesList: getExcludedIndustriesList(profile.industry_exclusions),
  };
}

