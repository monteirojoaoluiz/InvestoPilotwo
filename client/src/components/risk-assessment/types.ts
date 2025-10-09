export type AssessmentAnswers = {
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
};

export type RadioOption = {
  value: string;
  label: string;
};

export type Question = {
  id: keyof AssessmentAnswers;
  title: string;
  description: string;
  options: RadioOption[];
};
