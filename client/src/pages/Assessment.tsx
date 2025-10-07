import React from 'react';
import RiskAssessment from '../components/RiskAssessment';
import { generatePortfolio } from '../services/api';
import { queryClient } from '../lib/queryClient';

export default function Assessment() {
  const handleAssessmentComplete = async () => {
    try {
      await generatePortfolio();
      // Invalidate portfolio cache
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to generate portfolio:', error);
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="p-6 w-full min-w-0 max-w-full overflow-x-hidden">
      <RiskAssessment onComplete={handleAssessmentComplete} />
    </div>
  );
}
