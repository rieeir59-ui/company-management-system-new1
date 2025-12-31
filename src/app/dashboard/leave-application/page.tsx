

'use client';

import { Suspense } from 'react';
import LeaveApplicationPage from '@/app/employee-dashboard/leave-application/page';
import { Loader2 } from 'lucide-react';

function LeaveApplicationFallback() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span>Loading Form...</span>
        </div>
    );
}

export default function DashboardLeaveApplicationPage() {
    return (
        <Suspense fallback={<LeaveApplicationFallback />}>
            <LeaveApplicationPage />
        </Suspense>
    )
}

    