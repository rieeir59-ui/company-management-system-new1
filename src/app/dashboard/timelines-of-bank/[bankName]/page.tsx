
'use client';

import { Suspense } from 'react';
import BankTimelinePage from '@/components/timelines/BankTimelinePage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
      <BankTimelinePage dashboardType="dashboard" />
    </Suspense>
  );
}
