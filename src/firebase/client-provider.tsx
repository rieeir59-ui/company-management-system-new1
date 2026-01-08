'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // useMemo with an empty dependency array ensures this runs only once on the client-side after mount.
  // This is a safer way to initialize client-side libraries in Next.js App Router.
  useMemo(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, []); 

  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
