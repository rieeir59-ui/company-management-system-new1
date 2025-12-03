'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useCurrentUser } from './UserContext';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Timestamp,
  FirestoreError,
  orderBy
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from "firebase/storage";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export type UploadedFile = {
    id: string;
    category: string;
    bankName?: string;
    customName: string;
    originalName: string;
    fileType: string;
    size: number;
    createdAt: Date; // Keep as Date object for easier use
    employeeName: string;
    employeeId: string;
    fileUrl?: string;
};

type FileContextType = {
  fileRecords: UploadedFile[];
  addFileRecord: (record: Omit<UploadedFile, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => Promise<void>;
  updateFileRecord: (id: string, updatedData: Partial<UploadedFile>) => Promise<void>;
  deleteFileRecord: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider = ({ children }: { children: ReactNode }) => {
  const [fileRecords, setFileRecords] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firestore, firebaseApp } = useFirebase();
  const { user: currentUser, isUserLoading } = useCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isUserLoading || !firestore) {
      setIsLoading(true);
      return;
    }
    
    // No user, no data.
    if (!currentUser) {
        setFileRecords([]);
        setIsLoading(false);
        return;
    }

    const q = query(collection(firestore, "uploadedFiles"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const files = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        } as UploadedFile));
        setFileRecords(files);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error("Error fetching file records: ", err);
        setError("Failed to fetch file records.");
        const permissionError = new FirestorePermissionError({
            path: 'uploadedFiles',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, currentUser, isUserLoading]);

  const addFileRecord = useCallback(async (record: Omit<UploadedFile, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => {
    if (!firestore || !currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload files.' });
        return;
    }
    
    const dataToSave = {
        ...record,
        employeeId: currentUser.record,
        employeeName: currentUser.name,
        createdAt: serverTimestamp(),
    };

    try {
        await addDoc(collection(firestore, 'uploadedFiles'), dataToSave);
        // The real-time listener will update the state, no need to call setFileRecords here.
    } catch(serverError) {
        console.error("Error adding file record:", serverError);
        const permissionError = new FirestorePermissionError({
            path: `uploadedFiles`,
            operation: 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, currentUser, toast]);

  const updateFileRecord = useCallback(async (id: string, updatedData: Partial<UploadedFile>) => {
     if (!firestore) return;
     const docRef = doc(firestore, 'uploadedFiles', id);
     try {
         await updateDoc(docRef, updatedData);
     } catch (serverError) {
         console.error("Error updating file record:", serverError);
         const permissionError = new FirestorePermissionError({
            path: `uploadedFiles/${id}`,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
     }
  }, [firestore]);

  const deleteFileRecord = useCallback(async (id: string) => {
    if (!firestore || !firebaseApp) return;
    
    const docToDelete = fileRecords.find(f => f.id === id);
    if (!docToDelete) return;

    // Delete from Storage first
    if (docToDelete.fileUrl && docToDelete.fileUrl.startsWith('https://firebasestorage.googleapis.com')) {
        const storage = getStorage(firebaseApp);
        const fileRef = ref(storage, docToDelete.fileUrl);
        try {
            await deleteObject(fileRef);
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.error("Error deleting file from Storage:", storageError);
                toast({ variant: 'destructive', title: 'Storage Error', description: 'Could not delete the file from storage.' });
             }
        }
    }

    // Then delete from Firestore
    const docRef = doc(firestore, 'uploadedFiles', id);
    try {
        await deleteDoc(docRef);
    } catch (serverError) {
         console.error("Error deleting file record from Firestore:", serverError);
         const permissionError = new FirestorePermissionError({
            path: `uploadedFiles/${id}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, firebaseApp, fileRecords, toast]);


  return (
    <FileContext.Provider value={{ fileRecords, addFileRecord, updateFileRecord, deleteFileRecord, isLoading, error }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileRecords = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileRecords must be used within a FileProvider');
  }
  return context;
};
