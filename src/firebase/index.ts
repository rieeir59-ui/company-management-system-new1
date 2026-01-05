import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, terminate } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; storage: FirebaseStorage; } {
  if (typeof window === 'undefined') {
    // This is a safeguard for server-side execution, though client-provider should prevent this.
    // @ts-ignore
    return {}; 
  }
  if (getApps().length === 0) {
    const firebaseApp = initializeApp(firebaseConfig);
    const firestore = getFirestore(firebaseApp);
    enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Firestore offline persistence failed: Multiple tabs open. Offline data will not be available.");
        } else if (err.code == 'unimplemented') {
            console.warn("Firestore offline persistence failed: Browser does not support it.");
        }
    });
    return getSdks(firebaseApp, firestore);
  }
  const app = getApp();
  const firestore = getFirestore(app);
   enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled
            // in one tab at a a time.
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable persistence
        }
    });
  return getSdks(app, firestore);
}

export function getSdks(firebaseApp: FirebaseApp, firestore: Firestore) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
    storage: getStorage(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
