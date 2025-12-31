
'use client';

import { Suspense } from 'react';
import SiteSurveyComponent from '@/components/dashboard/SiteSurveyComponent';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SiteSurveyComponent />
    </Suspense>
  );
}

    