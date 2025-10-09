import { humanizeProfile, InvestorProfile } from "@/lib/profileHumanizer";
import {
  TrendingUp,
  Shield,
  Calendar,
  BookOpen,
  Globe,
  Filter,
} from "lucide-react";

interface ProfileDisplayProps {
  investorProfile: InvestorProfile;
}

export default function ProfileDisplay({
  investorProfile,
}: ProfileDisplayProps) {
  const humanized = humanizeProfile(investorProfile);

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
        <TrendingUp className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-orange-700 dark:text-orange-300">
            Risk Tolerance
          </div>
          <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">
            {humanized.riskTolerance}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
        <Shield className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Risk Capacity
          </div>
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            {humanized.riskCapacity}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
        <Calendar className="h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-purple-700 dark:text-purple-300">
            Investment Horizon
          </div>
          <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            {humanized.investmentHorizon}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
        <BookOpen className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-300">
            Investor Experience
          </div>
          <div className="text-sm font-semibold text-green-900 dark:text-green-100">
            {humanized.investorExperience}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
        <Globe className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Geographic Focus
          </div>
          <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {humanized.regions}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
        <Filter className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Industry Exclusions
          </div>
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {humanized.industryExclusions}
          </div>
        </div>
      </div>
    </div>
  );
}
