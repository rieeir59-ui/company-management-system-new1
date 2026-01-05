import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, terminate, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;
let persistenceEnabled = false;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; storage: FirebaseStorage; } {
  if (typeof window === 'undefined') {
    // This is a safeguard for server-side execution.
    // @ts-ignore
    return {};
  }
  
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApp();
    firestore = getFirestore(firebaseApp);
  }

  if (!persistenceEnabled) {
    try {
      enableIndexedDbPersistence(firestore, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
      }).then(() => {
          persistenceEnabled = true;
      }).catch((err) => {
          if (err.code == 'failed-precondition') {
              console.warn("Firestore offline persistence failed: Multiple tabs open. Offline data will not be available in this tab.");
          } else if (err.code == 'unimplemented') {
              console.warn("Firestore offline persistence failed: Browser does not support it.");
          }
          // We can mark persistence as "attempted" to avoid retrying in the same session.
          persistenceEnabled = true; 
      });
    } catch (e) {
      console.error("Error enabling persistence", e);
      persistenceEnabled = true; // Avoid retrying.
    }
  }

  auth = getAuth(firebaseApp);
  storage = getStorage(firebaseApp);

  return { firebaseApp, auth, firestore, storage };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';