'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

type FirebaseContextType = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  areServicesAvailable: boolean;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const services = useMemo(() => {
    // This check is to ensure we are on the client side.
    if (typeof window === 'undefined') {
      // @ts-ignore
      return { areServicesAvailable: false };
    }
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    return { 
        firebaseApp: app, 
        firestore: getFirestore(app), 
        auth: getAuth(app), 
        storage: getStorage(app), 
        areServicesAvailable: true 
    };
  }, []);

  return (
    <FirebaseContext.Provider
      value={services as FirebaseContextType}
    >
      {services.areServicesAvailable && <FirebaseErrorListener />}
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context || !context.areServicesAvailable) {
    // This check ensures that Firebase services are only accessed on the client-side
    // where they have been properly initialized.
    throw new Error('useFirebase must be used within a FirebaseProvider and on the client side.');
  }
  return context;
};
