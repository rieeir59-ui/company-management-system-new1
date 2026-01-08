
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { collection, query, onSnapshot, type Timestamp, FirestoreError, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCurrentUser } from '@/context/UserContext';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRecord: string;
  department: string;
  position: string;
  status: string;
  leaveType: string;
  leaveFrom: string;
  leaveTo: string;
  returnDate: string;
  reason: string;
  totalDays: number;
  requestStatus: 'pending' | 'approved' | 'denied';
  requestedAt: Timestamp;
}

export function useLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useCurrentUser();
  const isAdmin = currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer', 'hr'].includes(d));

  useEffect(() => {
    if (isUserLoading || !firestore) {
      setIsLoading(true);
      return;
    }
    
    if (!isAdmin) {
        setLeaveRequests([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const requestsCollection = collection(firestore, 'leaveRequests');
    const q = query(requestsCollection, orderBy('requestedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LeaveRequest));
      setLeaveRequests(fetchedRequests);
      setIsLoading(false);
    }, (err: FirestoreError) => {
      console.error("Error fetching leave requests:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'leaveRequests', operation: 'list' }));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, isUserLoading, isAdmin]);

  return { leaveRequests, isLoading };
}
