
'use client';

import { Suspense } from 'react';
import MyProjectsComponent from '@/app/employee-dashboard/my-projects/page';
import { Loader2 } from 'lucide-react';

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Loading Page...</span>
      </div>}>
      <MyProjectsComponent />
    </Suspense>
  )
}
