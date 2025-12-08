
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { collection, query, where, onSnapshot, type Timestamp, FirestoreError } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCurrentUser } from '@/context/UserContext';

export interface Project {
  id: string;
  projectName: string;
  taskName: string;
  taskDescription: string;
  status: 'completed' | 'in-progress' | 'not-started';
  startDate: string;
  endDate: string;
  assignedBy: string;
  submissionUrl?: string;
  submissionFileName?: string;
}

export function useTasks(employeeUid?: string) {
  const [tasks, setTasks] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();

  const uidToFetch = employeeUid || currentUser?.uid;

  useEffect(() => {
    if (!firestore || !uidToFetch) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const tasksCollection = collection(firestore, 'tasks');
    const q = query(tasksCollection, where('assignedTo', '==', uidToFetch));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTasks: Project[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        fetchedTasks.push({
          id: doc.id,
          projectName: data.projectName || '',
          taskName: data.taskName || '',
          taskDescription: data.taskDescription || '',
          status: data.status || 'not-started',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          assignedBy: data.assignedBy || 'N/A',
          submissionUrl: data.submissionUrl,
          submissionFileName: data.submissionFileName,
        });
      });
      setTasks(fetchedTasks);
      setIsLoading(false);
    }, (error: FirestoreError) => {
      console.error("Error fetching tasks: ", error);
      const permissionError = new FirestorePermissionError({
        path: `tasks`,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch assigned tasks.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, uidToFetch, toast]);

  return { tasks, isLoading };
}
