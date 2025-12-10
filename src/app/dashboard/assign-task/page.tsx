
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Briefcase, XCircle, Clock, CheckCircle2, Trash2, FileText, Check } from 'lucide-react';
import Link from 'next/link';
import { type Employee } from '@/lib/employees';
import DashboardPageHeader from '@/components/dashboard/PageHeader';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { doc, deleteDoc, type Timestamp, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCurrentUser } from '@/context/UserContext';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useTasks, type Project as Task } from '@/hooks/use-tasks';

const departments = [
    { name: 'ADMIN', slug: 'admin' },
    { name: 'HR', slug: 'hr' },
    { name: 'SOFTWARE ENGINEER', slug: 'software-engineer' },
    { name: 'DRAFTPERSONS', slug: 'draftpersons' },
    { name: '3D VISULIZER', slug: '3d-visualizer' },
    { name: 'ARCHITECTS', slug: 'architects' },
    { name: 'FINANCE', slug: 'finance' },
    { name: 'QUANTITY MANAGEMENT', slug: 'quantity-management' },
];


function EmployeeCard({ employee, tasks }: { employee: Employee, tasks: Task[] }) {
    const taskStats = useMemo(() => {
        let total = 0;
        let overdue = 0;
        let inProgress = 0;
        let completed = 0;

        tasks.forEach(task => {
            total++;
            if (task.status === 'completed') {
                completed++;
            } else if (task.status === 'in-progress') {
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
            <Link href={`/dashboard/assign-task/form?employeeId=${employee.record}`} className="flex-grow">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 border-primary/80">
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
            </Link>
             <Link href={`/employee-dashboard?employeeId=${employee.record}`} className="mt-2 text-center text-sm text-primary hover:underline">
                View Dashboard
            </Link>
        </div>
    );
}

export default function AssignTaskPage() {
    const { user: currentUser, employees, employeesByDepartment } = useCurrentUser();
    const image = PlaceHolderImages.find(p => p.id === 'assign-task');
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const { tasks } = useTasks();
    const isAdmin = currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d));

    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(e => e.uid === employeeId);
        return employee?.name || employeeId;
    };
    
    const openDeleteDialog = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteDialogOpen(true);
    };
    
    const handleApprove = async (task: Task) => {
        if (!firestore || !isAdmin) return;
        const taskRef = doc(firestore, 'tasks', task.id);
        try {
            await updateDoc(taskRef, { status: 'completed' });
            toast({ title: 'Task Approved', description: `Task "${task.taskName}" has been marked as completed.` });
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `tasks/${task.id}`, operation: 'update', requestResourceData: { status: 'completed' } }));
        }
    };

    const confirmDelete = () => {
        if (!taskToDelete || !firestore) return;
        if (!isAdmin) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete tasks.' });
            return;
        }

        deleteDoc(doc(firestore, 'tasks', taskToDelete.id))
            .then(() => {
                toast({ title: 'Task Deleted', description: `Task "${taskToDelete.taskName}" has been removed.` });
                setIsDeleteDialogOpen(false);
                setTaskToDelete(null);
            })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: `tasks/${taskToDelete.id}`,
                    operation: 'delete'
                });
                errorEmitter.emit('permission-error', permissionError);
                setIsDeleteDialogOpen(false);
                setTaskToDelete(null);
            });
    };
    
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
             <Card>
                <CardHeader>
                    <CardTitle>All Assigned Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task Name</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Assigned By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submission</TableHead>
                                {isAdmin && <TableHead>Action</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.taskName}</TableCell>
                                    <TableCell>{getEmployeeName(task.assignedTo)}</TableCell>
                                    <TableCell>{task.assignedBy}</TableCell>
                                    <TableCell>{task.status}</TableCell>
                                    <TableCell>
                                        {task.submissionUrl ? (
                                            <Button variant="link" asChild>
                                                <a href={task.submissionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" /> View Submission
                                                </a>
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    {isAdmin && (
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {task.status === 'pending-approval' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleApprove(task)} title="Approve Task">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(task)} title="Delete Task">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the task "{taskToDelete?.taskName}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
