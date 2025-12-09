
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Clock, XCircle, Briefcase, PlusCircle, Save, Download, Loader2, Trash2, Eye, Upload, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useFirebase } from '@/firebase/provider';
import { collection, onSnapshot, query, where, doc, updateDoc, type Timestamp, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { differenceInDays, parseISO } from 'date-fns';
import { useRecords } from '@/context/RecordContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
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

function formatDepartmentName(slug: string) {
    return departments[slug] || slug;
}

export interface Project {
  id: string;
  projectName: string;
  taskName: string;
  taskDescription: string;
  status: 'completed' | 'in-progress' | 'not-started';
  startDate: string;
  endDate: string;
  assignedBy: string;
  assignedTo: string;
  submissionUrl?: string;
  submissionFileName?: string;
}


type ProjectRow = {
  id: number;
  projectName: string;
  detail: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
}

type ProjectStatus = 'completed' | 'in-progress' | 'not-started';

const StatusIcon = ({ status }: { status: Project['status'] | ProjectStatus }) => {
    switch (status) {
        case 'completed':
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case 'in-progress':
            return <Clock className="h-5 w-5 text-blue-500" />;
        case 'not-started':
            return <XCircle className="h-5 w-5 text-red-500" />;
        default:
            return null;
    }
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
  const isAdmin = currentUser?.role && ['admin', 'ceo', 'software-engineer'].includes(currentUser.role);

  const employeeId = searchParams.get('employeeId');
  const displayUser = useMemo(() => {
    return employeeId ? employees.find(e => e.record === employeeId) : currentUser;
  }, [employeeId, employees, currentUser]);
    
  const canEdit = useMemo(() => {
    if (!currentUser || !displayUser) return false;
    return isAdmin || currentUser.uid === displayUser.uid;
  }, [currentUser, displayUser, isAdmin]);

  const { tasks: projects, isLoading: isLoadingTasks } = useTasks(displayUser?.uid);

  const [rows, setRows] = useState<ProjectRow[]>([{ id: 1, projectName: '', detail: '', status: 'not-started', startDate: '', endDate: '' }]);
  const [schedule, setSchedule] = useState({ start: '', end: '' });
  const [remarks, setRemarks] = useState('');
  const [numberOfDays, setNumberOfDays] = useState<number | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ProjectRow | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Project | null>(null);
  const [isTaskViewDialogOpen, setIsTaskViewDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<Project | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  

  useEffect(() => {
    if (schedule.start && schedule.end) {
      const start = parseISO(schedule.start);
      const end = parseISO(schedule.end);
      const diff = differenceInDays(end, start);
      setNumberOfDays(diff >= 0 ? diff + 1 : 0);
    } else {
      setNumberOfDays(null);
    }
  }, [schedule.start, schedule.end]);
  
  const filteredRows = useMemo(() => {
    if (!schedule.start || !schedule.end) {
        return rows;
    }

    const scheduleStart = parseISO(schedule.start);
    const scheduleEnd = parseISO(schedule.end);

    return rows.filter(row => {
        if (!row.startDate || !row.endDate) return false;
        const projectStart = parseISO(row.startDate);
        const projectEnd = parseISO(row.endDate);
        
        return projectStart <= scheduleEnd && projectEnd >= scheduleStart;
    });
}, [rows, schedule.start, schedule.end]);


    const projectStats = useMemo(() => {
        const source = filteredRows.length > 0 ? filteredRows : rows;
        const total = source.length;
        const completed = source.filter(p => p.status === 'completed').length;
        const inProgress = source.filter(p => p.status === 'in-progress').length;
        const notStarted = source.filter(p => p.status === 'not-started').length;
        return { total, completed, inProgress, notStarted };
    }, [filteredRows, rows]);
    

    const openSubmitDialog = (task: Project) => {
        if (!canEdit) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot submit work for this task.' });
            return;
        }
        setSubmittingTask(task);
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
                        status: 'completed',
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
                        title: 'Submission Successful',
                        description: 'Your work has been submitted and the task is marked as complete.',
                        duration: 5000,
                    });
                    
                } catch (error) {
                    toast({
                        id: toastId,
                        variant: 'destructive',
                        title: 'Update Failed',
                        description: 'Could not update task status.',
                        duration: 5000,
                    });
                } finally {
                    setSubmittingTask(null);
                    setSubmissionFile(null);
                }
            }
        );
    };

  const handleStatusChange = async (taskId: string, newStatus: Project['status']) => {
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

  const handleRowChange = (id: number, field: keyof ProjectRow, value: any) => {
      setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
      setRows([...rows, { id: Date.now(), projectName: '', detail: '', status: 'not-started', startDate: '', endDate: '' }]);
  };
  
  const removeRow = (id: number) => {
      setRows(rows.filter(row => row.id !== id));
  };

  const openViewDialog = (record: ProjectRow) => {
    setViewingRecord(record);
    setIsViewDialogOpen(true);
  };
  
  const openTaskViewDialog = (task: Project) => {
      setViewingTask(task);
      setIsTaskViewDialogOpen(true);
  };

  const openDeleteDialog = (task: Project) => {
      setTaskToDelete(task);
      setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!firestore || !taskToDelete) return;
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot delete tasks.' });
      return;
    }
    
    try {
        await deleteDoc(doc(firestore, "tasks", taskToDelete.id));
        toast({ title: 'Task Deleted', description: `Task "${taskToDelete.taskName}" has been removed.` });
        setIsDeleteDialogOpen(false);
        setTaskToDelete(null);
    } catch(err) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `tasks/${taskToDelete.id}`, operation: 'delete' }));
        setIsDeleteDialogOpen(false);
        setTaskToDelete(null);
    }
  };


  const handleSave = () => {
    if (!displayUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        return;
    }
    const recordToSave = {
        fileName: "My Projects",
        projectName: `Projects for ${displayUser.name}`,
        data: [{
            category: 'My Projects',
            items: [
                { label: 'Work Schedule Start', value: schedule.start },
                { label: 'Work Schedule End', value: schedule.end },
                ...rows.map(r => ({ label: `Project: ${r.projectName}`, value: `Detail: ${r.detail}, Status: ${r.status}, Start: ${r.startDate}, End: ${r.endDate}`}))
            ],
            schedule: schedule,
            remarks: remarks,
        }]
    };
    addRecord(recordToSave as any);
  };

  const handleDownloadPdf = () => {
    if (!displayUser) return;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const footerText = "M/S Isbah Hassan & Associates";
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${displayUser.name}'s Project Schedule`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(10);
    (doc as any).autoTable({
        startY: yPos,
        theme: 'plain',
        body: [
            ['Schedule Period:', `${schedule.start || 'N/A'} to ${schedule.end || 'N/A'}`],
            ['Total Days:', numberOfDays !== null ? `${numberOfDays} days` : 'N/A'],
        ],
    });
    yPos = (doc as any).autoTable.previous.finalY + 10;
    
    (doc as any).autoTable({
        startY: yPos,
        head: [['Project Name', 'Detail', 'Status', 'Start Date', 'End Date']],
        body: filteredRows.map(row => [row.projectName, row.detail, row.status, row.startDate, row.endDate]),
        theme: 'grid',
        headStyles: { fillColor: [45, 95, 51] },
    });
    yPos = (doc as any).autoTable.previous.finalY + 10;

    if (remarks) {
        doc.setFont('helvetica', 'bold');
        doc.text('Remarks:', 14, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        const splitRemarks = doc.splitTextToSize(remarks, doc.internal.pageSize.getWidth() - 28);
        doc.text(splitRemarks, 14, yPos);
    }
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`${displayUser.name}_Project_Schedule.pdf`);
    toast({ title: 'Download Started', description: 'Your project schedule PDF is being generated.' });
  };


  const handleDownloadTaskPdf = (task: Project) => {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      const footerText = "M/S Isbah Hassan & Associates";
      let yPos = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Task Details: ${task.taskName}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(10);
      (doc as any).autoTable({
          startY: yPos,
          theme: 'grid',
          head: [['Field', 'Details']],
          body: [
              ['Project Name', task.projectName],
              ['Task Name', task.taskName],
              ['Description', task.taskDescription],
              ['Assigned By', task.assignedBy],
              ['Start Date', task.startDate],
              ['End Date', task.endDate],
              ['Status', task.status],
          ],
          headStyles: { fillColor: [45, 95, 51] }
      });
      yPos = (doc as any).autoTable.previous.finalY + 10;
      
      const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
        }

      doc.save(`Task_${task.taskName.replace(/\s+/g, '_')}.pdf`);
      toast({ title: 'Download Started', description: 'Your task PDF is being generated.' });
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
                  <CardDescription className="text-xl text-primary/90 font-semibold pt-1">Welcome to {formatDepartmentName(displayUser.department)} Panel</CardDescription>
                </>
            </CardHeader>
        </Card>
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
                                <TableHead>Project</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Assigned By</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submission</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.length === 0 ? (
                            <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24">No tasks assigned.</TableCell>
                            </TableRow>
                            ) : projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell>{project.projectName}</TableCell>
                                    <TableCell>{project.taskName}</TableCell>
                                    <TableCell>{project.assignedBy}</TableCell>
                                    <TableCell>{project.startDate || 'N/A'}</TableCell>
                                    <TableCell>{project.endDate || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={project.status}
                                            onValueChange={(newStatus: Project['status']) => handleStatusChange(project.id, newStatus)}
                                            disabled={!canEdit}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                            <div className="flex items-center gap-2">
                                                <StatusIcon status={project.status} />
                                                <SelectValue placeholder="Set status" />
                                            </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                            <SelectItem value="not-started">
                                                <div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-500" />Not Started</div>
                                            </SelectItem>
                                            <SelectItem value="in-progress">
                                                <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" />In Progress</div>
                                            </SelectItem>
                                            <SelectItem value="completed">
                                                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" />Completed</div>
                                            </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        {project.submissionUrl ? (
                                            <Button variant="link" asChild>
                                                <a href={project.submissionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                    <File className="h-4 w-4" /> View Submission
                                                </a>
                                            </Button>
                                        ) : canEdit ? (
                                             <Button variant="outline" size="sm" onClick={() => openSubmitDialog(project)}>
                                                <Upload className="h-4 w-4 mr-2" /> Submit Work
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">Not Submitted</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openTaskViewDialog(project)} title="View Task Details">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDownloadTaskPdf(project)} title="Download Task Details">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        {isAdmin && (
                                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(project)} title="Delete Task">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
        
        <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Projects" value={projectStats.total} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Completed" value={projectStats.completed} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
                    <StatCard title="In Progress" value={projectStats.inProgress} icon={<Clock className="h-4 w-4 text-blue-500" />} />
                    <StatCard title="Not Started" value={projectStats.notStarted} icon={<XCircle className="h-4 w-4 text-red-500" />} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{canEdit ? "My" : `${displayUser.name}'s`} Project Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-semibold">Work Schedule</Label>
                            <div className="flex flex-wrap items-center gap-4">
                                <Input type="date" value={schedule.start} onChange={e => setSchedule({ ...schedule, start: e.target.value })} className="w-auto" disabled={!canEdit}/>
                                <span>to</span>
                                <Input type="date" value={schedule.end} onChange={e => setSchedule({ ...schedule, end: e.target.value })} className="w-auto" disabled={!canEdit}/>
                                {numberOfDays !== null && (
                                    <div className="font-medium text-primary rounded-md px-3 py-2 bg-primary/10">
                                        {numberOfDays} days
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project Name</TableHead>
                                        <TableHead>Detail</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRows.map(row => (
                                        <TableRow key={row.id}>
                                            <TableCell><Input value={row.projectName} onChange={e => handleRowChange(row.id, 'projectName', e.target.value)} disabled={!canEdit} /></TableCell>
                                            <TableCell><Textarea value={row.detail} onChange={e => handleRowChange(row.id, 'detail', e.target.value)} rows={1} disabled={!canEdit} /></TableCell>
                                            <TableCell>
                                                <Select value={row.status} onValueChange={(val: ProjectStatus) => handleRowChange(row.id, 'status', val)} disabled={!canEdit}>
                                                    <SelectTrigger className="w-[180px]">
                                                    <div className="flex items-center gap-2">
                                                        <StatusIcon status={row.status} />
                                                        <SelectValue placeholder="Set status" />
                                                    </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                    <SelectItem value="not-started"><div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-500" />Not Started</div></SelectItem>
                                                    <SelectItem value="in-progress"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" />In Progress</div></SelectItem>
                                                    <SelectItem value="completed"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" />Completed</div></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell><Input type="date" value={row.startDate} onChange={e => handleRowChange(row.id, 'startDate', e.target.value)} disabled={!canEdit} /></TableCell>
                                            <TableCell><Input type="date" value={row.endDate} onChange={e => handleRowChange(row.id, 'endDate', e.target.value)} disabled={!canEdit} /></TableCell>
                                             <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => openViewDialog(row)}><Eye className="h-4 w-4" /></Button>
                                                {canEdit && <Button variant="destructive" size="icon" onClick={() => removeRow(row.id)}><Trash2 className="h-4 w-4" /></Button>}
                                             </TableCell>
                                        </TableRow>
                                    ))}
                                     {filteredRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">
                                                No projects match the current date range.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {canEdit && <Button onClick={addRow} size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Add Project</Button>}

                        <div className="space-y-2 pt-4">
                            <Label htmlFor="remarks" className="font-semibold">Remarks</Label>
                            <Textarea id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)} disabled={!canEdit} />
                        </div>
                        
                        <div className="flex justify-end gap-4 mt-8">
                            {canEdit && <Button onClick={handleSave} variant="outline"><Save className="mr-2 h-4 w-4"/>Save Record</Button>}
                            <Button onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewingRecord?.projectName}</DialogTitle>
                        <DialogDescription>
                             <span className="flex items-center gap-2">
                                <StatusIcon status={viewingRecord?.status || 'not-started'} />
                                {viewingRecord?.status}
                             </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <p><span className="font-semibold">Detail:</span> {viewingRecord?.detail}</p>
                        <p><span className="font-semibold">Start Date:</span> {viewingRecord?.startDate}</p>
                        <p><span className="font-semibold">End Date:</span> {viewingRecord?.endDate}</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isTaskViewDialogOpen} onOpenChange={setIsTaskViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewingTask?.taskName}</DialogTitle>
                         <DialogDescription>Project: {viewingTask?.projectName}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                         <p><span className="font-semibold">Description:</span> {viewingTask?.taskDescription}</p>
                         <p><span className="font-semibold">Assigned By:</span> {viewingTask?.assignedBy}</p>
                        <p><span className="font-semibold">Start Date:</span> {viewingTask?.startDate}</p>
                        <p><span className="font-semibold">End Date:</span> {viewingTask?.endDate}</p>
                         <p className="flex items-center gap-2"><span className="font-semibold">Status:</span> <StatusIcon status={viewingTask?.status || 'not-started'} /> {viewingTask?.status}</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsTaskViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Work for "{submittingTask?.taskName}"</DialogTitle>
                        <DialogDescription>
                            Upload your completed work file. This will mark the task as complete.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="submission-file">File</Label>
                        <Input id="submission-file" type="file" onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleFileSubmit} disabled={!submissionFile}>
                           Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task "{taskToDelete?.taskName}".
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
