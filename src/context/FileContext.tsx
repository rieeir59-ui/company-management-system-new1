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
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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
  addFileRecord: (record: Omit<UploadedFile, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>, file: File, onProgress: (progress: number) => void) => Promise<string | undefined>;
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
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }
    
    if (!currentUser || !firestore) {
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
        setError(null);
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

  const addFileRecord = useCallback(async (record: Omit<UploadedFile, 'id' | 'createdAt' | 'employeeId' | 'employeeName' | 'fileUrl'>, file: File, onProgress: (progress: number) => void): Promise<string | undefined> => {
    if (!firestore || !currentUser || !firebaseApp) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload files.' });
        return;
    }
    const storage = getStorage(firebaseApp);
    const filePath = `${record.category}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const dataToSave = {
                        ...record,
                        fileUrl: downloadURL,
                        employeeId: currentUser.record,
                        employeeName: currentUser.name,
                        createdAt: serverTimestamp(),
                    };
                    await addDoc(collection(firestore, 'uploadedFiles'), dataToSave);
                    resolve(downloadURL);
                } catch (serverError) {
                    console.error("Error adding file record:", serverError);
                    const permissionError = new FirestorePermissionError({
                        path: `uploadedFiles`,
                        operation: 'create',
                        requestResourceData: record,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    reject(serverError);
                }
            }
        );
    });
  }, [firestore, currentUser, firebaseApp, toast]);


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
        try {
            const fileRef = ref(storage, docToDelete.fileUrl);
            await deleteObject(fileRef);
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.error("Error deleting file from Storage:", storageError);
                toast({ variant: 'destructive', title: 'Storage Error', description: 'Could not delete the file from storage.' });
                // We might still want to proceed to delete the Firestore record
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
