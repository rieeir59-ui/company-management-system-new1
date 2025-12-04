'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Employee, employees } from '@/lib/employees';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


interface UserContextType {
  user: (Employee & { uid: string; role: string; }) | null;
  isUserLoading: boolean;
  login: (user: Employee & { uid: string }) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const employeeDetails = employees.find(emp => emp.email.toLowerCase() === firebaseUser.email?.toLowerCase());
        
        if (employeeDetails) {
          setUser({ ...employeeDetails, uid: firebaseUser.uid, role: employeeDetails.department });
        } else {
          // Fallback for users not in the local list, maybe created directly in Firebase Auth
          const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
          if (userDoc.exists()) {
             const userData = userDoc.data();
             setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: userData.name || '',
                role: userData.role || 'employee',
                department: userData.department || 'employee',
                contact: userData.contact || '',
                record: userData.record || '',
                avatarId: userData.avatarId || '',
             });
          } else {
             setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const login = (loggedInUser: Employee & { uid: string }) => {
    setUser({ ...loggedInUser, role: loggedInUser.department });
  };

  const logout = () => {
    if (auth) {
      auth.signOut();
    }
    setUser(null);
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
    router.push('/login');
  };

  return (
    <UserContext.Provider value={{ user, isUserLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
};
