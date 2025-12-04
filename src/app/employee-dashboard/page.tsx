'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useCurrentUser } from '@/context/UserContext';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { collection, onSnapshot, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useEmployees } from '@/context/EmployeeContext';
import Link from 'next/link';

const departments: Record<string, string> = {
    'ceo': 'CEO',
    'admin': 'Admin',
    'hr': 'HR',
    'software-engineer': 'Software Engineer',
    'draftman': 'Draftsman',
    '3d-visualizer': '3D Visualizer',
    'architects': 'Architects',
    'finance': 'Finance',
    'quantity-management': 'Quantity Management',
};

function formatDepartmentName(slug: string) {
    return departments[slug] || slug;
}

interface Project {
  id: string;
  projectName: string;
  taskName: string;
  taskDescription: string;
  status: 'completed' | 'in-progress' | 'not-started';
  dueDate: string;
  assignedBy: string;
}

function EmployeeDashboardComponent() {
  const { user: currentUser, isUserLoading } = useCurrentUser();
  const { employees } = useEmployees();
  const searchParams = useSearchParams();
  
  const employeeId = searchParams.get('employeeId');
  const displayUser = useMemo(() => {
    return employeeId ? employees.find(e => e.record === employeeId) : currentUser;
  }, [employeeId, employees, currentUser]);
    
  if (isUserLoading || !displayUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Loading user data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-card/90 border-primary/30 shadow-lg">
        <CardHeader className="text-center">
            <>
              <CardTitle className="text-4xl font-headline text-primary font-bold">{displayUser.name}</CardTitle>
              <CardDescription className="text-xl text-primary/90 font-semibold pt-1">Welcome to {formatDepartmentName(displayUser.department)} Panel</CardDescription>
            </>
        </CardHeader>
        <CardContent className="text-center">
           <p className="text-muted-foreground">Use the sidebar to navigate to different sections of the dashboard. You can view your assigned tasks and manage your projects from the <Link href="/employee-dashboard/my-projects" className="text-primary hover:underline">My Projects</Link> page.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeDashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Loading Page...</span>
      </div>}>
      <EmployeeDashboardComponent />
    </Suspense>
  )
}
