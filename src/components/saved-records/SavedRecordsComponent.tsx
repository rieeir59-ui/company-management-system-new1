
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Download, Trash2, Edit, Loader2, Landmark, Home, Building, Hotel, ExternalLink, ArrowLeft, Users, Folder, BookCopy, ClipboardCheck, FileSearch, Search, Eye } from "lucide-react";
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

const generatePdfForRecord = (record: SavedRecord) => {
    const doc = new jsPDF({ orientation: 'landscape' }) as any;
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
    
    if (record.fileName === 'Leave Request Form') {
        const doc = new jsPDF();
        let y = 20;

        const employeeInfo = record.data.find((d:any) => d.category === 'Employee Information')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
        const leaveDetails = record.data.find((d:any) => d.category === 'Leave Details')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
        const hrApproval = record.data.find((d:any) => d.category === 'HR Approval')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('LEAVE REQUEST FORM', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 15;

        doc.setFontSize(10);
        
        const addSectionHeader = (text: string) => {
            doc.setFont('helvetica', 'bold');
            doc.text(text, 14, y);
            y += 7;
            doc.setFont('helvetica', 'normal');
        };

        const drawCheckbox = (x: number, y: number, checked: boolean) => {
          doc.setLineWidth(0.2);
          doc.rect(x, y - 3.5, 4, 4);
          if (checked) {
              doc.setFillColor(0, 0, 0);
              doc.rect(x + 0.5, y - 3, 3, 3, 'F');
          }
        };
        
        addSectionHeader('Employee to Complete');
        (doc as any).autoTable({
            startY: y, theme: 'grid', showHead: false,
            body: [
                [`Employee Name: ${employeeInfo['Employee Name'] || ''}`, `Employee Number: ${employeeInfo['Employee Number'] || ''}`],
                [`Department: ${employeeInfo['Department'] || ''}`, `Position: ${employeeInfo['Position'] || ''}`],
            ]
        });
        y = (doc as any).autoTable.previous.finalY + 5;
        
        doc.text(`Status (select one):`, 14, y);
        drawCheckbox(50, y, leaveDetails['Status'] === 'Full-time');
        doc.text('Full-time', 55, y);
        drawCheckbox(80, y, leaveDetails['Status'] === 'Part-time');
        doc.text('Part-time', 85, y);
        y += 10;
        
        doc.text(`I hereby request a leave of absence effective from (${leaveDetails['Leave From']}) to (${leaveDetails['Leave To']})`, 14, y);
        y += 7;
        doc.text(`Total Days: ${leaveDetails['Total Days']}`, 14, y);
        y += 7;
        doc.text(`I expect to return to work on Date: (${leaveDetails['Return Date']})`, 14, y);
        y += 10;
        
        addSectionHeader('Reason for Requested:');
        drawCheckbox(14, y, leaveDetails['Leave Type']?.includes('Sick Leave'));
        doc.text('SICK LEAVE', 20, y);
        y += 7;
        drawCheckbox(14, y, leaveDetails['Leave Type']?.includes('Casual Leave'));
        doc.text('CASUAL LEAVE', 20, y);
        y += 7;
        drawCheckbox(14, y, leaveDetails['Leave Type']?.includes('Annual Leave'));
        doc.text('ANNUAL LEAVE', 20, y);
        y += 10;
        
        doc.text('REASON:', 14, y);
        y += 5;
        doc.setLineWidth(0.5);
        doc.line(14, y, 196, y);
        doc.text(leaveDetails['Reason'] || '', 16, y-1);
        y += 15;
        
        addSectionHeader('HR Department Approval:');
        drawCheckbox(14, y, hrApproval['Approved'] === 'true');
        doc.text('LEAVE APPROVED', 20, y);
        y += 7;
        drawCheckbox(14, y, hrApproval['Denied'] === 'true');
        doc.text('LEAVE DENIED', 20, y);
        y += 10;
        
        doc.text('REASON:', 14, y);
        y += 5;
        doc.setLineWidth(0.5);
        doc.line(14, y, 196, y);
        doc.text(hrApproval['Reason'] || '', 16, y-1);
        y += 10;
        
        doc.text('Date:', 14, y);
        doc.text(hrApproval['Date'] || '____________', 25, y);
        y += 10;
        
        drawCheckbox(14, y, hrApproval['Paid Leave'] === 'true');
        doc.text('PAID LEAVE', 20, y);
        drawCheckbox(60, y, hrApproval['Unpaid Leave'] === 'true');
        doc.text('UNPAID LEAVE', 66, y);
        y += 20;

        doc.text('COMPANY CEO: SIGNATURE', 14, y);
        doc.text('DATE:', 150, y);
        y += 5;
        doc.line(14, y, 90, y);
        doc.line(160, y, 196, y);
    } else if (record.fileName.endsWith('Timeline')) {
        doc.setProperties({ title: `${record.projectName} Timeline` });
        doc.setFontSize(10);
        doc.text(record.projectName, 14, 15);

        const projects: ProjectRow[] = record.data.find((s:any) => s.category === 'Projects')?.items || [];
        const remarksSection = record.data.find((s:any) => s.category === 'Remarks');
        
        const head = [
            [
                { content: 'Sr.No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Project Name', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Area in Sft', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Project Holder', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Allocation Date / RFP', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Site Survey', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Contract', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Head Count / Requirment', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Proposal / Design Development', colSpan: 2, styles: { halign: 'center' } },
                { content: '3D\'s', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Tender Package Architectural', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Tender Package MEP', colSpan: 2, styles: { halign: 'center' } },
                { content: 'BOQ', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Tender Status', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Comparative', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Working Drawings', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Site Visit', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Final Bill', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Project Closure', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            [
                'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date',
                'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date',
                'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date',
                'Start Date', 'End Date'
            ].map(h => ({ content: h, styles: { halign: 'center' } }))
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

        doc.autoTable({
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 4.5, cellPadding: 1, valign: 'middle', halign: 'center', lineWidth: 0.1 },
            headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 4, valign: 'middle', halign: 'center', lineWidth: 0.1 },
        });

        if (remarksSection) {
            let lastY = doc.autoTable.previous.finalY + 10;
            const remarksText = remarksSection.items.find((item: any) => item.label === "Maam Isbah Remarks & Order")?.value || "";
            const dateText = remarksSection.items.find((item: any) => item.label === "Date")?.value || "";
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text("Maam Isbah Remarks & Order", 14, lastY);
            lastY += 7;
            doc.setFont('helvetica', 'normal');
            doc.text(remarksText, 14, lastY, { maxWidth: pageWidth - 28 });
            lastY += doc.getTextDimensions(remarksText, { maxWidth: pageWidth - 28 }).h + 10;

            doc.text(`Date: ${dateText}`, 14, lastY);
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
        const projectManualFiles = (allFileNames || []).filter(name => !name.includes('Timeline') && !['Task Assignment', 'Uploaded File', 'Daily Work Report', 'My Projects', 'Leave Request Form'].includes(name));

        return [
            { name: 'Banks', icon: Landmark, files: allBankFileNames },
            { name: 'Project Manual', icon: BookCopy, files: projectManualFiles },
            { name: 'Assigned Tasks', icon: ClipboardCheck, files: ['Task Assignment', 'My Projects'] },
            { name: 'Employee Records', icon: Users, files: ['Uploaded File', 'Daily Work Report', 'Leave Request Form'] }
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

    const dataSections = Array.isArray(viewingRecord.data) ? viewingRecord.data : [viewingRecord.data];
    
    if (viewingRecord.fileName === 'Leave Request Form') {
        const employeeInfo = dataSections.find((d:any) => d.category === 'Employee Information')?.items.reduce((acc: any, item: any) => ({...acc, [item.label]: item.value}), {}) || {};
        const leaveDetails = dataSections.find((d:any) => d.category === 'Leave Details')?.items.reduce((acc: any, item: any) => ({...acc, [item.label]: item.value}), {}) || {};
        const hrApproval = dataSections.find((d:any) => d.category === 'HR Approval')?.items.reduce((acc: any, item: any) => ({...acc, [item.label]: item.value}), {}) || {};
        return (
            <div className="space-y-4 text-sm">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-bold text-primary mb-2">Employee Information</h3>
                    <p><strong>Employee Name:</strong> {employeeInfo['Employee Name']}</p>
                    <p><strong>Employee Number:</strong> {employeeInfo['Employee Number']}</p>
                    <p><strong>Department:</strong> {employeeInfo['Department']}</p>
                    <p><strong>Position:</strong> {employeeInfo['Position']}</p>
                    <p><strong>Status:</strong> {employeeInfo['Status']}</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-bold text-primary mb-2">Leave Details</h3>
                    <p><strong>Leave From:</strong> {leaveDetails['Leave From']}</p>
                    <p><strong>Leave To:</strong> {leaveDetails['Leave To']}</p>
                    <p><strong>Return Date:</strong> {leaveDetails['Return Date']}</p>
                    <p><strong>Total Days:</strong> {leaveDetails['Total Days']}</p>
                    <p><strong>Leave Type:</strong> {leaveDetails['Leave Type']}</p>
                    <p><strong>Reason:</strong> {leaveDetails['Reason'] || 'N/A'}</p>
                </div>
                 <div className="p-4 border rounded-lg">
                    <h3 className="font-bold text-primary mb-2">HR Approval</h3>
                    <p><strong>Approved:</strong> {hrApproval['Approved'] === 'true' ? 'Yes' : 'No'}</p>
                    <p><strong>Denied:</strong> {hrApproval['Denied'] === 'true' ? 'Yes' : 'No'}</p>
                    <p><strong>Reason:</strong> {hrApproval['Reason'] || 'N/A'}</p>
                    <p><strong>Date:</strong> {hrApproval['Date'] || 'N/A'}</p>
                    <p><strong>Paid Leave:</strong> {hrApproval['Paid Leave'] === 'true' ? 'Yes' : 'No'}</p>
                    <p><strong>Unpaid Leave:</strong> {hrApproval['Unpaid Leave'] === 'true' ? 'Yes' : 'No'}</p>
                </div>
            </div>
        );
    }
    
    // Fallback for other record types
    return (
        <div className="space-y-4">
            {dataSections.map((section: any, index: number) => {
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
                                <TableHeader><TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
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
