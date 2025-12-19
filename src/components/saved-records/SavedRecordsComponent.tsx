
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { Loader2, Search, Trash2, Edit, Download, Eye, ArrowLeft, User as UserIcon, Landmark, Building, ClipboardCheck, Users, Folder, BookCopy } from 'lucide-react';
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
import { getIconForFile } from '@/lib/icons';
import { getFormUrlFromFileName, allFileNames } from '@/lib/utils';
import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { StatusBadge } from '../ui/badge';
import { bankTimelineCategories } from '@/lib/projects-data';

const generatePdfForRecord = (record: SavedRecord) => {
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    let yPos = 20;
    const primaryColor = [45, 95, 51];
    const margin = 14;

    const addDefaultHeader = () => {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(record.fileName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(record.projectName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        doc.setFontSize(9);
        doc.text(`Record ID: ${record.id}`, 14, yPos);
        doc.text(`Date: ${record.createdAt.toLocaleDateString()}`, pageWidth - 14, yPos, { align: 'right' });
        yPos += 10;
        doc.setLineWidth(0.5);
        doc.line(14, yPos - 5, pageWidth - 14, yPos - 5);
    };

    const addFooter = () => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    };
    
    // Generic PDF generation
    const generateGenericPdf = () => {
        addDefaultHeader();

        if (Array.isArray(record.data)) {
            record.data.forEach((section: any) => {
                if (typeof section === 'object' && section !== null && section.category) {
                    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(11);
                    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.text(section.category, 14, yPos);
                    yPos += 8;
                    doc.setTextColor(0,0,0);

                    const body = (Array.isArray(section.items) ? section.items : [section.items]).map((item: any) => {
                         if (typeof item === 'string') {
                            const parts = item.split(/:(.*)/s);
                            return parts.length > 1 ? [parts[0], parts[1].trim()] : [item, ''];
                         } else if (item && item.label && item.value !== undefined) {
                            return [item.label, String(item.value)];
                         }
                         return [JSON.stringify(item), ''];
                    });

                    (doc as any).autoTable({
                        startY: yPos,
                        body: body,
                        theme: 'striped',
                        styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
                        headStyles: { fontStyle: 'bold' },
                        columnStyles: { 0: { fontStyle: 'bold' } }
                    });
                     yPos = (doc as any).autoTable.previous.finalY + 10;
                }
            });
        }
        addFooter();
        doc.save(`${record.projectName}_${record.fileName}.pdf`);
    };

    if (record.fileName === 'Project Agreement') {
        const addText = (text: string, isBold = false, indent = 0, size = 10, spaceAfter = 7) => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setFontSize(size);
            const splitText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 28 - indent);
            doc.text(splitText, 14 + indent, yPos);
            yPos += (splitText.length * 4) + spaceAfter;
        };
        const addList = (items: { label: string, value: string }[]) => {
            items.forEach(item => addText(`${item.label} ${item.value}`, false, 5, 10, 5));
        };
        
        addText('COMMERCIAL AGREEMENT', true, 0, 14, 10);
        const details = record.data.find(d => d.category === 'Agreement Details')?.items || [];
        addText(`Made as of the day ${details.find((d:any)=>d.label.includes('day'))?.value || '________________'}`);
        addText(`Between the Owner: ${details.find((d:any)=>d.label.includes('Owner'))?.value || '________________'}`);
        addText(`For the Design of: ${details.find((d:any)=>d.label.includes('Design'))?.value || '________________'}`);
        addText(`Address: ${details.find((d:any)=>d.label.includes('Address'))?.value || '________________'}`);
        
        const costBody = record.data.find(d => d.category === 'Cost Breakdown')?.items.map((item: any) => [item.label, item.value]) || [];
        (doc as any).autoTable({ startY: yPos, theme: 'plain', styles: { fontSize: 10 }, body: costBody });
        yPos = (doc as any).autoTable.previous.finalY + 10;
        
        addText('PAYMENT SCHEDULE:', true, 0, 12, 8);
        const paymentBody = record.data.find(d => d.category === 'Payment Schedule')?.items.map((item: any) => [item.label, item.value]) || [];
        (doc as any).autoTable({ startY: yPos, body: paymentBody, theme: 'plain', styles: { fontSize: 10, cellPadding: 1 } });
        yPos = (doc as any).autoTable.previous.finalY + 10;

        addText('Project Management', true, 0, 12, 8);
        addText('Top Supervision:', true, 2, 10, 5);
        addList(record.data.find(d => d.category === 'Top Supervision')?.items || []);

        addText('Detailed Supervision:', true, 2, 10, 5);
        addText(record.data.find(d => d.category === 'Detailed Supervision')?.items[0]?.value || '', false, 5);

        addText('Please Note:', true, 0, 12, 8);
        addList(record.data.find(d => d.category === 'Notes')?.items || []);
        addText(record.data.find(d => d.category === 'Extra Services Note')?.items[0]?.value || '', true, 2);
        
        doc.addPage(); yPos = 20;

        addText("Architect's Responsibilities", true, 0, 12, 8);
        addList(record.data.find(d => d.category === "Architect's Responsibilities")?.items || []);

        addText("The Architect will not be responsible for the following things:", true, 0, 12, 8);
        addList(record.data.find(d => d.category === 'Not Responsible For')?.items || []);

        addText("ARTICLE-1: Termination of the Agreement", true, 0, 12, 8);
        addList(record.data.find(d => d.category === 'Termination')?.items || []);

        doc.addPage(); yPos = 20;

        addText("ARTICLE-2: Bases of Compensation", true, 0, 12, 8);
        addList(record.data.find(d => d.category === 'Compensation')?.items || []);

        yPos += 10;
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        addText('____________________', false, 0, 10, 2);
        addText('Architect', false, 0, 10, 15);
        addText('____________________', false, 0, 10, 2);
        addText('Client', false, 0, 10, 5);

        addFooter();
        doc.save('Project-Agreement.pdf');
    } else {
        generateGenericPdf();
    }
};

const mainCategories = [
    { name: 'Banks', icon: Landmark, files: bankTimelineCategories },
    { name: 'Project Manual', icon: BookCopy, files: allFileNames.filter(name => ![...bankTimelineCategories, 'Task Assignment', 'Uploaded File'].includes(name)) },
    { name: 'Assigned Tasks', icon: ClipboardCheck, files: ['Task Assignment'] },
    { name: 'Employee Records', icon: Users, files: ['Uploaded File', 'Daily Work Report'] }
];

export default function SavedRecordsComponent({ employeeOnly = false }: { employeeOnly?: boolean }) {
    const { records, isLoading, error, deleteRecord } = useRecords();
    const { user: currentUser } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filteredRecords = useMemo(() => {
        let userRecords = records;
        if (employeeOnly && currentUser) {
            userRecords = records.filter(r => r.employeeId === currentUser.uid);
        }
        if (!activeCategory) return [];

        const categoryFiles = mainCategories.find(c => c.name === activeCategory)?.files || [];
        
        const categoryRecords = userRecords.filter(r => categoryFiles.includes(r.fileName));
        
        if (!searchQuery) return categoryRecords;
        
        return categoryRecords.filter(r => 
            r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [records, employeeOnly, currentUser, searchQuery, activeCategory]);

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
        return (
            <Table>
                <TableBody>
                    {viewingRecord.data.map((section: any, index: number) => (
                        <React.Fragment key={index}>
                            <TableRow className="bg-muted hover:bg-muted">
                                <TableCell colSpan={2} className="font-bold text-primary">{section.category}</TableCell>
                            </TableRow>
                            {Array.isArray(section.items) ? section.items.map((item: any, i: number) => {
                                if (typeof item === 'string') {
                                    const parts = item.split(/:(.*)/s);
                                    if (parts.length > 1) {
                                        return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8">{parts[0]}</TableCell><TableCell>{parts[1]?.trim()}</TableCell></TableRow>;
                                    }
                                }
                                if (item && typeof item === 'object' && item.label && item.value !== undefined) {
                                    return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8">{item.label}</TableCell><TableCell>{String(item.value)}</TableCell></TableRow>;
                                }
                                return <TableRow key={`${index}-${i}`}><TableCell colSpan={2} className="pl-8">{JSON.stringify(item)}</TableCell></TableRow>;
                            }) : <TableRow><TableCell colSpan={2}>{String(section.items)}</TableCell></TableRow>}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
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
                            placeholder="Search records by project or file name..."
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
                        <div className="space-y-6">
                            {Object.entries(recordsByFileName).map(([fileName, records]) => {
                                if (records.length === 0) return null;
                                const Icon = getIconForFile(fileName)
                                return (
                                    <Card key={fileName} className="border-primary/30">
                                        <CardHeader className="bg-muted/50 rounded-t-lg">
                                            <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {fileName}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Project Name</TableHead>
                                                        {!employeeOnly && <TableHead>Created By</TableHead>}
                                                        <TableHead>Date</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {records.map(record => (
                                                        <TableRow key={record.id}>
                                                            <TableCell className="font-medium">{record.projectName}</TableCell>
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
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
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
                <div className="max-h-[70vh] overflow-y-auto p-1">
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

    
