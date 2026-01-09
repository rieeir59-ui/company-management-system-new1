
'use client';

import { Suspense } from 'react';
import DailyReportPageComponent from '@/app/dashboard/daily-record/page';
import { Loader2 } from 'lucide-react';

function LeaveApplicationFallback() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span>Loading Form...</span>
        </div>
    );
}

export default function EmployeeDailyReportPage() {
    return (
        <Suspense fallback={<LeaveApplicationFallback />}>
          <DailyReportPageComponent viewMode="employee"/>
        </Suspense>
      )
}
