'use client';

import { Suspense } from 'react';
import SavedRecordsComponent from '@/components/saved-records/SavedRecordsComponent';

export default function SavedRecordsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
            <SavedRecordsComponent />
        </Suspense>
    )
}
