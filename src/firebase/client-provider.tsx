
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    // This check ensures it does not run on the server.
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    // On the server, return a non-functional structure to avoid errors.
    // @ts-ignore
    return { firebaseApp: null, firestore: null, auth: null, storage: null };
  }, []);

  return (
    <FirebaseProvider services={firebaseServices}>
      {children}
    </FirebaseProvider>
  );
}
