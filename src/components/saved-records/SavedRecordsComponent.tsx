
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Download, Trash2, Edit, Loader2, Landmark, Home, Building, Hotel, ExternalLink, ArrowLeft, Users, Folder, BookCopy, ClipboardCheck, FileSearch, Search, Eye, Send, User as UserIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
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
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getIconForFile } from '@/lib/icons';
import { getFormUrlFromFileName, allFileNames } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { generatePdfForRecord } from '@/lib/pdf-generator';
import { Compass } from 'lucide-react';
import { format, parseISO, isValid, differenceInMinutes } from 'date-fns';
import { StatusBadge } from '../ui/badge';

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
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [viewingRecordItem, setViewingRecordItem] = useState<any>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const mainCategories = useMemo(() => [
        { name: 'Banks', icon: Landmark, files: (bankTimelineCategories || []).map(b => `${b} Timeline`) },
        { name: 'Project Manual', icon: BookCopy, files: allFileNames.filter(name => !name.includes('Timeline') && !['Task Assignment', 'My Projects', 'Leave Request Form', 'Daily Work Report', 'Uploaded File'].includes(name)) },
        { name: 'Employee Documents', icon: Users, files: ['My Projects', 'Task Assignment', 'Leave Request Form', 'Daily Work Report'] }
    ], [bankTimelineCategories]);
    
    const isAdmin = useMemo(() => currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d)), [currentUser]);

    const filteredRecords = useMemo(() => {
        let userRecords = records;
        if (employeeOnly && currentUser) {
            userRecords = records.filter(r => r.employeeId === currentUser.uid);
        }
        if (!activeCategory) return [];
    
        const categoryInfo = mainCategories.find(c => c.name === activeCategory);
        let categoryFiles = categoryInfo?.files || [];

        const categoryRecords = userRecords.filter(r => categoryFiles.includes(r.fileName));
        
        if (!searchQuery) return categoryRecords;
        
        return categoryRecords.filter(r => 
            r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [records, employeeOnly, currentUser, searchQuery, activeCategory, mainCategories]);

    const recordsByFileName = useMemo(() => {
        return filteredRecords.reduce((acc, record) => {
            if (!acc[record.fileName]) {
                acc[record.fileName] = [];
            }
            acc[record.fileName].push(record);
            return acc;
        }, {} as Record<string, SavedRecord[]>);
    }, [filteredRecords]);

     const recordsByEmployee = useMemo(() => {
        if (activeCategory !== 'Employee Documents') return {};
        return filteredRecords.reduce((acc, record) => {
            const employeeName = record.employeeName || 'Unknown';
            if (!acc[employeeName]) {
                acc[employeeName] = [];
            }
            acc[employeeName].push(record);
            return acc;
        }, {} as Record<string, SavedRecord[]>);
    }, [filteredRecords, activeCategory]);

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
    
    const openViewDialog = (record: SavedRecord, item?: any) => {
        setViewingRecord(record);
        setViewingRecordItem(item || null);
        setIsViewDialogOpen(true);
    };

    const dashboardPrefix = employeeOnly ? 'employee-dashboard' : 'dashboard';

    const canEditOrDelete = (record: SavedRecord) => {
        if (!currentUser) return false;
        return isAdmin || currentUser.uid === record.employeeId;
    };
    
const renderRecordContent = () => {
    if (!viewingRecord) return null;

    if (viewingRecord.fileName.includes('Timeline')) {
        const projectsData = viewingRecord.data?.find((d: any) => d.category === 'Projects')?.items || [];
        const statusData = viewingRecord.data?.find((d: any) => d.category === 'Status & Remarks')?.items || [];
        
        const overallStatus = statusData.find((i:any) => i.label === 'Overall Status')?.value;
        const remarks = statusData.find((i:any) => i.label === 'Maam Isbah Remarks & Order')?.value;
        const remarksDate = statusData.find((i:any) => i.label === 'Date')?.value;

        return (
            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <Table className="text-xs">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sr.No</TableHead>
                                <TableHead>Project Name</TableHead>
                                <TableHead>Area</TableHead>
                                <TableHead>Holder</TableHead>
                                <TableHead>Alloc. Date</TableHead>
                                <TableHead colSpan={2}>Site Survey</TableHead>
                                <TableHead colSpan={2}>Contract</TableHead>
                                <TableHead colSpan={2}>Head Count</TableHead>
                                <TableHead colSpan={2}>Proposal</TableHead>
                                <TableHead colSpan={2}>3D's</TableHead>
                                <TableHead colSpan={2}>Tender Arch</TableHead>
                                <TableHead colSpan={2}>Tender MEP</TableHead>
                                <TableHead colSpan={2}>BOQ</TableHead>
                                <TableHead>Tender Status</TableHead>
                                <TableHead>Comparative</TableHead>
                                <TableHead colSpan={2}>Working Dwgs</TableHead>
                                <TableHead colSpan={2}>Site Visit</TableHead>
                                <TableHead>Final Bill</TableHead>
                                <TableHead>Closure</TableHead>
                            </TableRow>
                            <TableRow>
                                <TableHead colSpan={5}></TableHead>
                                {[...Array(9)].flatMap((_, i) => [<TableHead key={`start-${i}`}>Start</TableHead>, <TableHead key={`end-${i}`}>End</TableHead>])}
                                <TableHead colSpan={4}></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectsData.map((p: any, index: number) => (
                                <TableRow key={p.id || index}>
                                    <TableCell>{p.srNo}</TableCell>
                                    <TableCell>{p.projectName}</TableCell>
                                    <TableCell>{p.area}</TableCell>
                                    <TableCell>{p.projectHolder}</TableCell>
                                    <TableCell>{p.allocationDate}</TableCell>
                                    <TableCell>{p.siteSurveyStart}</TableCell>
                                    <TableCell>{p.siteSurveyEnd}</TableCell>
                                    <TableCell>{p.contractStart}</TableCell>
                                    <TableCell>{p.contactEnd}</TableCell>
                                    <TableCell>{p.headCountStart}</TableCell>
                                    <TableCell>{p.headCountEnd}</TableCell>
                                    <TableCell>{p.proposalStart}</TableCell>
                                    <TableCell>{p.proposalEnd}</TableCell>
                                    <TableCell>{p.threedStart}</TableCell>
                                    <TableCell>{p.threedEnd}</TableCell>
                                    <TableCell>{p.tenderArchStart}</TableCell>
                                    <TableCell>{p.tenderArchEnd}</TableCell>
                                    <TableCell>{p.tenderMepStart}</TableCell>
                                    <TableCell>{p.tenderMepEnd}</TableCell>
                                    <TableCell>{p.boqStart}</TableCell>
                                    <TableCell>{p.boqEnd}</TableCell>
                                    <TableCell>{p.tenderStatus}</TableCell>
                                    <TableCell>{p.comparative}</TableCell>
                                    <TableCell>{p.workingDrawingsStart}</TableCell>
                                    <TableCell>{p.workingDrawingsEnd}</TableCell>
                                    <TableCell>{p.siteVisitStart}</TableCell>
                                    <TableCell>{p.siteVisitEnd}</TableCell>
                                    <TableCell>{p.finalBill}</TableCell>
                                    <TableCell>{p.projectClosure}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 space-y-2">
                    {overallStatus && <p><strong>Overall Status:</strong> {overallStatus}</p>}
                    {remarks && <p><strong>Maam Isbah Remarks & Order:</strong> {remarks}</p>}
                    {remarksDate && <p><strong>Date:</strong> {remarksDate}</p>}
                </div>
            </div>
        )
    }
        
    if(viewingRecord.fileName === 'My Projects') {
        const scheduleData = viewingRecord.data.find((d: any) => d.category === 'My Project Schedule');
        const projects = (scheduleData?.items || []).map((item: any) => {
            const project = { projectName: item.label.replace('Project: ', ''), ...Object.fromEntries(item.value.split(', ').map((p:string) => p.split(': '))) };
            return project;
        });

         return (
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Detail</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map((p: any, index: number) => (
                            <TableRow key={index}>
                                <TableCell>{p.projectName}</TableCell>
                                <TableCell>{p.Detail}</TableCell>
                                <TableCell><StatusBadge status={p.Status?.toLowerCase().replace(' ', '-') || 'not-started'} /></TableCell>
                                <TableCell>{p.Start}</TableCell>
                                <TableCell>{p.End}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {scheduleData?.remarks && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold">Remarks:</h4>
                        <p className="text-sm text-muted-foreground">{scheduleData.remarks}</p>
                    </div>
                )}
            </div>
        )
    }
    
        if (viewingRecord.fileName === 'Daily Work Report') {
            const entries = viewingRecord.data[0]?.items || [];
            if (!Array.isArray(entries)) return <p>Could not display record data.</p>;
    
            const calculateTotalUnits = (startTime: string, endTime: string): string => {
                if (!startTime || !endTime) return '0:00';
                const start = new Date(`1970-01-01T${startTime}`);
                const end = new Date(`1970-01-01T${endTime}`);
                if (!isValid(start) || !isValid(end) || end < start) return '0:00';
                const diff = differenceInMinutes(end, start);
                const hours = Math.floor(diff / 60);
                const minutes = diff % 60;
                return `${hours}:${String(minutes).padStart(2, '0')}`;
            };
    
            const entriesByDate = entries.reduce((acc, entry) => {
                if (entry.date) {
                    (acc[entry.date] = acc[entry.date] || []).push(entry);
                }
                return acc;
            }, {} as Record<string, typeof entries>);
    
            const sortedDates = Object.keys(entriesByDate).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    
            return (
                <div className="space-y-6">
                    {sortedDates.map(date => {
                        const dayEntries = entriesByDate[date];
                        const totalDayMinutes = dayEntries.reduce((acc: number, entry: any) => {
                            const [hours, minutes] = calculateTotalUnits(entry.startTime, entry.endTime).split(':').map(Number);
                            return acc + (hours * 60) + minutes;
                        }, 0);
                        const totalHours = Math.floor(totalDayMinutes / 60);
                        const totalMinutes = totalDayMinutes % 60;

                        return (
                            <div key={date}>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>DAY</TableHead>
                                            <TableHead>DATE</TableHead>
                                            <TableHead>START</TableHead>
                                            <TableHead>END</TableHead>
                                            <TableHead>CUSTOMER JOB</TableHead>
                                            <TableHead>PROJECT NAME</TableHead>
                                            <TableHead>DESIGN TYPE</TableHead>
                                            <TableHead>PROJECT TYPE</TableHead>
                                            <TableHead>DESCRIPTION</TableHead>
                                            <TableHead className="text-right">TOTAL UNITS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dayEntries.map((entry: any, index: number) => (
                                            <TableRow key={entry.id || index}>
                                                <TableCell>{format(parseISO(entry.date), 'EEEE').toUpperCase()}</TableCell>
                                                <TableCell>{format(parseISO(entry.date), 'dd-MMM')}</TableCell>
                                                <TableCell>{entry.startTime}</TableCell>
                                                <TableCell>{entry.endTime}</TableCell>
                                                <TableCell>{entry.customerJobNumber}</TableCell>
                                                <TableCell>{entry.projectName}</TableCell>
                                                <TableCell>{entry.designType}</TableCell>
                                                <TableCell>{entry.projectType}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell className="text-right">{calculateTotalUnits(entry.startTime, entry.endTime)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="font-bold bg-muted/50">
                                            <TableCell colSpan={9} className="text-right">TOTAL UNITS</TableCell>
                                            <TableCell className="text-right">{`${totalHours}:${String(totalMinutes).padStart(2, '0')}`}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )
                    })}
                </div>
            )
        }
        
        // Fallback for other record types
        return (
            <div className="space-y-4">
                {Array.isArray(viewingRecord.data) && viewingRecord.data.map((section: any, index: number) => {
                    if (typeof section !== 'object' || !section.category || !Array.isArray(section.items)) return null;

                    let firstItem = section.items[0];
                    if (typeof firstItem === 'string') {
                        try { firstItem = JSON.parse(firstItem); } catch (e) { /* Not JSON */ }
                    }
                    
                    const isTable = typeof firstItem === 'object' && firstItem !== null && !firstItem.label;
                    const headers = isTable ? Object.keys(firstItem).filter(key => key !== 'id') : [];

                    return (
                        <div key={index}>
                            <h3 className="font-bold text-primary mb-2">{section.category}</h3>
                            {isTable ? (
                                <Table>
                                    <TableHeader><TableRow>{headers.map(h => <TableHead key={h}>{h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</TableHead>)}</TableRow></TableHeader>
                                    <TableBody>
                                        {section.items.map((item: any, i: number) => {
                                            let parsedItem = item;
                                            if(typeof item === 'string') try {parsedItem = JSON.parse(item)} catch(e){return null}
                                            return <TableRow key={i}>{headers.map(h => <TableCell key={h}>{String(parsedItem[h] ?? '')}</TableCell>)}</TableRow>
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="space-y-1 text-sm">
                                    {section.items.map((item: any, i: number) => {
                                        if(typeof item === 'object' && item.label) return <p key={i}><strong>{item.label}:</strong> {String(item.value)}</p>
                                        const parts = String(item).split(/:(.*)/s);
                                        return <p key={i}><strong>{parts[0]}:</strong> {parts[1]?.trim()}</p>
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };


    return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Records</CardTitle>
          <CardDescription>
            {employeeOnly ? "View and manage records you have created." : "View and manage all records across the company."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {!activeCategory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mainCategories.map(({ name, icon: Icon }) => (
                         <Card
                            key={name}
                            className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent hover:border-primary transition-all"
                            onClick={() => setActiveCategory(name)}
                        >
                            <Icon className="w-12 h-12 text-primary" />
                            <p className="font-semibold text-lg text-center">{name}</p>
                        </Card>
                    ))}
                </div>
            ) : (
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" size="icon" onClick={() => setActiveCategory(null)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-2xl font-bold">{activeCategory}</h2>
                    </div>
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search in ${activeCategory}...`}
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : error ? (
                        <div className="text-destructive text-center">{error}</div>
                    ) : activeCategory === 'Employee Documents' && isAdmin && !employeeOnly ? (
                         <Accordion type="multiple" className="w-full space-y-2">
                             {Object.entries(recordsByEmployee).sort(([nameA], [nameB]) => nameA.localeCompare(nameB)).map(([employeeName, employeeRecords]) => {
                                if (employeeRecords.length === 0) return null;
                                return (
                                    <AccordionItem value={employeeName} key={employeeName}>
                                        <AccordionTrigger className="bg-muted/50 hover:bg-muted px-4 py-2 rounded-md font-semibold text-lg flex justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <UserIcon className="h-5 w-5 text-primary" />
                                                <span>{employeeName}</span>
                                                <Badge variant="secondary">{employeeRecords.length}</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2">
                                           {Object.entries(employeeRecords.reduce((acc, record) => {
                                                if (!acc[record.fileName]) acc[record.fileName] = [];
                                                acc[record.fileName].push(record);
                                                return acc;
                                            }, {} as Record<string, SavedRecord[]>)).map(([fileName, fileRecords]) => (
                                                 <div key={fileName} className="border rounded-lg mb-2">
                                                    <h4 className="font-semibold p-2 bg-gray-50 text-sm">{fileName}</h4>
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Project Name</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {fileRecords.map(record => (
                                                                <TableRow key={record.id}>
                                                                    <TableCell>{record.projectName}</TableCell>
                                                                    <TableCell>{record.createdAt.toLocaleDateString()}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex gap-1 justify-end">
                                                                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(record)} title="View"><Eye className="h-4 w-4" /></Button>
                                                                            {canEditOrDelete(record) && <>
                                                                                <Link href={`${getFormUrlFromFileName(record.fileName, dashboardPrefix)}?id=${record.id}`}><Button variant="ghost" size="icon" title="Edit"><Edit className="h-4 w-4" /></Button></Link>
                                                                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(record)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                                            </>}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                 </div>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                         </Accordion>
                    ) : filteredRecords.length > 0 ? (
                        <Accordion type="multiple" className="w-full space-y-2">
                             {Object.entries(recordsByFileName).map(([fileName, fileRecords]) => {
                                if (fileRecords.length === 0) return null;
                                const Icon = getIconForFile(fileName);
                                
                                if (fileName === 'My Projects') {
                                    return (
                                        <AccordionItem value={fileName} key={fileName}>
                                            <AccordionTrigger className="bg-muted/50 hover:bg-muted px-4 py-2 rounded-md font-semibold text-lg flex justify-between w-full">
                                                <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><span>{fileName}</span><Badge variant="secondary">{fileRecords.length > 0 ? (fileRecords[0].data.find((d:any) => d.category === 'My Project Schedule')?.items.length || 0) : 0}</Badge></div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2">
                                                <div className="border rounded-b-lg">
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Project Name</TableHead><TableHead>Employee</TableHead><TableHead>Status</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {fileRecords.map(record => (
                                                                (record.data.find((d: any) => d.category === 'My Project Schedule')?.items || []).map((item: any, index: number) => {
                                                                    const project = { projectName: item.label.replace('Project: ', ''), ...Object.fromEntries(item.value.split(', ').map((p:string) => p.split(': '))) };
                                                                    return (
                                                                        <TableRow key={`${record.id}-${index}`}>
                                                                            <TableCell>{project.projectName}</TableCell>
                                                                            <TableCell>{record.employeeName}</TableCell>
                                                                            <TableCell><StatusBadge status={project.Status.toLowerCase().replace(' ', '-')} /></TableCell>
                                                                            <TableCell>{project.Start}</TableCell>
                                                                            <TableCell>{project.End}</TableCell>
                                                                            <TableCell className="text-right">
                                                                                <Button variant="outline" size="sm" onClick={() => openViewDialog(record, project)}>
                                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                                    View
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                }
                                
                                return (
                                    <AccordionItem value={fileName} key={fileName}>
                                        <AccordionTrigger className="bg-muted/50 hover:bg-muted px-4 py-2 rounded-md font-semibold text-lg flex justify-between w-full">
                                            <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><span>{fileName}</span><Badge variant="secondary">{fileRecords.length}</Badge></div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2">
                                            <div className="border rounded-b-lg">
                                                <Table>
                                                    <TableHeader><TableRow><TableHead>Project Name</TableHead>{!employeeOnly && <TableHead>Created By</TableHead>}<TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {fileRecords.map(record => (
                                                            <TableRow key={record.id}>
                                                                <TableCell className="font-medium">{record.projectName}</TableCell>
                                                                {!employeeOnly && <TableCell>{record.employeeName}</TableCell>}
                                                                <TableCell>{record.createdAt.toLocaleDateString()}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex gap-1 justify-end">
                                                                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(record)} title="View"><Eye className="h-4 w-4" /></Button>
                                                                        {canEditOrDelete(record) && <>
                                                                            <Link href={`${getFormUrlFromFileName(record.fileName, dashboardPrefix)}?id=${record.id}`}><Button variant="ghost" size="icon" title="Edit"><Edit className="h-4 w-4" /></Button></Link>
                                                                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(record)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                                        </>}
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
                </div>
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

