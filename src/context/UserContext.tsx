'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Employee, employees } from '@/lib/employees';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { onAuthStateChanged, User } from 'firebase/auth';


interface UserContextType {
  user: (Employee & { uid: string }) | null;
  isUserLoading: boolean;
  login: (user: Employee & { uid: string }) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(Employee & { uid: string }) | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = useFirebase();

  useEffect(() => {
    if (!auth) {
        setIsUserLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const employeeDetails = employees.find(emp => emp.email === firebaseUser.email);
        if (employeeDetails) {
          setUser({ ...employeeDetails, uid: firebaseUser.uid });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

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
