
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { 
    Download, Trash2, Edit, Loader2, Landmark, Home, Building, Hotel, ExternalLink, ArrowLeft, Users, Folder, BookCopy, ClipboardCheck, FileSearch, Search, Eye, Send, User as UserIcon, Compass, File as FileIcon, CalendarOff, ClipboardList 
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { StatusBadge } from '../ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getIconForFile } from '@/lib/icons';
import { getFormUrlFromFileName, allFileNames } from '@/lib/utils';
import { bankTimelineCategories, type ProjectRow } from '@/lib/projects-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generatePdfForRecord } from '@/lib/pdf-generator';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: {
    finalY: number;
  };
}

export default function SavedRecordsComponent({ employeeOnly = false }: { employeeOnly?: boolean }) {
    const { records, isLoading, error, deleteRecord, bankTimelineCategories } = useRecords();
    const { user: currentUser } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const mainCategories = useMemo(() => [
        { name: 'Banks', icon: Landmark, files: [...(bankTimelineCategories || []).map(b => `${b} Timeline`), "Running Projects Summary"] },
        { name: 'Project Manual', icon: BookCopy, files: allFileNames.filter(name => !name.includes('Timeline') && !['Task Assignment', 'My Projects', 'Leave Request Form', 'Daily Work Report', 'Uploaded File', 'Running Projects Summary'].includes(name)) },
        { name: 'Employee Documents', icon: Users, files: ['My Projects', 'Task Assignment', 'Leave Request Form', 'Daily Work Report'] }
    ], [bankTimelineCategories]);
    
    const isAdmin = useMemo(() => currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d)), [currentUser]);

    const userRecords = useMemo(() => {
        if (employeeOnly && currentUser) {
            return records.filter(r => r.employeeId === currentUser.uid);
        }
        return records;
    }, [records, employeeOnly, currentUser]);

    const filteredRecordsByCategory = useMemo(() => {
        if (!activeCategory) return [];
    
        const categoryInfo = mainCategories.find(c => c.name === activeCategory);
        let categoryFiles = categoryInfo?.files || [];

        const categoryRecords = userRecords.filter(r => categoryFiles.includes(r.fileName));
        
        if (!searchQuery) return categoryRecords;
        
        return categoryRecords.filter(r => 
            r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.employeeName && r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [userRecords, searchQuery, activeCategory, mainCategories]);

     const filteredRecordsByEmployee = useMemo(() => {
        if (!employeeSearchQuery) return [];
        return userRecords.filter(r => 
            r.employeeName.toLowerCase().includes(employeeSearchQuery.toLowerCase())
        );
    }, [userRecords, employeeSearchQuery]);

    const recordsByFileName = useMemo(() => {
        const recordsToGroup = employeeSearchQuery ? filteredRecordsByEmployee : filteredRecordsByCategory;
        return recordsToGroup.reduce((acc, record) => {
            if (!acc[record.fileName]) {
                acc[record.fileName] = [];
            }
            acc[record.fileName].push(record);
            return acc;
        }, {} as Record<string, SavedRecord[]>);
    }, [filteredRecordsByCategory, filteredRecordsByEmployee, employeeSearchQuery]);

    const getAssignedToFromRecord = (record: SavedRecord) => {
      if (record.fileName === 'Task Assignment' && Array.isArray(record.data) && record.data[0]?.category === 'Task Assignment') {
        const assignedToItem = record.data[0].items.find((item: any) => item.label === 'assignedTo');
        return assignedToItem?.value || 'N/A';
      }
      return 'N/A';
    };


    const openDeleteDialog = (record: SavedRecord) => {
        setRecordToDelete(record);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (recordToDelete) {
            deleteRecord(recordToDelete.id);
            setRecordToDelete(null);
        }
        setIsDeleteDialogOpen(false);
    };
    
    const openViewDialog = (record: SavedRecord) => {
        setViewingRecord(record);
        setIsViewDialogOpen(true);
    };

    const handleViewFullReport = () => {
        if (filteredRecordsByEmployee.length === 0) return;
        const employeeName = filteredRecordsByEmployee[0].employeeName;
        const doc = new jsPDF() as any;
        doc.setProperties({
            title: `Consolidated Report for ${employeeName}`
        });

        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
        let yPos = 20;

        doc.setFontSize(18);
        doc.text(`Consolidated Report for ${employeeName}`, 14, yPos);
        yPos += 15;

        Object.entries(recordsByFileName).forEach(([fileName, recordsList]) => {
            if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
            doc.setFontSize(14);
            doc.text(fileName, 14, yPos);
            yPos += 10;
            
            const isMyProjects = fileName === 'My Projects';
            const isDailyReport = fileName === 'Daily Work Report';

            if (isMyProjects) {
                 recordsList.forEach(record => {
                    const projectSchedule = record.data.find((d: any) => d.category === 'My Project Schedule');
                    if (projectSchedule?.items) {
                        const projectItems = projectSchedule.items.map((item: { label: string, value: string }) => {
                            const details = item.value.split(', ').reduce((acc: any, part: string) => {
                                const [key, ...val] = part.split(': ');
                                acc[key.trim().toLowerCase()] = val.join(': ').trim();
                                return acc;
                            }, {});
                            details.project = item.label.replace('Project: ', '');
                            return details;
                        });
                        doc.autoTable({
                            startY: yPos,
                            head: [['Project Name', 'Detail', 'Status', 'Start Date', 'End Date']],
                            body: projectItems.map((p: any) => [p.project, p.detail, p.status, p.start, p.end]),
                            theme: 'grid',
                            headStyles: { fillColor: [45, 95, 51] },
                        });
                        yPos = doc.autoTable.previous.finalY + 5;
                        if(projectSchedule.remarks) {
                            doc.setFontSize(10);
                            doc.text(`Remarks: ${projectSchedule.remarks}`, 14, yPos);
                            yPos += 10;
                        }
                    }
                 });

            } else if (isDailyReport) {
                recordsList.forEach(record => {
                    const workEntries = record.data.find((d: any) => d.category === 'Work Entries');
                    if(workEntries?.items) {
                        doc.autoTable({
                            startY: yPos,
                            head: [['Date', 'Time', 'Job', 'Project', 'Design', 'Description']],
                            body: workEntries.items.map((item: any) => [
                                item.date,
                                `${item.startTime} - ${item.endTime}`,
                                item.customerJobNumber,
                                item.projectName,
                                `${item.designType} / ${item.projectType}`,
                                item.description
                            ]),
                             theme: 'grid',
                            headStyles: { fillColor: [45, 95, 51] },
                        });
                        yPos = doc.autoTable.previous.finalY + 10;
                    }
                });
            } else {
                 doc.autoTable({
                    startY: yPos,
                    head: [['Project Name', 'Created Date']],
                    body: recordsList.map(r => [r.projectName, r.createdAt.toLocaleDateString()]),
                    theme: 'grid',
                    headStyles: { fillColor: [45, 95, 51] },
                });
                yPos = doc.autoTable.previous.finalY + 10;
            }
            yPos += 5; // Space between sections
        });
        
        addFooter();

        function addFooter() {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        }
        
        doc.save(`${employeeName}_Consolidated_Report.pdf`);
    };

    const dashboardPrefix = employeeOnly ? 'employee-dashboard' : 'dashboard';

    const canEditOrDelete = (record: SavedRecord) => {
        if (!currentUser) return false;
        return isAdmin || currentUser.uid === record.employeeId;
    };
    
    const renderRecordContent = () => {
        if (!viewingRecord) return null;
    
        const isTimeline = viewingRecord.fileName.endsWith('Timeline');
        
        if (isTimeline) {
            return <p>Timeline view is not supported here. Please go to the respective timeline page.</p>;
        }

        return (
            <div className="space-y-4">
                {viewingRecord.data.map((section: any, index: number) => {
                    if (typeof section !== 'object' || !section.category || !Array.isArray(section.items)) return null;

                    let firstItem = section.items[0];
                    if (typeof firstItem === 'string') {
                        try { firstItem = JSON.parse(firstItem); } catch (e) { /* Not JSON */ }
                    }
                    
                    const isTable = typeof firstItem === 'object' && firstItem !== null && Object.keys(firstItem).length > 0 && !firstItem.label;

                    if (isTable) {
                        const headers = Object.keys(firstItem).filter(key => key !== 'id');
                        return (
                            <div key={index}>
                                <h3 className="font-bold text-primary mb-2">{section.category}</h3>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {headers.map(h => <TableHead key={h}>{h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {section.items.map((item: any, i: number) => {
                                                let parsedItem = item;
                                                if (typeof item === 'string') {
                                                    try { parsedItem = JSON.parse(item); } catch (e) { return <TableRow key={i}><TableCell colSpan={headers.length}>{item}</TableCell></TableRow>; }
                                                }
                                                return (
                                                    <TableRow key={i}>
                                                        {headers.map(header => <TableCell key={header}>{String(parsedItem[header] ?? '')}</TableCell>)}
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        );
                    }
                    
                    return (
                        <div key={index}>
                            <h3 className="font-bold text-primary mb-2">{section.category}</h3>
                             <Table>
                                <TableBody>
                                {section.items.map((item: any, i: number) => {
                                    if (typeof item === 'object' && item.label && item.value !== undefined) return <TableRow key={i}><TableCell className="font-semibold">{item.label}</TableCell><TableCell>{String(item.value)}</TableCell></TableRow>;
                                    if (typeof item === 'string') {
                                        const parts = item.split(/:(.*)/s);
                                        return parts.length > 1 ? <TableRow key={i}><TableCell className="font-semibold">{parts[0]}</TableCell><TableCell>{parts[1]?.trim()}</TableCell></TableRow> : <TableRow key={i}><TableCell colSpan={2}>{item}</TableCell></TableRow>;
                                    }
                                     return <TableRow key={i}><TableCell colSpan={2}>{JSON.stringify(item)}</TableCell></TableRow>;
                                })}
                                </TableBody>
                            </Table>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!isClient) {
        return (
             <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
        );
    }

    return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Records</CardTitle>
          <CardDescription>
            {employeeOnly ? "View and manage records you have created." : "Search employee records or browse by category."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {!employeeOnly && (
                 <div className="relative mb-6">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Employee Name..."
                        className="pl-8"
                        value={employeeSearchQuery}
                        onChange={(e) => {
                            setEmployeeSearchQuery(e.target.value);
                            setActiveCategory(null);
                            setSearchQuery('');
                        }}
                    />
                </div>
            )}
            
            {employeeSearchQuery ? (
                 <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Records for "{employeeSearchQuery}"</h2>
                        <Button onClick={handleViewFullReport} disabled={filteredRecordsByEmployee.length === 0}>
                            <Eye className="mr-2 h-4 w-4" /> View Full Report
                        </Button>
                    </div>
                     {Object.entries(recordsByFileName).length > 0 ? (
                        <Accordion type="multiple" className="w-full space-y-2">
                             {Object.entries(recordsByFileName).map(([fileName, records]) => {
                                const Icon = getIconForFile(fileName);
                                return(
                                <AccordionItem value={fileName} key={fileName}>
                                    <AccordionTrigger className="bg-muted/50 hover:bg-muted px-4 py-2 rounded-md font-semibold text-lg flex justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-primary" />
                                            <span>{fileName}</span>
                                            <Badge variant="secondary">{records.length}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2">
                                        {/* Table content as before */}
                                    </AccordionContent>
                                </AccordionItem>
                            )})
                            }
                        </Accordion>
                    ) : <p>No records found for this employee.</p>}
                 </div>
            ) : !activeCategory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mainCategories.map(({ name, icon: Icon }) => (
                         <Card
                            key={name}
                            className={cn(
                                "p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent hover:border-primary transition-all",
                                "min-h-[180px]"
                            )}
                            onClick={() => setActiveCategory(name)}
                        >
                            <Icon className="w-12 h-12 text-primary" />
                            <p className="font-semibold text-lg text-center">{name}</p>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => setActiveCategory(null)}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <CardTitle className="text-2xl font-bold">{activeCategory}</CardTitle>
                        </div>
                         <div className="relative mt-4">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search in ${activeCategory}...`}
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : error ? (
                            <div className="text-destructive text-center">{error}</div>
                        ) : filteredRecordsByCategory.length > 0 ? (
                           <Accordion type="multiple" className="w-full space-y-2">
                                {Object.entries(recordsByFileName).map(([fileName, records]) => {
                                    if (records.length === 0) return null;
                                    const Icon = getIconForFile(fileName);
                                    const isTaskAssignment = fileName === 'Task Assignment';

                                    return (
                                        <AccordionItem value={fileName} key={fileName}>
                                            <AccordionTrigger className="bg-muted/50 hover:bg-muted px-4 py-2 rounded-md font-semibold text-lg flex justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-5 w-5 text-primary" />
                                                    <span>{fileName}</span>
                                                    <Badge variant="secondary">{records.length}</Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2">
                                                <div className="border rounded-b-lg">
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Project Name</TableHead>{isTaskAssignment && <TableHead>Assigned To</TableHead>}{!employeeOnly && <TableHead>Created By</TableHead>}<TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {records.map(record => (
                                                                <TableRow key={record.id}>
                                                                    <TableCell className="font-medium">{record.projectName}</TableCell>
                                                                    {isTaskAssignment && <TableCell>{getAssignedToFromRecord(record)}</TableCell>}
                                                                    {!employeeOnly && <TableCell>{record.employeeName}</TableCell>}
                                                                    <TableCell>{record.createdAt.toLocaleDateString()}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex gap-1 justify-end">
                                                                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(record)} title="View"><Eye className="h-4 w-4" /></Button>
                                                                            {canEditOrDelete(record) && (
                                                                                <>
                                                                                    <Link href={`${getFormUrlFromFileName(record.fileName, dashboardPrefix)}?id=${record.id}`}><Button variant="ghost" size="icon" title="Edit"><Edit className="h-4 w-4" /></Button></Link>
                                                                                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(record)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No records found for this category.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the record for "{recordToDelete?.projectName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{viewingRecord?.fileName}: {viewingRecord?.projectName}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-4 border rounded-md my-4">
                    {renderRecordContent()}
                </div>
                <DialogFooter>
                    <Button onClick={() => viewingRecord && generatePdfForRecord(viewingRecord)}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
      </Dialog>
    </div>
  );
}
