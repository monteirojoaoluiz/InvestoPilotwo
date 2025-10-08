import { Question } from "./types";

export const OPTION_SHORTCUTS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
] as const;

export const QUESTIONS: Question[] = [
  {
    id: "lifeStage",
    title: "Where are you in your financial journey?",
    description:
      "This helps us tailor recommendations to match your current priorities.",
    options: [
      {
        value: "early-career",
        label: "I'm early in my career and building wealth",
      },
      {
        value: "mid-career",
        label: "I'm mid-career and focused on growing assets",
      },
      {
        value: "nearing-retirement",
        label: "I'm within 10 years of retirement",
      },
      {
        value: "retired",
        label: "I'm retired and prioritising income stability",
      },
    ],
  },
  {
    id: "riskTolerance",
    title: "How do you feel about market ups and downs?",
    description:
      "Your comfort with volatility guides the mix of conservative vs growth assets.",
    options: [
      {
        value: "conservative",
        label: "I'd rather avoid big drops, even if returns are lower",
      },
      {
        value: "moderate",
        label: "I'm okay with some swings for balanced growth",
      },
      {
        value: "aggressive",
        label:
          "I'm comfortable with larger swings for higher potential returns",
      },
    ],
  },
  {
    id: "timeHorizon",
    title: "When will you likely need to use this money?",
    description:
      "A longer horizon allows us to take on more growth-oriented investments.",
    options: [
      { value: "under-3-years", label: "Within 3 years" },
      { value: "three-to-seven-years", label: "In about 3-7 years" },
      { value: "over-seven-years", label: "In more than 7 years" },
    ],
  },
  {
    id: "geographicFocus",
    title: "Which geographic regions interest you most for investments?",
    description:
      "Select your preferred geographic focus for your investment portfolio.",
    options: [
      { value: "netherlands", label: "Netherlands (NL)" },
      { value: "europe-ex-nl", label: "Europe (ex-NL)" },
      { value: "united-states", label: "United States (US)" },
      {
        value: "developed-ex-us-europe",
        label:
          "Developed Markets ex-US & ex-Europe (Canada, Japan, Australia/New Zealand, Singapore/Hong Kong, Israel)",
      },
      {
        value: "emerging-markets",
        label:
          "Emerging Markets (China, India, Latin America, EMEA, Southeast Asia)",
      },
    ],
  },
  {
    id: "esgExclusions",
    title: "Is it okay for your portfolio to include the following?",
    description:
      "Uncheck any you want to exclude. Leaving all checked means no exclusions. Exclusions may reduce diversification and affect returns.",
    options: [
      { value: "tobacco", label: "Tobacco" },
      { value: "fossil-fuels", label: "Fossil fuels" },
      { value: "defense-industry", label: "Defense industry" },
      { value: "gambling", label: "Gambling" },
      { value: "adult-entertainment", label: "Adult entertainment" },
      {
        value: "non-esg-funds",
        label: "Funds without a sustainability focus (no ESG screening)",
      },
    ],
  },
  {
    id: "incomeStability",
    title: "How stable do you expect your income to be over the next 5 years?",
    description:
      "Income stability affects how much risk we can take with your investments.",
    options: [
      {
        value: "very-stable",
        label: "Very stable (e.g., government job, tenure)",
      },
      { value: "somewhat-stable", label: "Somewhat stable (steady industry)" },
      {
        value: "unstable",
        label: "Potentially unstable (commission-based, startup)",
      },
    ],
  },
  {
    id: "emergencyFund",
    title: "Do you have an emergency fund?",
    description:
      "An emergency fund provides a safety net, allowing for more aggressive investing.",
    options: [
      { value: "yes", label: "Yes, 3-6+ months of expenses" },
      { value: "partial", label: "Partial (1-3 months)" },
      { value: "no", label: "No emergency fund" },
    ],
  },
  {
    id: "debtLevel",
    title: "What is your current debt situation?",
    description:
      "High-interest debt may require more conservative investment strategies.",
    options: [
      { value: "low-none", label: "Low or no debt" },
      {
        value: "manageable",
        label: "Manageable debt (mortgage, student loans)",
      },
      { value: "high", label: "High-interest debt (credit cards)" },
    ],
  },
  {
    id: "investmentExperience",
    title: "How would you describe your investment experience?",
    description:
      "Your experience level helps us match complexity to your comfort.",
    options: [
      { value: "none", label: "No experience" },
      { value: "beginner", label: "Beginner (a few years)" },
      { value: "intermediate", label: "Intermediate (diversified portfolio)" },
      { value: "advanced", label: "Advanced (active management)" },
    ],
  },
  {
    id: "investmentKnowledge",
    title: "How knowledgeable are you about investing?",
    description: "This helps us provide appropriate educational resources.",
    options: [
      { value: "beginner", label: "Beginner (learning basics)" },
      {
        value: "intermediate",
        label: "Intermediate (understand diversification)",
      },
      { value: "advanced", label: "Advanced (technical analysis, etc.)" },
    ],
  },
  {
    id: "dividendVsGrowth",
    title: "Do you prefer dividend income or capital growth?",
    description:
      "This helps us align your portfolio with your income needs and growth objectives.",
    options: [
      {
        value: "dividend-focus",
        label: "Dividend-focused (regular income payments)",
      },
      { value: "balanced", label: "Balanced (some income and some growth)" },
      { value: "growth-focus", label: "Growth-focused (capital appreciation)" },
    ],
  },
  {
    id: "behavioralReaction",
    title: "If your portfolio dropped 20% in a year, what would you do?",
    description: "Your likely reaction helps assess behavioral risk tolerance.",
    options: [
      { value: "sell-all", label: "Sell everything to stop the losses" },
      { value: "sell-some", label: "Sell some to reduce exposure" },
      { value: "hold", label: "Hold and wait for recovery" },
      { value: "buy-more", label: "Buy more (buy the dip)" },
    ],
  },
  {
    id: "incomeRange",
    title: "Approximate annual household income?",
    description: "This helps contextualize your investment capacity.",
    options: [
      { value: "<50k", label: "Under $50,000" },
      { value: "50-100k", label: "$50,000 - $100,000" },
      { value: "100-250k", label: "$100,000 - $250,000" },
      { value: "250k+", label: "$250,000+" },
    ],
  },
  {
    id: "netWorthRange",
    title: "Approximate net worth (excluding primary residence)?",
    description: "This provides context for diversification needs.",
    options: [
      { value: "<100k", label: "Under $100,000" },
      { value: "100-500k", label: "$100,000 - $500,000" },
      { value: "500k-1M", label: "$500,000 - $1,000,000" },
      { value: "1M+", label: "$1,000,000+" },
    ],
  },
];
