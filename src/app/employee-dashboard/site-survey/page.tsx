
'use client';

import { Suspense } from 'react';
import SiteSurveyComponent from '@/components/dashboard/SiteSurveyComponent';
import { Loader2 } from 'lucide-react';

function SiteSurveyFallback() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span>Loading Form...</span>
        </div>
    );
}

export default function Page() {
  return (
    <Suspense fallback={<SiteSurveyFallback />}>
      <SiteSurveyComponent />
    </Suspense>
  );
}

    

    