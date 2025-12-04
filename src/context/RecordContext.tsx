'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
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
  orderBy,
  where,
  type DocumentReference
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCurrentUser } from './UserContext';

export type SavedRecord = {
    id: string;
    employeeId: string;
    employeeName: string;
    fileName: string;
    projectName: string;
    createdAt: Date; // Keep as Date object for easier use
    data: any; // Can be more specific if needed
};

type RecordContextType = {
  records: SavedRecord[];
  addRecord: (record: Omit<SavedRecord, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => Promise<DocumentReference | undefined>;
  updateRecord: (id: string, updatedData: Partial<SavedRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordById: (id: string) => SavedRecord | undefined;
  updateTaskStatus: (taskId: string, newStatus: 'not-started' | 'in-progress' | 'completed') => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const RecordProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useCurrentUser();

  useEffect(() => {
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }

    if (!firestore || !currentUser) {
        setIsLoading(false);
        setRecords([]);
        return;
    }

    setIsLoading(true);
    
    // Now all authenticated users can see all records.
    const recordsCollection = collection(firestore, "savedRecords");
    const q = query(recordsCollection, orderBy("createdAt", "desc"));

    const firestoreUnsubscribe = onSnapshot(q, 
        (snapshot) => {
            const fetchedRecords = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                } as SavedRecord;
            });
            setRecords(fetchedRecords);
            setError(null);
            setIsLoading(false);
        },
        (err: FirestoreError) => {
            console.error("Error fetching records:", err);
            setError("Failed to fetch records. You may not have permission.");
            const permissionError = new FirestorePermissionError({
                path: 'savedRecords',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        }
    );
    return () => firestoreUnsubscribe();

  }, [firestore, currentUser, isUserLoading]);

  const addRecord = useCallback(async (recordData: Omit<SavedRecord, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => {
    if (!firestore || !currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
        return;
    }
    const collectionRef = collection(firestore, 'savedRecords');
    
    const dataToSave = {
      ...recordData,
      employeeId: currentUser.record,
      employeeName: currentUser.name,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collectionRef, dataToSave);
      toast({ title: "Record Saved", description: `"${recordData.projectName}" has been saved.` });
      // Manually add to state to trigger immediate UI update, converting server timestamp to Date
      setRecords(prev => [{ ...recordData, ...dataToSave, id: docRef.id, createdAt: new Date() }, ...prev].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
      return docRef;
    } catch (serverError) {
      console.error(serverError);
      const permissionError = new FirestorePermissionError({
          path: `savedRecords`,
          operation: 'create',
          requestResourceData: dataToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError; // Re-throw to be caught by the caller
    }
  }, [firestore, currentUser, toast]);

  const updateRecord = useCallback(async (id: string, updatedData: Partial<SavedRecord>) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    const docRef = doc(firestore, 'savedRecords', id);
    try {
      await updateDoc(docRef, updatedData);
      toast({ title: "Record Updated", description: "The record has been successfully updated." });
    } catch (serverError) {
      console.error(serverError);
      const permissionError = new FirestorePermissionError({
          path: `savedRecords/${id}`,
          operation: 'update',
          requestResourceData: updatedData,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, toast]);
  
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: 'not-started' | 'in-progress' | 'completed') => {
    if (!firestore) return;
    const taskRef = doc(firestore, 'tasks', taskId);
    try {
      await updateDoc(taskRef, { status: newStatus });
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: `tasks/${taskId}`,
        operation: 'update',
        requestResourceData: { status: newStatus }
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore]);

  const deleteRecord = useCallback(async (id: string) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    const docRef = doc(firestore, 'savedRecords', id);
    try {
        await deleteDoc(docRef);
        toast({ title: "Record Deleted", description: "The record has been removed." });
    } catch (serverError) {
        console.error(serverError);
        const permissionError = new FirestorePermissionError({
            path: `savedRecords/${id}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, toast]);
  
  const getRecordById = useCallback((id: string) => {
    return records.find(rec => rec.id === id);
  }, [records]);

  return (
    <RecordContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, getRecordById, updateTaskStatus, isLoading, error }}>
      {children}
    </RecordContext.Provider>
  );
};

export const useRecords = () => {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordProvider');
  }
  return context;
};
