import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Clock, Heart, MapPin, Target } from 'lucide-react';

interface ProfileCardProps {
  assessmentData: any;
}

export function ProfileCard({ assessmentData }: ProfileCardProps) {
  const riskScore = assessmentData?.riskTolerance
    ? assessmentData.riskTolerance.charAt(0).toUpperCase() + assessmentData.riskTolerance.slice(1)
    : 'Not Assessed';

  if (!assessmentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
            <Target className="h-5 w-5 text-primary" />
            Investor Profile
          </CardTitle>
          <CardDescription>Your investment preferences and profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No investor profile found</p>
            <p className="text-sm text-muted-foreground">Complete your risk assessment to build your personalized profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <Target className="h-5 w-5 text-primary" />
          Investor Profile
        </CardTitle>
        <CardDescription>Your investment preferences and profile</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">Risk Tolerance</div>
              <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">{riskScore}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">Investment Timeline</div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{assessmentData.timeHorizon?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">Career Stage</div>
              <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">{assessmentData.lifeStage?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">Investment Regions</div>
              <div className="text-sm font-semibold text-green-900 dark:text-green-100">
                {Array.isArray(assessmentData.geographicFocus)
                  ? assessmentData.geographicFocus
                      .map((focus: string) =>
                        focus.replace(/-/g, ' ')
                             .replace(/\b\w/g, l => l.toUpperCase())
                             .replace(/ex us/g, 'ex-US')
                             .replace(/ex nl/g, 'ex-NL')
                             .replace(/europe ex nl/g, 'Europe ex-NL')
                             .replace(/developed ex us europe/g, 'Developed ex-US & ex-Europe')
                      )
                      .join(', ')
                  : assessmentData.geographicFocus?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Sustainability Focus</div>
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {Array.isArray(assessmentData.esgExclusions) && assessmentData.esgExclusions.includes('non-esg-funds') ? 'ESG Focused' : 
                 Array.isArray(assessmentData.esgExclusions) && assessmentData.esgExclusions.length > 0 ? `${assessmentData.esgExclusions.length} Exclusions` : 
                 'No Exclusions'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">Investment Objective</div>
              <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">{assessmentData.dividendVsGrowth?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

