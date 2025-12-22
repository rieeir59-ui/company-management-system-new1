
'use client';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Page() {
  const image = PlaceHolderImages.find(p => p.id === 'substantial-summary');

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Substantial Summary"
        description="This page has been integrated into the 'Payment Certificates' page."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Please use the Payment Certificates page to manage all payment-related documents.</p>
        <Button asChild className="mt-4">
          <Link href="/employee-dashboard/payment-certificates">Go to Payment Certificates</Link>
        </Button>
      </div>
    </div>
  );
}
