'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

type FirebaseContextType = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  areServicesAvailable: boolean;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const services = useMemo(() => {
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    return { app, firestore, auth };
  }, []);

  return (
    <FirebaseContext.Provider
      value={{ firebaseApp: services.app, firestore: services.firestore, auth: services.auth, areServicesAvailable: true }}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context || !context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return context;
};
