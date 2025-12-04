
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { useCurrentUser } from '@/context/UserContext';
import { useEmployees } from '@/context/EmployeeContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRecords } from '@/context/RecordContext';
import { cn } from '@/lib/utils';


export default function AssignTaskForm() {
    const searchParams = useSearchParams();
    const employeeId = searchParams.get('employeeId');

    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { user: currentUser } = useCurrentUser();
    const { employees } = useEmployees();
    const { addRecord } = useRecords();

    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [projectName, setProjectName] = useState('');
    const [comboboxOpen, setComboboxOpen] = useState(false);

    useEffect(() => {
        if (employeeId) {
            const employee = employees.find(e => e.record === employeeId);
            if (employee) {
                setAssignedTo(employee.uid);
            }
        }
    }, [employeeId, employees]);

    const handleSave = () => {
        if (!firestore || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save a task.' });
            return;
        }

        if (!assignedTo) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select an employee to assign the task to.' });
            return;
        }

        const dataToSave = {
            taskName,
            taskDescription,
            assignedTo,
            startDate,
            endDate,
            projectName,
            assignedBy: currentUser.name,
            assignedById: currentUser.uid,
            createdAt: serverTimestamp(),
            status: 'not-started',
        };

        const recordToSave = {
            fileName: "Task Assignment",
            projectName: projectName || `Task: ${taskName}`,
            data: [{
                category: 'Task Assignment',
                items: Object.entries(dataToSave).map(([key, value]) => {
                    if (key === 'createdAt') return `${key}: ${new Date().toISOString()}`;
                     if (key === 'assignedTo') {
                         const assignedEmployee = employees.find(e => e.uid === value);
                         return `${key}: ${assignedEmployee?.name || value}`;
                    }
                    return `${key}: ${value}`;
                })
            }],
        };

        addDoc(collection(firestore, 'tasks'), dataToSave)
            .then(() => {
                 addRecord(recordToSave as any);

                toast({ title: 'Task Assigned', description: `Task "${taskName}" has been assigned and recorded.` });
                setIsSaveOpen(false);
                setTaskName('');
                setTaskDescription('');
                setAssignedTo(employeeId || '');
                setStartDate('');
                setEndDate('');
                setProjectName('');
            })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: 'tasks',
                    operation: 'create',
                    requestResourceData: dataToSave,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const handleDownloadPdf = async () => {
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        const doc = new jsPDF() as any;
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522, info@isbahhassan.com, www.isbahhassan.com";

        let yPos = 20;
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("Task Assignment", doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;
        
        doc.setFontSize(10);
        const assignedEmployee = employees.find(e => e.uid === assignedTo);

        doc.autoTable({
            startY: yPos,
            theme: 'grid',
            head: [['Field', 'Details']],
            body: [
                ['Project Name', projectName],
                ['Task Name', taskName],
                ['Task Description', taskDescription],
                ['Assigned To', assignedEmployee?.name || assignedTo],
                ['Start Date', startDate],
                ['End Date', endDate],
                ['Assigned By', currentUser?.name || 'N/A'],
            ],
            headStyles: { fillColor: [45, 95, 51] }
        });

        // Add footer to all pages
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save('task-assignment.pdf');
        toast({ title: 'Download Started', description: 'Your PDF is being generated.' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center font-headline text-3xl text-primary">Assign a New Task</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
                <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Corporate Office Building" />
                </div>
                    <div className="space-y-2">
                    <Label htmlFor="taskName">Task Name</Label>
                    <Input id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="e.g. Finalize floor plan" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="taskDescription">Task Description</Label>
                    <Textarea id="taskDescription" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Provide details about the task..." />
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="assignedTo">Assign To</Label>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={comboboxOpen}
                                className="w-full justify-between"
                                >
                                {assignedTo
                                    ? employees.find((employee) => employee.uid === assignedTo)?.name
                                    : "Select an employee"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search employee..." />
                                    <CommandList>
                                        <CommandEmpty>No employee found.</CommandEmpty>
                                        <CommandGroup>
                                            {employees.map((employee, index) => (
                                                <CommandItem
                                                key={employee.uid || `emp-${index}`}
                                                value={employee.name}
                                                onSelect={() => {
                                                    setAssignedTo(employee.uid);
                                                    setComboboxOpen(false);
                                                }}
                                                >
                                                <Check
                                                    className={cn(
                                                    "mr-2 h-4 w-4",
                                                    assignedTo === employee.uid ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {employee.name} ({employee.department})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                        <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                        <DialogTrigger asChild>
                            <Button><Save className="mr-2 h-4 w-4" /> Assign & Save</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Assignment</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to assign this task?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button onClick={handleSave}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Download as PDF</Button>
                </div>
            </CardContent>
        </Card>
    );
}
