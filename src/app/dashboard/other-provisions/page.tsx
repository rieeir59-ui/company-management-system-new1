
'use client';

import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Page() {
  const image = PlaceHolderImages.find(p => p.id === 'other-provisions');

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Other Provisions"
        description="This page has been integrated into the 'Project Agreement' page."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Please use the Project Agreement page to manage all agreement-related provisions.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/project-agreement">Go to Project Agreement</Link>
        </Button>
      </div>
    </div>
  );
}
