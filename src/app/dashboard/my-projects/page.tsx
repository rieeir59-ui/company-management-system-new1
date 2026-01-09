'use client';

import MyProjectsComponent from '@/components/dashboard/MyProjectsComponent';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function MyProjectsFallback() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-4">Loading Projects...</span>
        </div>
    );
}

export default function MyProjectsPage() {
    return (
        <Suspense fallback={<MyProjectsFallback />}>
            <MyProjectsComponent />
        </Suspense>
    )
}
