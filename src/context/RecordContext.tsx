
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  getDoc,
  type DocumentReference,
  type Timestamp,
  type FirestoreError
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCurrentUser } from './UserContext';
import { allFileNames, getFormUrlFromFileName } from '@/lib/utils';
import { getIconForFile } from '@/lib/icons';
import { bankProjectsMap, type ProjectRow } from '@/lib/projects-data';
import { Building2, Home, Landmark } from 'lucide-react';

export type SavedRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  fileName: string;
  projectName: string;
  createdAt: Date;
  data: any;
};

type RecordContextType = {
  records: SavedRecord[];
  addRecord: (record: Omit<SavedRecord, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => Promise<DocumentReference | undefined>;
  updateRecord: (id: string, updatedData: Partial<SavedRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordById: (id: string) => SavedRecord | undefined;
  updateTaskStatus: (taskId: string, newStatus: 'not-started' | 'in-progress' | 'completed') => Promise<void>;
  projectManualItems: { href: string; label: string; icon: React.ElementType; }[];
  bankTimelineItems: { href: string; label: string; icon: React.ElementType; }[];
  addBank: (bankName: string) => void;
  updateBank: (oldName: string, newName: string) => void;
  deleteBank: (bankName: string) => void;
  getBankProjects: (bankName: string) => ProjectRow[];
  error: string | null;
  bankTimelineCategories: string[];
};

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const RecordProvider = ({ children }: { children: ReactNode }) => {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useCurrentUser();
  const { toast } = useToast();

  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bankTimelineCategories, setBankTimelineCategories] = useState<string[]>([]);


  const isAdmin = currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d));

  // Fetch records
  useEffect(() => {
    if (isUserLoading || !currentUser || !firestore) {
      setRecords([]);
      return;
    }

    const recordsCollection = collection(firestore, 'savedRecords');
    let q;

    if (isAdmin) {
      q = query(recordsCollection, orderBy('createdAt', 'desc')); // Admin sees all
    } else {
      q = query(recordsCollection, where('employeeId', '==', currentUser.uid), orderBy('createdAt', 'desc')); // Employee sees own
    }


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
        
        const banks = new Set(fetched
            .filter(r => r.fileName.endsWith('Timeline'))
            .map(r => r.fileName.replace(' Timeline', ''))
            .filter(name => !['Commercial', 'Residential'].includes(name))
        );
        const uniqueBanks = Array.from(banks);
        if(uniqueBanks.length !== bankTimelineCategories.length || uniqueBanks.some(b => !bankTimelineCategories.includes(b))) {
           setBankTimelineCategories(uniqueBanks);
        }

        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching records:', err);
        setError('Failed to fetch records. You may not have permission.');
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'savedRecords', operation: 'list' }));
      }
    );

    return () => unsubscribe();
  }, [firestore, currentUser, isUserLoading, isAdmin]);

  // Add new record
  const addRecord = useCallback(
    async (recordData: Omit<SavedRecord, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>): Promise<DocumentReference | undefined> => {
      if (!firestore || !currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
        throw new Error('User not authenticated');
      }

      const dataToSave = {
        ...recordData,
        employeeId: currentUser.uid,
        employeeName: currentUser.name,
        createdAt: serverTimestamp(),
      };

      try {
        const docRef = await addDoc(collection(firestore, 'savedRecords'), dataToSave);
        toast({ title: 'Record Saved', description: `"${recordData.projectName}" has been saved.` });
        return docRef;
      } catch (err) {
        console.error(err);
        const permissionError = new FirestorePermissionError({
            path: 'savedRecords',
            operation: 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw err; // Re-throw so calling components can handle it
      }
    },
    [firestore, currentUser, toast]
  );

  // Update record
  const updateRecord = useCallback(
    async (id: string, updatedData: Partial<Omit<SavedRecord, 'id' | 'employeeId' | 'employeeName' | 'createdAt'>>) => {
      if (!firestore || !currentUser) return;
      
      const recordToUpdate = records.find(r => r.id === id);
      if (recordToUpdate && !isAdmin && recordToUpdate.employeeId !== currentUser.uid) {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot edit this record.' });
          return;
      }

      try {
        await updateDoc(doc(firestore, 'savedRecords', id), updatedData);
        toast({ title: 'Record Updated', description: 'Record successfully updated.' });
      } catch (err) {
        console.error(err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `savedRecords/${id}`, operation: 'update', requestResourceData: updatedData }));
      }
    },
    [firestore, toast, currentUser, isAdmin, records]
  );

  // Delete record
  const deleteRecord = useCallback(
    async (id: string) => {
      if (!firestore || !currentUser) return;
      
      const recordToDelete = records.find(r => r.id === id);
      if (recordToDelete && !isAdmin && recordToDelete.employeeId !== currentUser.uid) {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot delete this record.' });
          return;
      }

      try {
        await deleteDoc(doc(firestore, 'savedRecords', id));
        toast({ title: 'Record Deleted', description: 'Record has been removed.' });
      } catch (err) {
        console.error(err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `savedRecords/${id}`, operation: 'delete' }));
      }
    },
    [firestore, toast, currentUser, isAdmin, records]
  );

  const getBankProjects = useCallback((bankName: string) => {
    return bankProjectsMap[bankName.toLowerCase()] || [];
  }, []);
  
  const addBank = (bankName: string) => {
    if (!bankTimelineCategories.includes(bankName)) {
      setBankTimelineCategories(prev => [...prev, bankName]);
    }
  };

  const updateBank = (oldName: string, newName: string) => {
    setBankTimelineCategories(prev => prev.map(b => (b === oldName ? newName : b)));
    // Here you would also update any records in Firestore
    // For now, we just update the local state
    toast({ title: 'Bank Updated', description: `Renamed '${oldName}' to '${newName}'.` });
  };
  
  const deleteBank = (bankName: string) => {
    setBankTimelineCategories(prev => prev.filter(b => b !== bankName));
    // Here you would also delete records in Firestore
    toast({ title: 'Bank Deleted', description: `Timeline for '${bankName}' has been removed.` });
  };


  // Update task status (admin or assigned employee)
  const updateTaskStatus = useCallback(
    async (taskId: string, newStatus: 'not-started' | 'in-progress' | 'completed') => {
      if (!firestore || !currentUser) return;

      const taskRef = doc(firestore, 'tasks', taskId);
      try {
        const taskSnap = await getDoc(taskRef);
        if (!taskSnap.exists()) return;
        const taskData = taskSnap.data() as { assignedTo: string };
        if (!(isAdmin || taskData.assignedTo === currentUser.uid)) {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot update this task.' });
          return;
        }
        await updateDoc(taskRef, { status: newStatus });
        toast({ title: 'Task Updated', description: `Task status changed to "${newStatus}".` });
      } catch (err) {
        console.error(err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `tasks/${taskId}`, operation: 'update', requestResourceData: { status: newStatus } }));
      }
    },
    [firestore, currentUser, isAdmin, toast]
  );

  const getRecordById = useCallback((id: string) => records.find(r => r.id === id), [records]);
  
  const projectManualItems = useMemo(() => {
    if (!currentUser) return [];
    const dashboardPrefix = isAdmin ? 'dashboard' : 'employee-dashboard';
    return allFileNames
      .filter(name => !name.includes('Timeline') && name !== 'Task Assignment' && name !== 'My Projects')
      .map(name => ({
        href: getFormUrlFromFileName(name, dashboardPrefix) || `/${dashboardPrefix}`,
        label: name,
        icon: getIconForFile(name),
      }));
  }, [currentUser, isAdmin]);

  const bankTimelineItems = useMemo(() => {
    if (!currentUser) return [];
    const dashboardPrefix = isAdmin ? 'dashboard' : 'employee-dashboard';
    return [
      { href: `/${dashboardPrefix}/timelines-of-bank/commercial`, label: 'Commercial', icon: Building2 },
      { href: `/${dashboardPrefix}/timelines-of-bank/residential`, label: 'Residential', icon: Home },
      ...bankTimelineCategories.map(bank => ({
        href: `/${dashboardPrefix}/timelines-of-bank/${encodeURIComponent(bank)}`,
        label: bank,
        icon: Landmark,
      }))
    ];
  }, [currentUser, isAdmin, bankTimelineCategories]);

  return (
    <RecordContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, getRecordById, updateTaskStatus, error, projectManualItems, bankTimelineItems, addBank, updateBank, deleteBank, getBankProjects, bankTimelineCategories }}>
      {children}
    </RecordContext.Provider>
  );
};

export const useRecords = () => {
  const context = useContext(RecordContext);
  if (!context) throw new Error('useRecords must be used within RecordProvider');
  return context;
};
