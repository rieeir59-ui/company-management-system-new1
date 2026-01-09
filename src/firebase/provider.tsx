
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
    if (typeof window === 'undefined') {
        throw new Error('useFirebase must be used on the client side. Make sure the component using this hook has a "use client" directive.');
    }
  }
  return context;
};
