
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Download, Trash2, Edit, Loader2, Landmark, Home, Building, Hotel, ExternalLink, ArrowLeft, Users, Folder, BookCopy, ClipboardCheck, FileSearch, Search, Eye, Send } from "lucide-react";
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { type ProjectRow } from '@/lib/projects-data';
import { Compass } from 'lucide-react';
import { format, parseISO, isValid, differenceInMinutes } from 'date-fns';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const generatePdfForRecord = (record: SavedRecord) => {
    const doc = new jsPDF({ orientation: 'portrait' }) as jsPDFWithAutoTable;
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    let yPos = 15;
    const primaryColor = [45, 95, 51];
    const margin = 14;

    const addDefaultHeader = (title: string, subtitle: string) => {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(title, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        doc.setFontSize(9);
        doc.text(`Record ID: ${record.id}`, 14, yPos);
        doc.text(`Date: ${record.createdAt.toLocaleDateString()}`, pageWidth - 14, yPos, { align: 'right' });
        yPos += 10;
        doc.setLineWidth(0.5);
        doc.line(14, yPos - 5, pageWidth - 14, yPos - 5);
    };

    const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    };
    
    if (record.fileName === 'Project Information') {
        const dataSections = Array.isArray(record.data) ? record.data : [record.data];

        const getSectionData = (category: string) => {
            const section = dataSections.find((d: any) => d.category === category);
            return section?.items || {};
        };
        
        const info = getSectionData('Project Information');
        const consultants = getSectionData('Consultants');
        const requirements = getSectionData('Requirements');

        addDefaultHeader(record.fileName, record.projectName);

        const addSection = (title: string, data: Record<string, any>) => {
             const entries = Object.entries(data).filter(([, value]) => value && typeof value !== 'boolean' && typeof value !== 'object' && value !== 'undefined' && value !== 'null' && !['specialConfidential', 'miscNotes'].includes(value as string));
             if (entries.length === 0) return;

            if (yPos > 260) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(title, margin, yPos);
            yPos += 8;
            
            doc.autoTable({
                startY: yPos,
                body: entries.map(([key, value]) => [key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), String(value)]),
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
                head: [['Field', 'Value']],
                showHead: false,
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
                didDrawPage: (data) => {
                  yPos = data.cursor?.y ?? 20;
                }
            });
            yPos = doc.autoTable.previous.finalY + 10;
        };

        const addTextAreaSection = (title: string, content: string) => {
            if (!content || !content.trim() || content === 'undefined') return null;
            if (yPos > 260) { doc.addPage(); yPos = 20; }
            addSection(title, {'Details': content});
        }
        
        addSection("Project Information", {
            'project': info.project, 'address': info.address, 'projectNo': info.projectNo,
            'preparedBy': info.preparedBy, 'preparedDate': info.preparedDate,
        });

        addSection("About Owner", {
            'ownerFullName': info.ownerFullName, 'ownerOfficeAddress': info.ownerOfficeAddress,
            'ownerResAddress': info.ownerResAddress, 'ownerOfficePhone': info.ownerOfficePhone,
            'ownerResPhone': info.ownerResPhone,
        });
        
        addSection("Owner's Project Representative", {
            'repName': info.repName, 'repOfficeAddress': info.repOfficeAddress,
            'repResAddress': info.repResAddress, 'repOfficePhone': info.repOfficePhone,
            'repResPhone': info.repResPhone,
        });

        if(yPos > 200) {doc.addPage(); yPos = 20;}

        if (consultants && Object.keys(consultants).length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("Consultants", margin, yPos);
            yPos += 8;
            doc.autoTable({
                startY: yPos,
                head: [['Type', 'Within Fee', 'Additional Fee', 'By Architect', 'By Owner']],
                body: Object.entries(consultants).map(([type, values]: [string, any]) => [type, values.withinFee, values.additionalFee, values.architect, values.owner]),
                theme: 'grid',
                headStyles: { fillColor: primaryColor }
            });
            yPos = doc.autoTable.previous.finalY + 10;
        }
        
        if(yPos > 200) {doc.addPage(); yPos = 20;}
        
        if (requirements && Object.keys(requirements).length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("Requirements", margin, yPos);
            yPos += 8;
            doc.autoTable({
                startY: yPos,
                head: [['Description', 'Nos.', 'Remarks']],
                body: Object.entries(requirements).map(([req, values]: [string, any]) => [req, values.nos, values.remarks]),
                theme: 'grid',
                headStyles: { fillColor: primaryColor }
            });
            yPos = doc.autoTable.previous.finalY + 10;
        }

        addTextAreaSection('Special Confidential Requirements', info.specialConfidential);
        addTextAreaSection('Miscellaneous Notes', info.miscNotes);

    } else if (record.fileName === 'Daily Work Report') {
        addDefaultHeader(record.fileName, record.projectName);

        const entries = record.data[0]?.items || [];
        if (!Array.isArray(entries)) {
            doc.text('Could not display record data.', 14, yPos);
        } else {
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

            sortedDates.forEach(date => {
                if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(format(parseISO(date), 'EEEE, dd MMMM yyyy'), 14, yPos);
                yPos += 8;

                const body = entriesByDate[date].map(entry => [
                    `${entry.startTime} - ${entry.endTime}`,
                    entry.projectName,
                    entry.description,
                    calculateTotalUnits(entry.startTime, entry.endTime)
                ]);

                doc.autoTable({
                    startY: yPos,
                    head: [['Time', 'Project', 'Description', 'Units']],
                    body: body,
                    theme: 'grid',
                    headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                    styles: { fontSize: 9, cellPadding: 2 }
                });
                yPos = doc.autoTable.previous.finalY + 10;
            });
        }
    } else {
        addDefaultHeader(record.fileName, record.projectName);
        
        const dataSections = Array.isArray(record.data) ? record.data : [record.data];

        dataSections.forEach((section: any) => {
            if (typeof section !== 'object' || !section.category || !Array.isArray(section.items)) return;

            if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(section.category, 14, yPos);
            yPos += 8;
            doc.setTextColor(0,0,0);

            let firstItem = section.items[0];
            if (typeof firstItem === 'string') {
                try { firstItem = JSON.parse(firstItem); } catch (e) { /* not json */ }
            }
            
            const isTable = typeof firstItem === 'object' && firstItem !== null && !firstItem.label;
            
            if (isTable) {
                const headers = Object.keys(firstItem).filter(key => key !== 'id');
                const body = section.items.map((item: any) => {
                    let parsedItem = item;
                    if(typeof item === 'string') try {parsedItem = JSON.parse(item)} catch(e){return headers.map(() => '');}
                    return headers.map(header => String(parsedItem[header] ?? ''));
                });
                doc.autoTable({
                    startY: yPos,
                    head: [headers.map(h => h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))],
                    body: body,
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
                    headStyles: { fillColor: primaryColor, fontStyle: 'bold' },
                });
            } else {
                 const body = section.items.map((item: any) => {
                    if (typeof item === 'object' && item.label) return [item.label, String(item.value)];
                    if (typeof item === 'string') {
                        const parts = item.split(/:(.*)/s);
                        return parts.length > 1 ? [parts[0], parts[1].trim()] : [item, ''];
                    }
                    return [JSON.stringify(item), ''];
                });
                doc.autoTable({ startY: yPos, body: body, theme: 'plain', styles: { fontSize: 9 }, columnStyles: { 0: { fontStyle: 'bold' } } });
            }
            yPos = doc.autoTable.previous.finalY + 10;
        });
    }

    addFooter();
    doc.save(`${record.projectName}_${record.fileName}.pdf`);
};

export default function SavedRecordsComponent({ employeeOnly = false }: { employeeOnly?: boolean }) {
    const { records, isLoading, error, deleteRecord, bankTimelineCategories } = useRecords();
    const { user: currentUser } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const mainCategories = useMemo(() => [
        { name: 'Banks', icon: Landmark, files: (bankTimelineCategories || []).map(b => `${b} Timeline`) },
        { name: 'Project Manual', icon: BookCopy, files: allFileNames.filter(name => !name.includes('Timeline') && !['Task Assignment', 'Uploaded File', 'Daily Work Report', 'My Projects', 'Leave Request Form', 'Transmittal Letter', 'Minutes of Meetings'].includes(name)) },
        { name: 'Transmittal Letter', icon: Send, files: ['Transmittal Letter'] },
        { name: 'Minutes of Meetings', icon: Users, files: ['Minutes of Meetings'] },
        { name: 'Assigned Tasks', icon: ClipboardCheck, files: ['Task Assignment', 'My Projects'] },
        { name: 'Employee Records', icon: Users, files: ['Uploaded File', 'Daily Work Report', 'Leave Request Form'] }
    ], [bankTimelineCategories]);

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
            r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
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

    const dashboardPrefix = employeeOnly ? 'employee-dashboard' : 'dashboard';

    const canEditOrDelete = (record: SavedRecord) => {
        if (!currentUser) return false;
        const isAdmin = currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d));
        return isAdmin || currentUser.uid === record.employeeId;
    };
    
    const renderRecordContent = () => {
        if (!viewingRecord) return null;
    
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
                    {sortedDates.map(date => (
                        <div key={date}>
                            <h4 className="font-bold text-lg mb-2">{format(parseISO(date), 'EEEE, dd MMMM yyyy')}</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Units</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entriesByDate[date].map(entry => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                                            <TableCell>{entry.projectName}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell className="text-right">{calculateTotalUnits(entry.startTime, entry.endTime)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ))}
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
                                            let parsed = item;
                                            if(typeof item === 'string') try {parsed = JSON.parse(item)} catch(e){return null}
                                            return <TableRow key={i}>{headers.map(h => <TableCell key={h}>{String(parsed[h] ?? '')}</TableCell>)}</TableRow>
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
                    ) : filteredRecords.length > 0 ? (
                        <Accordion type="multiple" className="w-full space-y-2">
                             {Object.entries(recordsByFileName).map(([fileName, records]) => {
                                if (records.length === 0) return null;
                                const Icon = getIconForFile(fileName);
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
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Project Name</TableHead>
                                                            <TableHead>File Name</TableHead>
                                                            {!employeeOnly && <TableHead>Created By</TableHead>}
                                                            <TableHead>Date</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {records.map(record => (
                                                            <TableRow key={record.id}>
                                                                <TableCell className="font-medium">{record.projectName}</TableCell>
                                                                <TableCell>{record.fileName}</TableCell>
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
