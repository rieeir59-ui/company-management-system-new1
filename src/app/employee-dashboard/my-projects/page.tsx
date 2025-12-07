
'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Loader2, CheckCircle2, Clock, XCircle, Briefcase, User as UserIcon, Building } from 'lucide-react';
import { useCurrentUser } from '@/context/UserContext';
import { useRecords } from '@/context/RecordContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTasks } from '@/hooks/use-tasks';

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

const departmentOrder: string[] = [
    'ceo', 'admin', 'hr', 'software-engineer', 'architects', 'draftman', '3d-visualizer', 'finance', 'quantity-management'
]

function formatDepartmentName(slug: string) {
    return departments[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const getInitials = (name: string) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[nameParts.length - 1]) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name[0] ? name[0].toUpperCase() : '';
}

const StatusBadge = ({ status }: { status: 'completed' | 'in-progress' | 'not-started' }) => {
    const statusConfig = {
        'completed': { icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
        'in-progress': { icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'In Progress' },
        'not-started': { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Not Started' },
    };
    const { icon: Icon, color, label } = statusConfig[status] || statusConfig['not-started'];
    return (
        <Badge variant="outline" className={cn("gap-1.5", color)}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </Badge>
    );
};

function MyProjectsComponent() {
  const { employees, isUserLoading } = useCurrentUser();
  const { tasks, isLoading: isLoadingTasks } = useTasks();

  const tasksByEmployee = useMemo(() => {
    return tasks.reduce((acc, task) => {
        if (!acc[task.assignedTo]) {
            acc[task.assignedTo] = [];
        }
        acc[task.assignedTo].push(task);
        return acc;
    }, {} as Record<string, typeof tasks>);
  }, [tasks]);
  
  const employeesByDepartment = useMemo(() => {
    return employees.reduce((acc, employee) => {
        const { department } = employee;
        if (!acc[department]) {
            acc[department] = [];
        }
        acc[department].push(employee);
        return acc;
    }, {} as Record<string, typeof employees>);
  }, [employees]);


  if (isUserLoading || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Loading project data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-card/90 border-primary/30 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-headline text-primary font-bold">All Projects & Tasks</CardTitle>
          <CardDescription className="text-xl text-primary/90 font-semibold pt-1">An overview of tasks assigned to all employees.</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="space-y-6">
        {departmentOrder.map(deptSlug => {
            const deptEmployees = employeesByDepartment[deptSlug];
            if (!deptEmployees || deptEmployees.length === 0) return null;

            return (
                <div key={deptSlug}>
                     <h2 className="flex items-center gap-3 text-2xl font-headline font-semibold text-primary mb-4">
                        <Building className="h-6 w-6"/>
                        {formatDepartmentName(deptSlug)}
                    </h2>
                    <Accordion type="multiple" className="w-full space-y-2">
                        {deptEmployees.map(employee => {
                            const employeeTasks = tasksByEmployee[employee.uid] || [];
                            return (
                                <AccordionItem value={employee.uid} key={employee.uid} className="border-b-0">
                                    <Card className="bg-card/90">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-primary">
                                                <AvatarFallback className="bg-secondary text-secondary-foreground text-lg font-bold">{getInitials(employee.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-lg text-left">{employee.name}</p>
                                                <p className="text-sm text-muted-foreground text-left">{formatDepartmentName(employee.department)}</p>
                                            </div>
                                        </div>
                                         <Badge variant="secondary" className="gap-2">
                                            <Briefcase className="h-4 w-4"/>
                                            {employeeTasks.length} Task(s)
                                        </Badge>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0">
                                        {employeeTasks.length > 0 ? (
                                             <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Project</TableHead>
                                                        <TableHead>Task</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>End Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {employeeTasks.map(task => (
                                                        <TableRow key={task.id}>
                                                            <TableCell>{task.projectName}</TableCell>
                                                            <TableCell>{task.taskName}</TableCell>
                                                            <TableCell><StatusBadge status={task.status}/></TableCell>
                                                            <TableCell>{task.endDate}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                             </Table>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">No tasks assigned to this employee.</p>
                                        )}
                                    </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </div>
            )
        })}
      </div>
    </div>
  );
}

export default function MyProjectsPageWrapper() {
  return (
    <Suspense fallback={
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-4">Loading Page...</span>
        </div>
    }>
      <MyProjectsComponent />
    </Suspense>
  )
}
