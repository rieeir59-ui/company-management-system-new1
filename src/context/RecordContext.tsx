
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
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
  orderBy,
  where,
  getDocs,
  type DocumentReference,
  type Timestamp,
  type FirestoreError
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCurrentUser } from './UserContext';
import { allFileNames, getFormUrlFromFileName } from '@/lib/utils';
import { getIconForFile } from '@/lib/icons';
import { bankProjectsMap, type ProjectRow, bankTimelineCategories } from '@/lib/projects-data';
import { Building2, Home, Landmark } from 'lucide-react';

export type SavedRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  fileName: string;
  projectName: string;
  createdAt: Date;
  data: any;
  employeeRecord?: string;
};

type RecordContextType = {
  records: SavedRecord[];
  addRecord: (record: Omit<SavedRecord, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => Promise<DocumentReference | undefined>;
  addOrUpdateRecord: (recordData: Omit<SavedRecord, 'id' | 'createdAt' >, showToast?: boolean) => Promise<void>;
  updateRecord: (id: string, updatedData: Partial<SavedRecord>, showToast?: boolean) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordById: (id: string) => SavedRecord | undefined;
  projectManualItems: { href: string; label: string; icon: React.ElementType; }[];
  error: string | null;
  bankTimelineCategories: string[];
};

const RecordContext = createContext<RecordContextType | undefined>(undefined);

const sharedRecordFileNames = ["Running Projects Summary"];

export const RecordProvider = ({ children }: { children: ReactNode }) => {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useCurrentUser();
  const { toast } = useToast();

  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = useMemo(() => currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d)), [currentUser]);

  // Fetch records
  useEffect(() => {
    if (isUserLoading || !firestore) {
      return;
    }
    if(!currentUser) {
        setRecords([]);
        return;
    }

    const recordsCollection = collection(firestore, 'savedRecords');
    const q = query(recordsCollection, orderBy('createdAt', 'desc')); 

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const fetched = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          } as SavedRecord;
        });
        setRecords(fetched);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching records:', err);
        setError('Failed to fetch records. You may not have permission.');
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'savedRecords', operation: 'list' }));
      }
    );

    return () => unsubscribe();
  }, [firestore, isUserLoading, currentUser]);

  // Add new record
  const addRecord = useCallback(
    async (recordData: Omit<SavedRecord, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>): Promise<DocumentReference | undefined> => {
      if (!firestore || !currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
        return Promise.reject(new Error('User not authenticated'));
      }

      const dataToSave = {
        ...recordData,
        employeeId: currentUser.uid,
        employeeRecord: currentUser.record,
        employeeName: currentUser.name,
        createdAt: serverTimestamp(),
      };

      try {
        const docRef = await addDoc(collection(firestore, 'savedRecords'), dataToSave);
        toast({ title: 'Record Saved', description: `"${recordData.projectName}" has been saved.` });
        return docRef;
      } catch (err) {
        console.error(err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'savedRecords', operation: 'create', requestResourceData: dataToSave }));
        return Promise.reject(err);
      }
    },
    [firestore, currentUser, toast]
  );
  
  // Update record
  const updateRecord = useCallback(
    async (id: string, updatedData: Partial<SavedRecord>, showToast = true) => {
      if (!firestore || !currentUser) {
          if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update records.' });
          return Promise.reject(new Error('User not authenticated'));
      }

      try {
        await updateDoc(doc(firestore, 'savedRecords', id), updatedData);
        if(showToast) toast({ title: 'Record Updated', description: 'Record successfully updated.' });
      } catch (err) {
        console.error(err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `savedRecords/${id}`, operation: 'update', requestResourceData: updatedData }));
        return Promise.reject(err);
      }
    },
    [firestore, toast, currentUser]
  );
  
  const addOrUpdateRecord = useCallback(
    async (recordData: Omit<SavedRecord, 'id' | 'createdAt' >, showToast = true) => {
        if (!firestore || !currentUser) {
            if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
            return Promise.reject(new Error('User not authenticated'));
        }
    
        const recordsCollection = collection(firestore, 'savedRecords');
        
        let q;
        const isSharedRecord = sharedRecordFileNames.includes(recordData.fileName) || recordData.fileName.includes('Timeline');
    
        if (isSharedRecord) {
            q = query(recordsCollection, where('fileName', '==', recordData.fileName));
        } else {
             q = query(
                recordsCollection, 
                where('fileName', '==', recordData.fileName),
                where('employeeId', '==', recordData.employeeId)
            );
        }
    
        const querySnapshot = await getDocs(q);
    
        const employeeInfo = {
            employeeId: currentUser.uid, // Use authenticated user's UID
            employeeName: recordData.employeeName || currentUser.name,
            employeeRecord: recordData.employeeRecord || currentUser.record,
        };

        if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const dataToUpdate: Partial<SavedRecord> = {
                ...employeeInfo,
                projectName: recordData.projectName,
                data: recordData.data,
            };
            await updateRecord(existingDoc.id, dataToUpdate, showToast);
        } else {
             const newRecord = {
                ...recordData,
                ...employeeInfo,
                createdAt: serverTimestamp()
            };

            try {
                await addDoc(collection(firestore, 'savedRecords'), newRecord);
                if(showToast) toast({ title: 'Record Saved', description: `"${recordData.projectName}" has been saved.` });
            } catch (err) {
                 console.error(err);
                 errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'savedRecords', operation: 'create', requestResourceData: newRecord }));
            }
        }
    },
    [firestore, currentUser, toast, updateRecord]
);


  // Delete record
  const deleteRecord = useCallback(
    async (id: string) => {
      if (!firestore || !currentUser) {
          toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to delete records.' });
          return Promise.reject(new Error('User not authenticated'));
      }
      
      const recordToDelete = records.find(r => r.id === id);
      if (recordToDelete && !isAdmin && recordToDelete.employeeId !== currentUser.uid) {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot delete this record.' });
          return Promise.reject(new Error('Permission denied'));
      }

      try {
        await deleteDoc(doc(firestore, 'savedRecords', id));
        toast({ title: 'Record Deleted', description: 'Record has been removed.' });
      } catch (err) {
        console.error(err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `savedRecords/${id}`, operation: 'delete' }));
        return Promise.reject(err);
      }
    },
    [firestore, toast, currentUser, isAdmin, records]
  );

  const getRecordById = useCallback((id: string) => records.find(r => r.id === id), [records]);
  
  const projectManualItems = useMemo(() => {
    const dashboardPrefix = isAdmin ? 'dashboard' : 'employee-dashboard';
    return allFileNames
        .filter(name => !name.includes('Timeline') && !['Task Assignment', 'My Projects', 'Daily Work Report', 'Uploaded File'].includes(name))
        .map(name => {
            const url = getFormUrlFromFileName(name, dashboardPrefix);
            return {
                href: url,
                label: name,
                icon: getIconForFile(name),
            };
        });
  }, [isAdmin]);
  
  const value = useMemo(() => ({ 
      records, 
      addRecord, 
      addOrUpdateRecord, 
      updateRecord, 
      deleteRecord, 
      getRecordById, 
      error, 
      projectManualItems,
      bankTimelineCategories
    }), [records, addRecord, addOrUpdateRecord, updateRecord, deleteRecord, getRecordById, error, projectManualItems]);


  return (
    <RecordContext.Provider value={value}>
      {children}
    </RecordContext.Provider>
  );
};

export const useRecords = () => {
  const context = useContext(RecordContext);
  if (!context) throw new Error('useRecords must be used within RecordProvider');
  return context;
};

