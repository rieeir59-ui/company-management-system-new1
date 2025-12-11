
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
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useRecords } from '@/context/RecordContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
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

function MyProjectsComponent() {
  const { user: currentUser, employees, isUserLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore, firebaseApp } = useFirebase();
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

  const { tasks: allTasks, isLoading: isLoadingTasks } = useTasks(displayUser?.uid);
  
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<Task | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ projectName: '', detail: '', startDate: '', endDate: ''});
  
  const [editingEntry, setEditingEntry] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [deletingEntry, setDeletingEntry] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [remarks, setRemarks] = useState('');
 
  const projectStats = useMemo(() => {
      const total = allTasks.length;
      const completed = allTasks.filter(p => p.status === 'completed').length;
      const inProgress = allTasks.filter(p => p.status === 'in-progress' || p.status === 'pending-approval').length;
      const notStarted = allTasks.filter(p => p.status === 'not-started').length;
      return { total, completed, inProgress, notStarted };
  }, [allTasks]);
    

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

    const openEditDialog = (task: Task) => {
        setEditingEntry(task);
        setIsEditDialogOpen(true);
    };
    
    const handleUpdateManualEntry = async () => {
        if (!editingEntry || !firestore) return;
        try {
            const taskRef = doc(firestore, 'tasks', editingEntry.id);
            await updateDoc(taskRef, {
                projectName: editingEntry.projectName,
                taskName: editingEntry.taskDescription,
                taskDescription: editingEntry.taskDescription,
                startDate: editingEntry.startDate,
                endDate: editingEntry.endDate,
                status: editingEntry.status
            });
            toast({title: 'Entry Updated', description: 'Manual project entry has been updated.'});
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `tasks/${editingEntry.id}`, operation: 'update' }));
        } finally {
            setIsEditDialogOpen(false);
            setEditingEntry(null);
        }
    }

    const openDeleteDialog = (task: Task) => {
        setDeletingEntry(task);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteManualEntry = async () => {
        if (!deletingEntry || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'tasks', deletingEntry.id));
            toast({title: 'Entry Removed', description: 'Manual project entry has been removed.'});
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `tasks/${deletingEntry.id}`, operation: 'delete' }));
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingEntry(null);
        }
    };
    
    const handleAddManualEntry = async () => {
        if (!firestore || !currentUser) return;
        if (!newEntry.projectName || !newEntry.detail) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Project Name and Detail are required.' });
            return;
        }

        try {
            await addDoc(collection(firestore, 'tasks'), {
                projectName: newEntry.projectName,
                taskName: newEntry.detail,
                taskDescription: newEntry.detail,
                startDate: newEntry.startDate,
                endDate: newEntry.endDate,
                status: 'not-started',
                assignedTo: currentUser.uid,
                assignedBy: currentUser.name,
                createdAt: serverTimestamp(),
                isManual: true,
            });
            toast({ title: 'Project Added', description: 'Your new project entry has been added.' });
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'tasks', operation: 'create' }));
        } finally {
            setIsAddDialogOpen(false);
            setNewEntry({ projectName: '', detail: '', startDate: '', endDate: '' });
        }
    };

    const handleDownloadSchedule = () => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('My Project Schedule', 14, 22);
      doc.setFontSize(10);
      doc.text(`Employee: ${displayUser?.name}`, 14, 30);

      const body = allTasks.map(item => [item.projectName, item.taskName, item.status, item.startDate, item.endDate]);

      (doc as any).autoTable({
          startY: 42,
          head: [['Project Name', 'Detail', 'Status', 'Start Date', 'End Date']],
          body: body,
          headStyles: { fillColor: [22, 163, 74] },
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
                <CardDescription>Manually add and track your own project tasks and schedules.</CardDescription>
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
                        {isLoadingTasks ? (
                           <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : allTasks.length === 0 ? (
                           <TableRow><TableCell colSpan={6} className="text-center h-24">No tasks or projects found.</TableCell></TableRow>
                        ) : (
                          allTasks.map(item => (
                             <TableRow key={item.id}>
                                <TableCell>{item.projectName}</TableCell>
                                <TableCell>{item.taskName}</TableCell>
                                <TableCell>
                                  <Select
                                    value={item.status}
                                    onValueChange={(newStatus: Task['status']) => handleStatusChange(item, newStatus)}
                                    disabled={!canEdit || item.status === 'pending-approval'}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <StatusBadge status={item.status as Task['status']} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not-started">Not Started</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>{item.startDate || 'N/A'}</TableCell>
                                <TableCell>{item.endDate || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-1 justify-end">
                                       <Button variant="ghost" size="icon" onClick={() => openViewDialog(item)}>
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                        {!item.isManual && (
                                            <Button variant="ghost" size="icon" onClick={() => openSubmitDialog(item)} disabled={!canEdit}>
                                                <Upload className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {item.isManual && canEdit && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
                {canEdit && (
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                         <Button className="mt-4"><PlusCircle className="h-4 w-4 mr-2" /> Add Project</Button>
                      </DialogTrigger>
                       <DialogContent>
                          <DialogHeader><DialogTitle>Add New Project Entry</DialogTitle></DialogHeader>
                          <div className="grid gap-4 py-4">
                              <Input placeholder="Project Name" value={newEntry.projectName} onChange={e => setNewEntry({...newEntry, projectName: e.target.value})} />
                              <Textarea placeholder="Detail / Task Description" value={newEntry.detail} onChange={e => setNewEntry({...newEntry, detail: e.target.value})} />
                              <div className="grid grid-cols-2 gap-4">
                                  <div><Label>Start Date</Label><Input type="date" value={newEntry.startDate} onChange={e => setNewEntry({...newEntry, startDate: e.target.value})} /></div>
                                  <div><Label>End Date</Label><Input type="date" value={newEntry.endDate} onChange={e => setNewEntry({...newEntry, endDate: e.target.value})} /></div>
                              </div>
                          </div>
                          <DialogFooter>
                              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                              <Button onClick={handleAddManualEntry}>Add Entry</Button>
                          </DialogFooter>
                      </DialogContent>
                    </Dialog>
                )}
                <div className="mt-4">
                    <Label htmlFor="remarks">Remarks:</Label>
                    <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
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
                        <Textarea placeholder="Detail" value={editingEntry.taskDescription} onChange={e => setEditingEntry({...editingEntry, taskDescription: e.target.value})} />
                        <Select value={editingEntry.status} onValueChange={(val: Task['status']) => setEditingEntry({...editingEntry, status: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="not-started">Not Started</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
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

    