'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Clock, XCircle, Briefcase, PlusCircle, Save, Download, Loader2, Trash2, Eye, Upload, File as FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRecords } from '@/context/RecordContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTasks, type Project as Task } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

const StatusBadge = ({ status }: { status: Task['status'] }) => {
    const statusConfig = {
        'completed': { icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
        'pending-approval': { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending Approval' },
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

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

function MyProjectsComponent() {
  const { user: currentUser, employees, isUserLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore, firebaseApp } = useFirebase();
  const { addRecord } = useRecords();
  const storage = firebaseApp ? getStorage(firebaseApp) : null;
  const isAdmin = currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d));

  const employeeId = searchParams.get('employeeId');
  const displayUser = useMemo(() => {
    return employeeId ? employees.find(e => e.record === employeeId) : currentUser;
  }, [employeeId, employees, currentUser]);
    
  const canEdit = useMemo(() => {
    if (!currentUser || !displayUser) return false;
    return isAdmin || currentUser.uid === displayUser.uid;
  }, [currentUser, displayUser, isAdmin]);

  const { tasks: allProjects, isLoading: isLoadingTasks } = useTasks(displayUser?.uid);
  
  const [scheduleEntries, setScheduleEntries] = useState<Task[]>([]);
  
  useEffect(() => {
    setScheduleEntries(allProjects);
  }, [allProjects]);


  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<Task | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [remarks, setRemarks] = useState('');
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleEndDate, setScheduleEndDate] = useState('');

  const projectStats = useMemo(() => {
      const total = allProjects.length;
      const completed = allProjects.filter(p => p.status === 'completed').length;
      const inProgress = allProjects.filter(p => p.status === 'in-progress' || p.status === 'pending-approval').length;
      const notStarted = allProjects.filter(p => p.status === 'not-started').length;
      return { total, completed, inProgress, notStarted };
  }, [allProjects]);
    

    const openSubmitDialog = (task: Task) => {
        if (!canEdit) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot submit work for this task.' });
            return;
        }
        setSubmittingTask(task);
        setSubmissionFile(null);
        setIsSubmitDialogOpen(true);
    };

    const handleFileSubmit = () => {
        if (!firestore || !submittingTask || !submissionFile || !storage || !currentUser) return;
    
        setIsSubmitDialogOpen(false);
        
        const { id: toastId } = toast({
          title: 'Uploading File...',
          description: <Progress value={0} className="w-full" />,
          duration: Infinity,
        });

        const filePath = `submissions/${submittingTask.id}/${submissionFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, submissionFile);
    
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                toast({
                    id: toastId,
                    title: `Uploading ${submissionFile.name}...`,
                    description: <Progress value={progress} className="w-full" />,
                    duration: Infinity,
                });
            },
            (error) => {
                console.error("Upload failed:", error);
                 toast({
                    id: toastId,
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: 'Could not upload your file. Please try again.',
                    duration: 5000,
                });
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const taskRef = doc(firestore, 'tasks', submittingTask.id);
                try {
                    await updateDoc(taskRef, { 
                        status: 'pending-approval',
                        submissionUrl: downloadURL,
                        submissionFileName: submissionFile.name,
                    });
                    
                    await addRecord({
                        fileName: 'Task Submission',
                        projectName: submittingTask.projectName,
                        data: [{
                            category: 'Task Submission Details',
                            items: [
                                { label: 'Task', value: submittingTask.taskName },
                                { label: 'Submitted By', value: currentUser.name },
                                { label: 'File Name', value: submissionFile.name },
                                { label: 'File Link', value: downloadURL },
                            ]
                        }]
                    } as any);

                    toast({
                        id: toastId,
                        title: 'Submission Sent for Approval',
                        description: 'Your work has been submitted and the task is pending approval.',
                        duration: 5000,
                    });
                    
                } catch (error) {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `tasks/${submittingTask.id}`,
                        operation: 'update',
                        requestResourceData: { status: 'pending-approval' },
                    }));
                } finally {
                    setSubmittingTask(null);
                    setSubmissionFile(null);
                }
            }
        );
    };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!firestore) return;
    if (!canEdit) {
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to change the status of this task.",
        });
        return;
    }

    const taskRef = doc(firestore, 'tasks', taskId);
    try {
      await updateDoc(taskRef, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Task status changed to ${newStatus.replace('-', ' ')}.`,
      });
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: `tasks/${taskId}`,
        operation: 'update',
        requestResourceData: { status: newStatus }
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  };
  
    const handleScheduleEntryChange = (id: number, field: keyof Task, value: string) => {
        setScheduleEntries(prev => prev.map(entry => (entry.id === id ? { ...entry, [field]: value } : entry)));
    };

    const addScheduleEntry = () => {
        setScheduleEntries(prev => [...prev, { id: Date.now(), taskName: 'New Project', projectName: 'New Project', taskDescription: '', status: 'not-started', startDate: '', endDate: '', assignedBy: currentUser?.name || '', assignedTo: displayUser?.uid || '' , createdAt: new Date() as any }]);
    };
    
    const removeScheduleEntry = (id: number) => {
        setScheduleEntries(prev => prev.filter(entry => entry.id !== id));
    };

    const handleSaveSchedule = async () => {
        if (!canEdit) {
            toast({ variant: 'destructive', title: 'Permission Denied' });
            return;
        }

        try {
            await addRecord({
                fileName: 'My Projects',
                projectName: `${displayUser?.name}'s Project Schedule`,
                data: [{
                    category: 'My Project Schedule',
                    schedule: { start: scheduleStartDate, end: scheduleEndDate },
                    remarks: remarks,
                    items: scheduleEntries.map(entry => ({
                        label: `Project: ${entry.projectName}`,
                        value: `Detail: ${entry.taskDescription}, Status: ${entry.status}, Start: ${entry.startDate}, End: ${entry.endDate}`
                    }))
                }]
            } as any);

        } catch (error) {
           // error is handled by context
        }
    };

  const openViewDialog = (task: Task) => {
    setViewingTask(task);
    setIsViewDialogOpen(true);
  };
  
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
                  <CardDescription className="text-xl text-primary/90 font-semibold pt-1">Welcome to {formatDepartmentName(displayUser.departments[0])} Panel</CardDescription>
                </>
            </CardHeader>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Tasks (All Time)" value={projectStats.total} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Completed" value={projectStats.completed} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
            <StatCard title="In Progress" value={projectStats.inProgress} icon={<Clock className="h-4 w-4 text-blue-500" />} />
            <StatCard title="Not Started" value={projectStats.notStarted} icon={<XCircle className="h-4 w-4 text-red-500" />} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>{canEdit ? "My" : `${displayUser.name}'s`} Assigned Tasks</CardTitle>
                <CardDescription>A list of tasks assigned to this employee.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingTasks ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="ml-4">Loading tasks...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-semibold">Task</TableHead>
                                <TableHead className="font-semibold">Assigned By</TableHead>
                                <TableHead className="font-semibold">Start Date</TableHead>
                                <TableHead className="font-semibold">End Date</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allProjects.length === 0 ? (
                            <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No tasks assigned yet.</TableCell>
                            </TableRow>
                            ) : allProjects.map((project) => (
                                <TableRow key={project.id} className="text-base">
                                    <TableCell className="font-medium">{project.taskName}</TableCell>
                                    <TableCell>{project.assignedBy}</TableCell>
                                    <TableCell>{project.startDate || 'N/A'}</TableCell>
                                    <TableCell>{project.endDate || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={project.status}
                                            onValueChange={(newStatus: Task['status']) => handleStatusChange(project.id, newStatus)}
                                            disabled={!canEdit || project.status === 'pending-approval'}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                              <StatusBadge status={project.status} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="not-started">Not Started</SelectItem>
                                                <SelectItem value="in-progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(project)}>
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openSubmitDialog(project)} disabled={!canEdit}>
                                                <Upload className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>My Project Schedule</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2 mb-4">
                    <Label>Work Schedule</Label>
                    <div className="flex gap-2 items-center">
                        <Input type="date" value={scheduleStartDate} onChange={e => setScheduleStartDate(e.target.value)} />
                        <span>to</span>
                        <Input type="date" value={scheduleEndDate} onChange={e => setScheduleEndDate(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-semibold">Project Name</TableHead>
                                <TableHead className="font-semibold">Detail</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Start Date</TableHead>
                                <TableHead className="font-semibold">End Date</TableHead>
                                <TableHead className="font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scheduleEntries.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell><Input value={entry.projectName} onChange={e => handleScheduleEntryChange(entry.id, 'projectName', e.target.value)} className="text-base border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted p-1"/></TableCell>
                                    <TableCell><Textarea value={entry.taskDescription} onChange={e => handleScheduleEntryChange(entry.id, 'taskDescription', e.target.value)} rows={1} className="text-base border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted p-1" /></TableCell>
                                    <TableCell>
                                        <Select value={entry.status} onValueChange={(v: Task['status']) => handleScheduleEntryChange(entry.id, 'status', v)}>
                                            <SelectTrigger className="text-base border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted p-1"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                 <SelectItem value="not-started">Not Started</SelectItem>
                                                 <SelectItem value="in-progress">In Progress</SelectItem>
                                                 <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell><Input type="date" value={entry.startDate} onChange={e => handleScheduleEntryChange(entry.id, 'startDate', e.target.value)} className="text-base border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted p-1"/></TableCell>
                                    <TableCell><Input type="date" value={entry.endDate} onChange={e => handleScheduleEntryChange(entry.id, 'endDate', e.target.value)} className="text-base border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-muted p-1"/></TableCell>
                                    <TableCell className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(entry)}><Eye className="h-4 w-4"/></Button>
                                        <Button variant="destructive" size="icon" onClick={() => removeScheduleEntry(entry.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Button onClick={addScheduleEntry} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>
            </CardContent>
             <CardFooter className="flex-col items-start gap-4">
                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add any remarks here..."/>
                </div>
                <div className="flex justify-end w-full gap-2">
                    <Button variant="outline" onClick={handleSaveSchedule}><Save className="mr-2 h-4 w-4" /> Save Schedule</Button>
                    <Button asChild><Link href="/employee-dashboard/my-projects"><Eye className="mr-2 h-4 w-4" /> View Project Report</Link></Button>
                </div>
            </CardFooter>
        </Card>
        
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Work for "{submittingTask?.taskName}"</DialogTitle>
                    <DialogDescription>
                        Upload your completed work file. This will mark the task as pending for approval.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="submission-file">File</Label>
                    <Input id="submission-file" type="file" onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)} />
                    {submissionFile && <p className="text-sm text-muted-foreground mt-2">{submissionFile.name}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleFileSubmit} disabled={!submissionFile}>
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{viewingTask?.taskName}</DialogTitle>
                    <DialogDescription>Project: {viewingTask?.projectName}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p><strong className="w-28 inline-block">Description:</strong> {viewingTask?.taskDescription || 'N/A'}</p>
                    <p><strong className="w-28 inline-block">Assigned By:</strong> {viewingTask?.assignedBy}</p>
                    <p><strong className="w-28 inline-block">Start Date:</strong> {viewingTask?.startDate || 'N/A'}</p>
                    <p><strong className="w-28 inline-block">End Date:</strong> {viewingTask?.endDate || 'N/A'}</p>
                    <div className="flex items-center gap-2"><strong className="w-28 inline-block">Status:</strong> <StatusBadge status={viewingTask?.status || 'not-started'} /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

export default function EmployeeDashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Loading Page...</span>
      </div>}>
      <MyProjectsComponent />
    </Suspense>
  )
}
