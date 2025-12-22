
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Users, Briefcase, XCircle, Clock, CheckCircle2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { type Employee } from '@/lib/employees';
import DashboardPageHeader from '@/components/dashboard/PageHeader';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useMemo, useState } from 'react';
import { useCurrentUser } from '@/context/UserContext';
import { useTasks, type Project as Task } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';


function EmployeeCard({ employee, tasks }: { employee: Employee, tasks: Task[] }) {
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

    const taskStats = useMemo(() => {
        let total = 0;
        let overdue = 0;
        let inProgress = 0;
        let completed = 0;

        tasks.forEach(task => {
            total++;
            if (task.status === 'completed') {
                completed++;
            } else if (task.status === 'in-progress' || task.status === 'pending-approval') {
                inProgress++;
            }
            if (task.endDate && new Date(task.endDate) < new Date() && task.status !== 'completed') {
                overdue++;
            }
        });

        return { total, overdue, inProgress, completed };
    }, [tasks]);


    return (
         <div className="flex flex-col">
            <Card className="hover:shadow-lg transition-shadow h-full border-2 border-primary/80 relative">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/assign-task/form?employeeId=${employee.record}`}>Assign New Task</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link href={`/dashboard/department/${employee.departments[0]}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsTaskDialogOpen(true)}>
                            View Assigned Tasks
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <CardContent className="p-4">
                    <p className="font-bold text-center">{employee.name.toUpperCase()}</p>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1"><Briefcase size={14} /><span>Tasks</span></div>
                            <span>{taskStats.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-1"><XCircle size={14} className="text-red-500" /><span>Overdue</span></div>
                            <span className="text-red-500">{taskStats.overdue}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1"><Clock size={14} className="text-blue-500" /><span>In Progress</span></div>
                            <span className="text-blue-500">{taskStats.inProgress}</span>
                        </div>
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /><span>Completed</span></div>
                            <span className="text-green-500">{taskStats.completed}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Link href={`/employee-dashboard?employeeId=${employee.record}`} className="mt-2 text-center text-sm text-primary hover:underline">
                View Dashboard
            </Link>

            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Assigned Tasks for {employee.name}</DialogTitle>
                        <DialogDescription>A list of all tasks assigned to this employee.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length > 0 ? tasks.map(task => (
                                    <TableRow key={task.id}>
                                        <TableCell>{task.projectName}</TableCell>
                                        <TableCell>{task.taskName}</TableCell>
                                        <TableCell>{task.endDate || 'N/A'}</TableCell>
                                        <TableCell><StatusBadge status={task.status} /></TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No tasks assigned.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AssignTaskPage() {
    const { employeesByDepartment } = useCurrentUser();
    const image = PlaceHolderImages.find(p => p.id === 'assign-task');
    const { tasks } = useTasks(undefined, true); // Fetch all tasks for admin view

    const tasksByEmployee = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const { assignedTo } = task;
            if (!acc[assignedTo]) {
                acc[assignedTo] = [];
            }
            acc[assignedTo].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);
    
     const departments = useMemo(() => [
        { name: 'CEO', slug: 'ceo' },
        { name: 'ADMIN', slug: 'admin' },
        { name: 'HR', slug: 'hr' },
        { name: 'SOFTWARE ENGINEER', slug: 'software-engineer' },
        { name: 'DRAFTPERSONS', slug: 'draftpersons' },
        { name: '3D VISULIZER', slug: '3d-visualizer' },
        { name: 'ARCHITECTS', slug: 'architects' },
        { name: 'FINANCE', slug: 'finance' },
        { name: 'QUANTITY MANAGEMENT', slug: 'quantity-management' },
    ], []);

    return (
        <div className="space-y-8">
            <DashboardPageHeader
                title="Assign Task"
                description="Select an employee to assign a new task or view their projects."
                imageUrl={image?.imageUrl || ''}
                imageHint={image?.imageHint || ''}
            />
            {departments.map((dept, deptIndex) => {
                const deptEmployees = employeesByDepartment[dept.slug] || [];
                if(deptEmployees.length === 0) return null;
                
                return (
                    <div key={dept.slug || `dept-${deptIndex}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-headline font-bold text-primary">{dept.name}</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                           {deptEmployees.map((emp, index) => <EmployeeCard key={emp.uid ?? `emp-${index}`} employee={emp} tasks={tasksByEmployee[emp.uid] || []} />)}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

