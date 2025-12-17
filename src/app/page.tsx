'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/context/UserContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function Hero() {
  const image = PlaceHolderImages.find(p => p.id === 'hero-architecture');
  return (
    <section className="relative h-[60vh] flex items-center justify-center text-white">
      <Image 
        src={image?.imageUrl || ''}
        alt={image?.description || 'Architectural building'}
        fill
        className="object-cover"
        priority
        data-ai-hint={image?.imageHint}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center p-4">
        <h1 className="text-4xl md:text-6xl font-headline animate-in fade-in-0 slide-in-from-top-10 duration-1000">ISBAH HASSAN & ASSOCIATES</h1>
        <Button asChild size="lg" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-10 duration-1000 delay-500">
          <Link href="/login">Start Now</Link>
        </Button>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { user, isUserLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.departments.some(d => ['ceo', 'admin', 'software-engineer'].includes(d))) {
          router.push('/dashboard');
      } else {
          router.push('/employee-dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        {/* Add other sections for the homepage here */}
      </main>
    </div>
  );
}
