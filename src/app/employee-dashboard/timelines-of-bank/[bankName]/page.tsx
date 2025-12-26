
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Page() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Feature Removed</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The bank timeline feature has been removed.</p>
                    <Button asChild className="mt-6">
                        <Link href="/employee-dashboard" className="flex items-center gap-2">
                           <ArrowLeft className="h-4 w-4" />
                           Back to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
