
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { type Employee, employees as initialEmployees } from '@/lib/employees';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserContextType {
  user: (Employee & { uid: string; }) | null;
  isUserLoading: boolean;
  login: (user: Employee & { uid: string }) => void;
  logout: () => void;
  employees: Employee[];
  employeesByDepartment: Record<string, Employee[]>;
  updateEmployee: (uid: string, updatedData: Partial<Employee>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const employeeDetails = employees.find(emp => emp.uid === firebaseUser.uid) || {
             uid: firebaseUser.uid,
             email: firebaseUser.email || '',
             name: userData.name || '',
             departments: userData.departments || [],
             contact: userData.contact || '',
             record: userData.record || '',
             avatarId: userData.avatarId || '',
             password: ''
          };
           setUser({ ...employeeDetails, uid: firebaseUser.uid });
        } else {
          // This case might happen if a user is in auth but not in DB
           setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, employees]);

  const employeesByDepartment = useMemo(() => {
    return employees.reduce((acc, employee) => {
        employee.departments.forEach(department => {
            if (!acc[department]) {
                acc[department] = [];
            }
            acc[department].push(employee);
        });
        return acc;
    }, {} as Record<string, Employee[]>);
  }, [employees]);


  const login = (loggedInUser: Employee & { uid: string }) => {
    setUser(loggedInUser);
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

  const updateEmployee = async (uid: string, updatedData: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.uid === uid ? { ...emp, ...updatedData } : emp));
    
    // Also update in firestore
    if (firestore) {
      const userRef = doc(firestore, "users", uid);
      await setDoc(userRef, updatedData, { merge: true });
    }
  };
  
  const value = useMemo(() => ({
    user,
    isUserLoading,
    login,
    logout,
    employees,
    employeesByDepartment,
    updateEmployee,
  }), [user, isUserLoading, employees, employeesByDepartment]);


  return (
    <UserContext.Provider value={value}>
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
