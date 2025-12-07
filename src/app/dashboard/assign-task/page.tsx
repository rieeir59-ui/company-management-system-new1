
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Briefcase, XCircle, Clock, CheckCircle2, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { type Employee } from '@/lib/employees';
import DashboardPageHeader from '@/components/dashboard/PageHeader';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState, useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { collection, onSnapshot, query, where, doc, deleteDoc, type Timestamp } from 'firebase/firestore';
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

const departments = [
    { name: 'ADMIN', slug: 'admin' },
    { name: 'HR', slug: 'hr' },
    { name: 'SOFTWARE ENGINEER', slug: 'software-engineer' },
    { name: 'DRAFTMAN', slug: 'draftman' },
    { name: '3D VISULIZER', slug: '3d-visualizer' },
    { name: 'ARCHITECTS', slug: 'architects' },
    { name: 'FINANCE', slug: 'finance' },
    { name: 'QUANTITY MANAGEMENT', slug: 'quantity-management' },
];

interface Task {
  id: string;
  taskName: string;
  assignedTo: string;
  assignedBy: string;
  createdAt: Timestamp;
  dueDate?: string;
  endDate?: string;
  status: 'completed' | 'in-progress' | 'not-started';
  submissionUrl?: string;
  submissionFileName?: string;
}

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
            if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
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
    const { user: currentUser, employees, employeesByDepartment, isUserLoading } = useCurrentUser();
    const image = PlaceHolderImages.find(p => p.id === 'assign-task');
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const isAdmin = currentUser?.role && ['admin', 'ceo', 'software-engineer'].includes(currentUser.role);

    const [tasks, setTasks] = useState<Task[]>([]);
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

    useEffect(() => {
        if (isUserLoading || !currentUser || !firestore) return;

        const q = query(collection(firestore, 'tasks'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(fetchedTasks);
        }, (err) => {
            const permissionError = new FirestorePermissionError({
                path: `tasks`,
                operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        return () => unsubscribe();
    }, [firestore, currentUser, isUserLoading]);

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(e => e.uid === employeeId);
        return employee?.name || employeeId;
    };
    
    const openDeleteDialog = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteDialogOpen(true);
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
                                <TableHead>Assigned Date</TableHead>
                                <TableHead>Due Date</TableHead>
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
                                    <TableCell>{task.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell>{task.endDate || 'N/A'}</TableCell>
                                    <TableCell>
                                        {task.submissionUrl ? (
                                            <Button variant="link" asChild>
                                                <a href={task.submissionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" /> View File
                                                </a>
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    {isAdmin && (
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(task)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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


    

    


