

'use client';

import { Suspense } from 'react';
import DailyReportPageComponent from '@/app/dashboard/daily-report/page';
import { Loader2 } from 'lucide-react';

export default function EmployeeDailyReportPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-4">Loading Report...</span>
          </div>}>
          <DailyReportPageComponent />
        </Suspense>
      )
}
