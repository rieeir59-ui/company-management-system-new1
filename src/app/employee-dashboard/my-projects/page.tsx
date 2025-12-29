
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Clock, XCircle, Briefcase, PlusCircle, Save, Download, Loader2, Trash2, Eye, Upload, File as FileIcon, Edit } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color?: string }) => (
  <Card className={cn("text-center", color)}>
    <CardContent className="p-4">
      <div className={cn("mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full", color ? "bg-white/20" : "bg-primary/20")}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium text-current/80">{title}</p>
    </CardContent>
  </Card>
);

type ManualEntry = {
    id: number;
    projectName: string;
    detail: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    startDate: string;
    endDate: string;
};

function MyProjectsComponent() {
  const { user: currentUser, employees, isUserLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore, firebaseApp } = useFirebase();
  const { addOrUpdateRecord, records } = useRecords();
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
  const [editingEntry, setEditingEntry] = useState<ManualEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<ManualEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [remarks, setRemarks] = useState('');
 
  useEffect(() => {
    if (!displayUser) return;
    const scheduleRecord = records.find(r => r.fileName === 'My Projects' && r.employeeId === displayUser.uid);
    if (scheduleRecord && scheduleRecord.data) {
        const scheduleData = scheduleRecord.data.find((d: any) => d.category === 'My Project Schedule');
        if (scheduleData) {
            setRemarks(scheduleData.remarks || '');
            const savedManualEntries = (scheduleData.items || [])
                .map((item: {label:string, value:string}) => {
                    const detailMatch = item.value.match(/Detail: (.*?),/);
                    const statusMatch = item.value.match(/Status: (.*?),/);
                    const startMatch = item.value.match(/Start: (.*?),/);
                    const endMatch = item.value.match(/End: (.*)/);
                    return {
                        id: Math.random(),
                        projectName: item.label.replace('Project: ', ''),
                        detail: detailMatch ? detailMatch[1] : '',
                        status: statusMatch ? statusMatch[1] : 'Not Started',
                        startDate: startMatch ? startMatch[1] : '',
                        endDate: endMatch ? endMatch[1] : ''
                    };
                })
                .filter((item: ManualEntry) => item.projectName); // Filter out potentially empty items
            setManualEntries(savedManualEntries);
        }
    }
  }, [records, displayUser]);
 
  const combinedSchedule = useMemo(() => {
        const assigned = allProjects.map(p => ({
            ...p,
            detail: p.taskName,
            isManual: false,
        }));
        const manual = manualEntries.map(e => ({ ...e, isManual: true }));
        // Ensure manual entries have all fields to match Task type for simplicity in table
        const normalizedManual = manual.map(m => ({
            ...m,
            taskName: m.detail,
            taskDescription: m.detail,
            assignedBy: currentUser?.name || '',
            assignedTo: currentUser?.uid || '',
            createdAt: new Date() as any,
        }))
        return [...assigned, ...normalizedManual];
    }, [allProjects, manualEntries, currentUser]);
    
  const projectStats = useMemo(() => {
      const allItems = combinedSchedule;
      const total = allItems.length;
      const completed = allItems.filter(p => p.status === 'completed' || p.status === 'Completed').length;
      const inProgress = allItems.filter(p => p.status === 'in-progress' || p.status === 'In Progress' || p.status === 'pending-approval').length;
      const notStarted = allItems.filter(p => p.status === 'not-started' || p.status === 'Not Started').length;
      return { total, completed, inProgress, notStarted };
  }, [combinedSchedule]);
    

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
                    
                    await addOrUpdateRecord({
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
                    });

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
        
        const isOwnTask = currentUser.uid === task.assignedTo;

        if (!isAdmin && !isOwnTask) {
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

    const openEditDialog = (entry: ManualEntry) => {
        setEditingEntry({ ...entry });
        setIsEditDialogOpen(true);
    };
    
    const handleUpdateManualEntry = () => {
        if (!editingEntry) return;
        setManualEntries(prev => prev.map(e => e.id === editingEntry.id ? editingEntry : e));
        setIsEditDialogOpen(false);
        setEditingEntry(null);
        toast({title: 'Entry Updated', description: 'Manual project entry has been updated.'});
    }

    const openDeleteDialog = (entry: ManualEntry) => {
        setDeletingEntry(entry);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteManualEntry = () => {
        if (!deletingEntry) return;
        removeManualEntry(deletingEntry.id);
        setIsDeleteDialogOpen(false);
        setDeletingEntry(null);
        toast({title: 'Entry Removed', description: 'Manual project entry has been removed.'});
    };
    
    

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
        await addOrUpdateRecord({
            fileName: 'My Projects',
            projectName: `${displayUser?.name}'s Project Schedule`,
            data: [{
                category: "My Project Schedule",
                remarks: remarks,
                items: combinedSchedule.filter(item => item.isManual).map(item => ({
                    label: `Project: ${item.projectName}`,
                    value: `Detail: ${item.detail}, Status: ${item.status}, Start: ${item.startDate}, End: ${item.endDate}`,
                })),
            }],
        });
    };
    
    const handleDownloadSchedule = () => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('My Project Schedule', 14, 22);
      doc.setFontSize(10);
      doc.text(`Employee: ${displayUser?.name}`, 14, 30);

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
            <StatCard title="Total Projects" value={projectStats.total} icon={<Briefcase className="h-6 w-6 text-muted-foreground" />} />
            <StatCard title="Completed" value={projectStats.completed} icon={<CheckCircle2 className="h-6 w-6" />} color="bg-green-500 text-white" />
            <StatCard title="In Progress" value={projectStats.inProgress} icon={<Clock className="h-6 w-6" />} color="bg-blue-500 text-white" />
            <StatCard title="Not Started" value={projectStats.notStarted} icon={<XCircle className="h-6 w-6" />} color="bg-red-500 text-white" />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>My Project Schedule</CardTitle>
                <CardDescription>Manually add and track your own project tasks and schedules. Assigned tasks are also shown here.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Detail</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedSchedule.map(item => (
                             <TableRow key={item.id}>
                                <TableCell>{item.projectName}</TableCell>
                                <TableCell>{item.detail}</TableCell>
                                <TableCell>
                                  <Select
                                    value={item.status}
                                    onValueChange={(newStatus: any) => item.isManual ? handleManualEntryChange(item.id as number, 'status', newStatus) : handleStatusChange(item as Task, newStatus)}
                                    disabled={!canEdit || item.status === 'pending-approval'}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <StatusBadge status={item.status as Task['status']} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Not Started">Not Started</SelectItem>
                                      <SelectItem value="In Progress">In Progress</SelectItem>
                                      <SelectItem value="Completed">Completed</SelectItem>
                                      {/* Add these back in case status from DB has them */}
                                      <SelectItem value="not-started">Not Started</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      {item.status === 'pending-approval' && <SelectItem value="pending-approval">Pending Approval</SelectItem>}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>{item.startDate}</TableCell>
                                <TableCell>{item.endDate}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-1 justify-end">
                                       <Button variant="ghost" size="icon" onClick={() => item.isManual ? openEditDialog(item as ManualEntry) : openViewDialog(item as Task)}>
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                        {item.isManual && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(item as ManualEntry)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item as ManualEntry)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </>
                                        )}
                                        {!item.isManual && (
                                            <Button variant="ghost" size="icon" onClick={() => openSubmitDialog(item as Task)} disabled={!canEdit}>
                                                <Upload className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
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
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Manual Entry</DialogTitle></DialogHeader>
                {editingEntry && (
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Project Name" value={editingEntry.projectName} onChange={e => setEditingEntry({...editingEntry, projectName: e.target.value})} />
                        <Input placeholder="Detail" value={editingEntry.detail} onChange={e => setEditingEntry({...editingEntry, detail: e.target.value})} />
                        <Select value={editingEntry.status} onValueChange={(val: ManualEntry['status']) => setEditingEntry({...editingEntry, status: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" value={editingEntry.startDate} onChange={e => setEditingEntry({...editingEntry, startDate: e.target.value})} />
                        <Input type="date" value={editingEntry.endDate} onChange={e => setEditingEntry({...editingEntry, endDate: e.target.value})} />
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateManualEntry}>Save Changes</Button>
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

         <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        This will permanently delete the entry "{deletingEntry?.projectName}".
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDeleteManualEntry}>Delete</Button>
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
