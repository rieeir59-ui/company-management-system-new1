'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Download, Trash2, Edit, Loader2, Landmark, Home, Building, Hotel, ExternalLink, ArrowLeft, Users, Folder, BookCopy, ClipboardCheck, FileSearch, Search } from "lucide-react";
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
import { Eye } from 'lucide-react';

const generatePdfForRecord = (record: SavedRecord) => {
    const doc = new jsPDF({ orientation: 'portrait' }) as any;
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    let yPos = 20;
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
    
    const isTimeline = record.fileName.endsWith('Timeline');

    if (isTimeline) {
        doc.setProperties({
            title: `${record.projectName} Timeline`
        });
        doc.setFontSize(10);
        doc.text(record.projectName, 14, 15);

        const projects: ProjectRow[] = record.data.find((s:any) => s.category === 'Projects')?.items || [];
        const remarksSection = record.data.find((s:any) => s.category === 'Remarks');

        const head = [
            ['Sr.\nNo', 'Project Name', 'Area\nin Sft', 'Project\nHolder', 'Allocation\nDate / RFP', 
             'Site Survey\nStart', 'Site Survey\nEnd', 'Contract', 'Head Count\n/ Requirment',
             'Proposal /\nDesign\nDevelopment\nStart', 'Proposal /\nDesign\nDevelopment\nEnd', '3D\'s\nStart', '3D\'s\nEnd',
             'Tender\nPackage\nArchitectural\nStart', 'Tender\nPackage\nArchitectural\nEnd', 'Tender\nPackage\nMEP\nStart', 'Tender\nPackage\nMEP\nEnd',
             'BOQ\nStart', 'BOQ\nEnd', 'Tender\nStatus', 'Comparative', 
             'Working\nDrawings\nStart', 'Working\nDrawings\nEnd', 
             'Site Visit\nStart', 'Site Visit\nEnd', 
             'Final Bill', 'Project\nClosure']
        ];
        
        const body = projects.map(p => [
            p.srNo, p.projectName, p.area, p.projectHolder, p.allocationDate,
            p.siteSurveyStart, p.siteSurveyEnd, p.contract, p.headCount,
            p.proposalStart, p.proposalEnd, p.threedStart, p.threedEnd,
            p.tenderArchStart, p.tenderArchEnd, p.tenderMepStart, p.tenderMepEnd,
            p.boqStart, p.boqEnd, p.tenderStatus, p.comparative, 
            p.workingDrawingsStart, p.workingDrawingsEnd, 
            p.siteVisitStart, p.siteVisitEnd, 
            p.finalBill, p.projectClosure
        ]);

        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 5, cellPadding: 1, valign: 'middle', halign: 'center' },
            headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 4.5, valign: 'middle', halign: 'center' },
        });

        if (remarksSection) {
            let lastY = (doc as any).autoTable.previous.finalY + 10;
            const remarksText = remarksSection.items.find((item: any) => item.label === "Maam Isbah Remarks & Order")?.value || "";
            const dateText = remarksSection.items.find((item: any) => item.label === "Date")?.value || "";
            doc.text("Maam Isbah Remarks & Order", 14, lastY);
            lastY += 7;
            doc.text(remarksText, 14, lastY);
            lastY += 10;
            doc.text(`Date: ${dateText}`, 14, lastY);
        }

    } else {
        addDefaultHeader(record.fileName, record.projectName);
        
        if (Array.isArray(record.data)) {
            record.data.forEach((section: any) => {
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

                if (typeof firstItem === 'object' && firstItem !== null && Object.keys(firstItem).length > 0 && !firstItem.label) {
                    const headers = Object.keys(firstItem).filter(key => key !== 'id');
                    const body = section.items.map((item: any) => {
                        let parsedItem = item;
                        if (typeof item === 'string') {
                            try { parsedItem = JSON.parse(item); } catch (e) { return headers.map(() => ''); }
                        }
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
                        if (typeof item === 'object' && item.label && item.value !== undefined) return [item.label, String(item.value)];
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

    const mainCategories = useMemo(() => {
        const allBankFileNames = (bankTimelineCategories || []).map(b => `${b} Timeline`);
        const projectManualFiles = (allFileNames || []).filter(name => !allBankFileNames.includes(name) && !['Task Assignment', 'Uploaded File', 'Daily Work Report', 'My Projects'].includes(name));

        return [
            { name: 'Banks', icon: Landmark, files: allBankFileNames },
            { name: 'Project Manual', icon: BookCopy, files: projectManualFiles },
            { name: 'Assigned Tasks', icon: ClipboardCheck, files: ['Task Assignment', 'My Projects'] },
            { name: 'Employee Records', icon: Users, files: ['Uploaded File', 'Daily Work Report'] }
        ];
    }, [bankTimelineCategories]);

    const filteredRecords = useMemo(() => {
        let userRecords = records;
        if (employeeOnly && currentUser) {
            userRecords = records.filter(r => r.employeeId === currentUser.uid);
        }
        if (!activeCategory) return [];
    
        const categoryInfo = mainCategories.find(c => c.name === activeCategory);
        let categoryFiles = categoryInfo?.files || [];

        if (activeCategory === 'Banks') {
            const currentBankFileNames = (bankTimelineCategories || []).map(b => `${b} Timeline`);
            categoryFiles = [...new Set([...categoryFiles, ...currentBankFileNames])];
        }

        const categoryRecords = userRecords.filter(r => categoryFiles.includes(r.fileName));
        
        if (!searchQuery) return categoryRecords;
        
        return categoryRecords.filter(r => 
            r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [records, employeeOnly, currentUser, searchQuery, activeCategory, mainCategories, bankTimelineCategories]);

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
    
        const isBankTimeline = viewingRecord.fileName.includes('Timeline');
        let remarksSection: any = null;
        let mainDataSections = viewingRecord.data;

        if (isBankTimeline) {
            remarksSection = viewingRecord.data.find((s: any) => s.category === 'Remarks');
            mainDataSections = viewingRecord.data.filter((s: any) => s.category !== 'Remarks');
        }

        return (
            <div className="space-y-4">
                {mainDataSections.map((section: any, index: number) => {
                    if (typeof section !== 'object' || !section.category || !Array.isArray(section.items)) return null;

                    let firstItem = section.items[0];
                    if (typeof firstItem === 'string') {
                        try { firstItem = JSON.parse(firstItem); } catch (e) { /* Not JSON */ }
                    }
                    
                    const bankTimelineHeaders = ['srNo', 'projectName', 'area', 'projectHolder', 'allocationDate', 'siteSurveyStart', 'siteSurveyEnd', 'contract', 'headCount', 'proposalStart', 'proposalEnd', 'threedStart', 'threedEnd', 'tenderArchStart', 'tenderArchEnd', 'tenderMepStart', 'tenderMepEnd', 'boqStart', 'boqEnd', 'tenderStatus', 'comparative', 'workingDrawingsStart', 'workingDrawingsEnd', 'siteVisitStart', 'siteVisitEnd', 'finalBill', 'projectClosure'];
                    const isTimelineProject = isBankTimeline && section.category === 'Projects';

                    const headers = isTimelineProject
                        ? bankTimelineHeaders
                        : (typeof firstItem === 'object' && firstItem !== null && Object.keys(firstItem).length > 0 && !firstItem.label)
                            ? Object.keys(firstItem).filter(key => key !== 'id')
                            : null;

                    if (headers) {
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
                                    if (typeof item === 'string') {
                                        const parts = item.split(/:(.*)/s);
                                        return <TableRow key={i}><TableCell className="font-semibold">{parts[0]}</TableCell><TableCell>{parts[1]?.trim()}</TableCell></TableRow>;
                                    }
                                    if(item.label) {
                                         return <TableRow key={i}><TableCell className="font-semibold">{item.label}</TableCell><TableCell>{String(item.value)}</TableCell></TableRow>;
                                    }
                                     return <TableRow key={i}><TableCell colSpan={2}>{JSON.stringify(item)}</TableCell></TableRow>;
                                })}
                                </TableBody>
                            </Table>
                        </div>
                    );
                })}
                {remarksSection && (
                    <div className="mt-4 pt-4 border-t">
                        <h3 className="font-bold text-primary mb-2">{remarksSection.category}</h3>
                        {remarksSection.items.map((remark: {label: string, value: string}, i: number) => (
                           <p key={i}><strong>{remark.label}:</strong> {remark.value}</p>
                        ))}
                    </div>
                )}
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
