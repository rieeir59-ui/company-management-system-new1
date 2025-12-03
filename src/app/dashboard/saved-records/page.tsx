
'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import DashboardPageHeader from '@/components/dashboard/PageHeader';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Download, Loader2, Edit, Trash2, ArrowLeft, ExternalLink, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
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
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useCurrentUser } from '@/context/UserContext';
import Link from 'next/link';
import { getFormUrlFromFileName, allFileNames } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { getIconForFile } from '@/lib/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/context/EmployeeContext';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { useSearchParams } from 'next/navigation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';


type TaskRecord = {
    id: string;
    taskName: string;
    projectName: string;
    assignedTo: string;
    assignedBy: string;
    dueDate: string;
    endDate: string;
    status: 'not-started' | 'in-progress' | 'completed';
};

const StatusIcon = ({ status }: { status: TaskRecord['status'] }) => {
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

const generateDefaultPdf = (doc: jsPDF, record: SavedRecord) => {
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(record.projectName, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    
    const headerData = [
        ['File', record.fileName],
        ['Saved by', record.employeeName],
        ['Date', new Date(record.createdAt).toLocaleDateString()],
    ];

    (doc as any).autoTable({
        startY: yPos,
        theme: 'plain',
        body: headerData,
        styles: { fontSize: 10 },
    });

    yPos = (doc as any).autoTable.previous.finalY + 10;
    
    const dataArray = Array.isArray(record.data) ? record.data : [record.data];

    dataArray.forEach((section: any) => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }

        if (record.fileName === 'Site Visit Proforma' && section.category !== 'Basic Information' && section.category !== 'Pictures' && section.items && section.items[0]?.Item) {
            const tableBody = section.items.map((item: any) => [item.Item, item.Status, item.Remarks]);
            if (tableBody.length > 0) {
                (doc as any).autoTable({
                    head: [[section.category]],
                    body: [], // Empty body for main title
                    startY: yPos,
                    theme: 'plain',
                    headStyles: { fontStyle: 'bold', fontSize: 12, textColor: [45, 95, 51] },
                });
                yPos = (doc as any).autoTable.previous.finalY + 2;

                (doc as any).autoTable({
                     head: [['Item', 'Status', 'Remarks']],
                    body: tableBody,
                    startY: yPos,
                    theme: 'grid',
                    headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0 },
                    styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' }
                });
                yPos = (doc as any).autoTable.previous.finalY + 10;
            }
            return;
        }


        const body: (string | number)[][] = [];

        if (section.items && Array.isArray(section.items)) {
            section.items.forEach((item: any) => {
                if (typeof item === 'object' && item !== null && (item.label || item.comment)) {
                   const label = item.label || item.comment;
                   const value = item.value || (item.url ? 'See Link' : '');
                   body.push([label, value]);
                } else if (typeof item === 'string') {
                     const parts = item.split(':');
                     if (parts.length > 1) {
                        body.push([parts[0], parts.slice(1).join(':').trim()]);
                    }
                }
            });
        }
        
        if (body.length > 0) {
            (doc as any).autoTable({
                head: [[section.category || 'Details']],
                body: body,
                startY: yPos,
                theme: 'grid',
                headStyles: { fontStyle: 'bold', fillColor: [45, 95, 51], textColor: 255 },
                styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' }
            });
            yPos = (doc as any).autoTable.previous.finalY + 10;
        }
    });
}

function SavedRecordsComponent() {
    const image = PlaceHolderImages.find(p => p.id === 'saved-records');
    const { user: currentUser, isUserLoading } = useCurrentUser();
    const { toast } = useToast();
    const { employees } = useEmployees();
    const { records, isLoading, error, deleteRecord, updateTaskStatus } = useRecords();

    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const searchParams = useSearchParams();
    const filterParam = searchParams.get('filter');

    useEffect(() => {
        if(filterParam) {
            setSelectedCategory(filterParam);
        } else {
            setSelectedCategory(null);
        }
    }, [filterParam]);

    const openDeleteDialog = (e: React.MouseEvent, record: SavedRecord) => {
        e.stopPropagation();
        setRecordToDelete(record);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        deleteRecord(recordToDelete.id);
        setIsDeleteDialogOpen(false);
        setRecordToDelete(null);
    };
    
    const handleStatusChange = async (taskId: string, newStatus: TaskRecord['status']) => {
        await updateTaskStatus(taskId, newStatus);
        toast({
            title: 'Status Updated',
            description: `Task status changed to ${newStatus.replace('-', ' ')}.`,
        });
      };

    const groupedRecords = useMemo(() => {
        const grouped = records.reduce((acc, record) => {
            const fileName = record.fileName;
            if (!acc[fileName]) {
                acc[fileName] = [];
            }
            acc[fileName].push(record);
            return acc;
        }, {} as Record<string, SavedRecord[]>);

        allFileNames.forEach(name => {
            if (!grouped[name]) {
                grouped[name] = [];
            }
        });
        
        return grouped;
    }, [records]);
    
    const openViewDialog = (e: React.MouseEvent, record: SavedRecord) => {
        e.stopPropagation();
        setViewingRecord(record);
        setIsViewDialogOpen(true);
    };
    
    const handleDownload = (record: SavedRecord) => {
        const doc = new jsPDF() as any;
        generateDefaultPdf(doc, record);
        doc.output('dataurlnewwindow');
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return Object.entries(groupedRecords);
        return Object.entries(groupedRecords).filter(([fileName, _]) => 
            fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [groupedRecords, searchQuery]);

    const filteredRecords = useMemo(() => {
        if (!selectedCategory || !groupedRecords[selectedCategory]) return [];
        if (!searchQuery) return groupedRecords[selectedCategory];
        return groupedRecords[selectedCategory].filter(record => 
            record.projectName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [selectedCategory, groupedRecords, searchQuery]);
    
    if (isLoading || isUserLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-4">Verifying access and loading records...</span>
            </div>
        )
    }

    const parseTaskData = (record: SavedRecord) => {
        const data = Array.isArray(record.data) ? record.data[0] : record.data;
        const items = data?.items || [];
        const findValue = (key: string) => (items.find((item: string) => item.startsWith(key))?.split(':')[1] || '').trim();
        
        return {
            id: record.id,
            taskName: findValue('taskName'),
            projectName: record.projectName,
            assignedTo: findValue('assignedTo'),
            assignedBy: findValue('assignedBy'),
            dueDate: findValue('dueDate'),
            endDate: findValue('endDate'),
            status: (findValue('status') as TaskRecord['status']) || 'not-started',
        };
    };

    return (
        <>
            <div className="space-y-8">
                <DashboardPageHeader
                    title="Saved Records"
                    description="Access all saved project checklists and documents from all employees."
                    imageUrl={image?.imageUrl || ''}
                    imageHint={image?.imageHint || ''}
                />
                
                {error ? (
                    <Card className="text-center py-12 bg-destructive/10 border-destructive">
                        <CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader>
                        <CardContent><p className="text-destructive/90">{error}</p></CardContent>
                    </Card>
                ) : selectedCategory ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="icon" onClick={() => {setSelectedCategory(null); setSearchQuery('');}}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <CardTitle>{selectedCategory}</CardTitle>
                                        <CardDescription>All records saved as "{selectedCategory}".</CardDescription>
                                    </div>
                                </div>
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder={`Search in ${selectedCategory}...`}
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                {selectedCategory === 'Task Assignment' ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Task Name</TableHead>
                                                <TableHead>Project</TableHead>
                                                <TableHead>Assigned To</TableHead>
                                                <TableHead>Assigned By</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRecords.length > 0 ? (
                                                filteredRecords.map(record => {
                                                    const task = parseTaskData(record);
                                                    return (
                                                        <TableRow key={record.id}>
                                                            <TableCell>{task.taskName}</TableCell>
                                                            <TableCell>{task.projectName}</TableCell>
                                                            <TableCell>{task.assignedTo}</TableCell>
                                                            <TableCell>{task.assignedBy}</TableCell>
                                                            <TableCell>{task.dueDate}</TableCell>
                                                            <TableCell>{task.endDate}</TableCell>
                                                            <TableCell>
                                                                 <Select
                                                                    value={task.status}
                                                                    onValueChange={(newStatus: TaskRecord['status']) => handleStatusChange(task.id, newStatus)}
                                                                >
                                                                    <SelectTrigger className="w-[180px]">
                                                                        <div className="flex items-center gap-2">
                                                                            <StatusIcon status={task.status} />
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
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={(e) => openDeleteDialog(e, record)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow><TableCell colSpan={8} className="text-center h-24">No records found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee Name</TableHead>
                                                <TableHead>Project Name</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right w-[100px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRecords.length > 0 ? (
                                                filteredRecords.map(record => {
                                                    const formUrl = getFormUrlFromFileName(record.fileName, 'dashboard');
                                                    return (
                                                        <TableRow key={record.id} onClick={(e) => openViewDialog(e, record)} className="cursor-pointer">
                                                            <TableCell>{record.employeeName}</TableCell>
                                                            <TableCell className="font-medium">{record.projectName}</TableCell>
                                                            <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                                    {formUrl && (
                                                                        <Button asChild variant="ghost" size="icon">
                                                                            <Link href={`${formUrl}?id=${record.id}`}>
                                                                                <Edit className="h-4 w-4" />
                                                                            </Link>
                                                                        </Button>
                                                                    )}
                                                                    <Button variant="ghost" size="icon" onClick={(e) => openDeleteDialog(e, record)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                        No records found for your search.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className='space-y-4'>
                        <div className="relative w-full max-w-lg mx-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Search record categories..."
                                className="pl-10 text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredCategories.map(([fileName, fileRecords]) => {
                               const Icon = getIconForFile(fileName);
                               return (
                                <Card 
                                    key={fileName} 
                                    className="flex flex-col justify-between cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                                    onClick={() => {setSelectedCategory(fileName); setSearchQuery('')}}
                                >
                                    <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
                                       <div className="bg-primary/10 p-3 rounded-full">
                                            <Icon className="h-6 w-6 text-primary" />
                                       </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardTitle className="text-lg font-semibold">{fileName}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{fileRecords.length} record(s)</p>
                                    </CardContent>
                                </Card>
                               )
                            })}
                        </div>
                         {filteredCategories.length === 0 && (
                            <Card className="text-center py-12">
                                <CardHeader><CardTitle>No Categories Found</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Your search for "{searchQuery}" did not match any record categories.</p></CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the record for "{recordToDelete?.projectName}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{viewingRecord?.projectName}</DialogTitle>
                        <DialogDescription>{viewingRecord?.fileName} - Saved by {viewingRecord?.employeeName} on {viewingRecord && new Date(viewingRecord.createdAt).toLocaleDateString()}</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto p-1">
                        {viewingRecord?.fileName === 'Project Agreement' ? (
                            <Accordion type="single" collapsible className="w-full">
                                {viewingRecord.data.map((section: any, index: number) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger>{section.category}</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {section.items && Array.isArray(section.items) ? (
                                                    section.items.map((item: string, itemIndex: number) => (
                                                        <li key={itemIndex} className="text-sm">{item.includes(':') ? <strong>{item.split(':')[0]}:</strong> : ''} {item.includes(':') ? item.split(':').slice(1).join(':').trim() : item}</li>
                                                    ))
                                                ) : (
                                                    <li className="text-sm">{String(section.items)}</li>
                                                )}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            viewingRecord?.data && (Array.isArray(viewingRecord.data) ? viewingRecord.data : [viewingRecord.data]).map((section: any, index: number) => {
                                if (viewingRecord.fileName === 'Site Visit Proforma' && section.category !== 'Basic Information' && section.category !== 'Pictures' && section.items && section.items[0]?.Item) {
                                  return (
                                      <div key={index} className="mb-4">
                                          <h3 className="font-bold text-lg mb-2 bg-muted p-2 rounded-md">{section.category}</h3>
                                          <Table>
                                              <TableHeader>
                                                  <TableRow>
                                                      <TableHead className="w-1/2">Item</TableHead>
                                                      <TableHead className="w-1/4">Status</TableHead>
                                                      <TableHead className="w-1/4">Remarks</TableHead>
                                                  </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                  {section.items.map((item: any, itemIndex: number) => (
                                                      <TableRow key={itemIndex}>
                                                          <TableCell>{item.Item}</TableCell>
                                                          <TableCell>{item.Status}</TableCell>
                                                          <TableCell>{item.Remarks}</TableCell>
                                                      </TableRow>
                                                  ))}
                                              </TableBody>
                                          </Table>
                                      </div>
                                  );
                              }
                              return (
                                   <div key={index} className="mb-4">
                                      <h3 className="font-bold text-lg mb-2 bg-muted p-2 rounded-md">{section.category}</h3>
                                      <Table>
                                          <TableBody>
                                              {section.items && Array.isArray(section.items) && section.items.map((item: any, itemIndex: number) => {
                                                  if (typeof item === 'object' && item !== null && (item.label || item.comment)) {
                                                      return (
                                                          <TableRow key={itemIndex}>
                                                              <TableCell className="font-medium w-1/3">{item.label || item.comment}</TableCell>
                                                              <TableCell>{item.value || (item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">View File <ExternalLink className="h-3 w-3"/></a>)}</TableCell>
                                                          </TableRow>
                                                      )
                                                  }
                                                   if (typeof item === 'string') {
                                                      const parts = item.split(':');
                                                      const label = parts[0];
                                                      const value = parts.slice(1).join(':').trim();
                                                       if (label && value) {
                                                          return (
                                                              <TableRow key={itemIndex}>
                                                                  <TableCell className="font-medium w-1/3">{label}</TableCell>
                                                                  <TableCell>{value}</TableCell>
                                                              </TableRow>
                                                          )
                                                      }
                                                  }
                                                  return null;
                                              })}
                                          </TableBody>
                                      </Table>
                                  </div>
                              )
                            })
                        )}
                    </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                        <Button onClick={() => viewingRecord && handleDownload(viewingRecord)}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function SavedRecordsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
            <SavedRecordsComponent />
        </Suspense>
    )
}

    