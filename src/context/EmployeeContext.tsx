
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { employees as initialEmployees, type Employee } from '@/lib/employees';

type EmployeeContextType = {
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (record: string, updatedData: Partial<Employee>) => void;
  deleteEmployee: (record: string) => void;
  employeesByDepartment: Record<string, Employee[]>;
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage only on the client, after the initial render.
  useEffect(() => {
    // Only run on the client
    if (typeof window !== 'undefined') {
        const savedEmployees = localStorage.getItem('employees');
        if (savedEmployees) {
            try {
                const parsed = JSON.parse(savedEmployees);
                setEmployees(parsed);
            } catch (e) {
                console.error("Failed to parse employees from localStorage", e);
                // If parsing fails, fall back to initial employees
                setEmployees(initialEmployees);
                localStorage.setItem('employees', JSON.stringify(initialEmployees));
            }
        }
        setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // Only save to localStorage after initialization and on the client
    if (isInitialized && typeof window !== 'undefined') {
        localStorage.setItem('employees', JSON.stringify(employees));
    }
  }, [employees, isInitialized]);


  const addEmployee = (employee: Employee) => {
    setEmployees((prevEmployees) => [...prevEmployees, employee]);
  };

  const updateEmployee = (record: string, updatedData: Partial<Employee>) => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((employee) =>
        employee.record === record ? { ...employee, ...updatedData } : employee
      )
    );
  };

  const deleteEmployee = (record: string) => {
    setEmployees((prevEmployees) =>
      prevEmployees.filter((employee) => employee.record !== record)
    );
  };


  const employeesByDepartment = useMemo(() => {
    const grouped = employees.reduce((acc, employee) => {
        const { department } = employee;
        if (!acc[department]) {
        acc[department] = [];
        }
        acc[department].push(employee);
        return acc;
    }, {} as Record<string, Employee[]>);

    return grouped;
  }, [employees]);

  const value = useMemo(() => ({
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    employeesByDepartment
  }), [employees, employeesByDepartment]);


  // To prevent hydration errors, render nothing on the server if not initialized.
  if (!isInitialized) {
    return (
        <EmployeeContext.Provider value={{ employees: initialEmployees, addEmployee, updateEmployee, deleteEmployee, employeesByDepartment: {} }}>
            {children}
        </EmployeeContext.Provider>
    );
  }

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};

