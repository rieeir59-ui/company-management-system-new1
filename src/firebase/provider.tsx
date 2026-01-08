
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { type FirebaseApp } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { type Auth } from 'firebase/auth';
import { type FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

type FirebaseServices = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
};

type FirebaseContextType = FirebaseServices & {
  areServicesAvailable: boolean;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children, services }: { children: ReactNode, services: FirebaseServices }) => {
  const value = {
    ...services,
    areServicesAvailable: !!(services.firebaseApp && services.firestore && services.auth && services.storage),
  };

  return (
    <FirebaseContext.Provider value={value}>
      {value.areServicesAvailable && <FirebaseErrorListener />}
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable) {
    // This could be triggered in a server component trying to access the context.
    // We throw a more specific error to guide developers.
    throw new Error('Firebase services are not available. Ensure useFirebase is called within a client component wrapped by FirebaseProvider.');
  }
  return context;
};
