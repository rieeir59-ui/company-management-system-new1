
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
import { useRecords } from '@/context/RecordContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTasks, type Project as Task } from '@/hooks/use-tasks';
import { StatusBadge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const departments: Record<string, string> = {
    'ceo': 'CEO',
    'admin': 'Admin',
    'hr': 'HR',
    'software-engineer': 'Software Engineer',
    'draftpersons': 'Draftsperson',
    '3d-visualizer': '3D Visualizer',
    'architects': 'Architects',
    'finance': 'Finance',
    'quantity-management': 'Quantity Management',
};

function formatDepartmentName(slug: string) {
    return departments[slug] || slug;
}

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

type ManualEntry = {
    id: number;
    projectName: string;
    detail: string;
    status: string;
    startDate: string;
    endDate: string;
};

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
  
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<Task | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [schedule, setSchedule] = useState({ start: '', end: '' });
  const [remarks, setRemarks] = useState('');
 
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

    const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
        if (!firestore || !currentUser) return;
        
        if (!canEdit) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You can only update your own tasks.' });
            return;
        }

        const taskRef = doc(firestore, 'tasks', task.id);
        try {
            await updateDoc(taskRef, { status: newStatus });
            toast({
                title: 'Status Updated',
                description: `Task status changed to ${newStatus.replace('-', ' ')}.`,
            });
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: `tasks/${task.id}`,
                operation: 'update',
                requestResourceData: { status: newStatus }
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };
  
    const openViewDialog = (task: Task) => {
        setViewingTask(task);
        setIsViewDialogOpen(true);
    };
    
    const combinedSchedule = useMemo(() => {
        const assigned = allProjects.map(p => ({
            id: p.id,
            projectName: p.projectName,
            detail: p.taskName,
            status: p.status,
            startDate: p.startDate,
            endDate: p.endDate,
            isManual: false,
        }));
        const manual = manualEntries.map(e => ({ ...e, isManual: true }));
        return [...assigned, ...manual];
    }, [allProjects, manualEntries]);

    const addManualEntry = () => {
        setManualEntries(prev => [...prev, {
            id: Date.now(),
            projectName: '',
            detail: '',
            status: 'Not Started',
            startDate: '',
            endDate: '',
        }]);
    };

    const handleManualEntryChange = (id: number, field: keyof ManualEntry, value: string) => {
        setManualEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const removeManualEntry = (id: number) => {
        setManualEntries(prev => prev.filter(e => e.id !== id));
    };

    const handleSaveSchedule = async () => {
        await addRecord({
            fileName: 'My Projects',
            projectName: `${displayUser?.name}'s Project Schedule`,
            data: [{
                category: "My Project Schedule",
                schedule: schedule,
                remarks: remarks,
                items: combinedSchedule.map(item => ({
                    label: `Project: ${item.projectName}`,
                    value: `Detail: ${item.detail}, Status: ${item.status}, Start: ${item.startDate}, End: ${item.endDate}`,
                })),
            }],
        } as any);
    };
    
    const handleDownloadSchedule = () => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('My Project Schedule', 14, 22);
      doc.setFontSize(10);
      doc.text(`Employee: ${displayUser?.name}`, 14, 30);
      doc.text(`Schedule: ${schedule.start || ''} to ${schedule.end || ''}`, 14, 36);

      const body = combinedSchedule.map(item => [item.projectName, item.detail, item.status, item.startDate, item.endDate]);

      (doc as any).autoTable({
          startY: 42,
          head: [['Project Name', 'Detail', 'Status', 'Start Date', 'End Date']],
          body: body,
          headStyles: { fillColor: [22, 163, 74] }, // Tailwind's `bg-primary` color
      });
      
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Remarks:', 14, finalY);
      doc.text(remarks, 14, finalY + 5);

      doc.save('my-project-schedule.pdf');
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
            <StatCard title="Total Tasks" value={projectStats.total} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Completed" value={projectStats.completed} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
            <StatCard title="In Progress" value={projectStats.inProgress} icon={<Clock className="h-4 w-4 text-blue-500" />} />
            <StatCard title="Not Started" value={projectStats.notStarted} icon={<XCircle className="h-4 w-4 text-red-500" />} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>{canEdit ? "My" : `${displayUser.name}'s`} Assigned Tasks</CardTitle>
                <CardDescription>A list of tasks assigned by the administration.</CardDescription>
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
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium text-base">{project.taskName}</TableCell>
                                    <TableCell className="text-base">{project.assignedBy}</TableCell>
                                    <TableCell className="text-base">{project.startDate || 'N/A'}</TableCell>
                                    <TableCell className="text-base">{project.endDate || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={project.status}
                                            onValueChange={(newStatus: Task['status']) => handleStatusChange(project, newStatus)}
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
                <CardDescription>Manually add and track your own project tasks and schedules.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <Input type="date" value={schedule.start} onChange={(e) => setSchedule(s => ({...s, start: e.target.value}))} />
                    <Input type="date" value={schedule.end} onChange={(e) => setSchedule(s => ({...s, end: e.target.value}))} />
                </div>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Detail</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedSchedule.map(item => (
                             <TableRow key={item.id}>
                                <TableCell>
                                    {item.isManual ? <Input value={item.projectName} onChange={(e) => handleManualEntryChange(item.id, 'projectName', e.target.value)} /> : item.projectName}
                                </TableCell>
                                <TableCell>
                                    {item.isManual ? <Input value={item.detail} onChange={(e) => handleManualEntryChange(item.id, 'detail', e.target.value)} /> : item.detail}
                                </TableCell>
                                <TableCell>
                                    {item.isManual ? <Input value={item.status} onChange={(e) => handleManualEntryChange(item.id, 'status', e.target.value)} /> : <StatusBadge status={item.status as Task['status']} />}
                                </TableCell>
                                <TableCell>
                                    {item.isManual ? <Input type="date" value={item.startDate} onChange={(e) => handleManualEntryChange(item.id, 'startDate', e.target.value)} /> : item.startDate}
                                </TableCell>
                                <TableCell>
                                    {item.isManual ? <Input type="date" value={item.endDate} onChange={(e) => handleManualEntryChange(item.id, 'endDate', e.target.value)} /> : item.endDate}
                                </TableCell>
                                <TableCell>
                                    {item.isManual && <Button variant="ghost" size="icon" onClick={() => removeManualEntry(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button onClick={addManualEntry} className="mt-4"><PlusCircle className="h-4 w-4 mr-2" /> Add Project</Button>
                <div className="mt-4">
                    <Label htmlFor="remarks">Remarks:</Label>
                    <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleSaveSchedule}><Save className="h-4 w-4 mr-2"/>Save Schedule</Button>
                <Button onClick={handleDownloadSchedule}><Download className="h-4 w-4 mr-2" />Download PDF</Button>
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
