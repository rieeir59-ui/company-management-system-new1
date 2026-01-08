
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
import { generatePdfForRecord } from '@/lib/pdf-generator';
import { format, parseISO, isValid, differenceInMinutes } from 'date-fns';
import { StatusBadge } from '../ui/badge';
import jsPDF from 'jspdf';
import { getIconForFile } from '@/lib/icons';
import { getFormUrlFromFileName, allFileNames } from '@/lib/utils';
import { bankTimelineCategories, type ProjectRow } from '@/lib/projects-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<<<<<<< HEAD
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
            p.siteSurveyStart, p.siteSurveyEnd, p.contactStart, p.contactEnd, p.headCountStart, p.headCountEnd,
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
=======
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: {
    finalY: number;
  };
}
>>>>>>> origin/main

export default function SavedRecordsComponent({ employeeOnly = false }: { employeeOnly?: boolean }) {
    const { records, isLoading, error, deleteRecord, bankTimelineCategories } = useRecords();
    const { user: currentUser } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [viewingRecordItem, setViewingRecordItem] = useState<any>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

<<<<<<< HEAD
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
    
    const userRecords = useMemo(() => {
=======
    const mainCategories = useMemo(() => [
        { name: 'Banks', icon: Landmark, files: [...(bankTimelineCategories || []).map(b => `${b} Timeline`), "Running Projects Summary"] },
        { name: 'Project Manual', icon: BookCopy, files: allFileNames.filter(name => !name.includes('Timeline') && !['Task Assignment', 'My Projects', 'Leave Request Form', 'Daily Work Report', 'Uploaded File', 'Running Projects Summary'].includes(name)) },
        { name: 'Employee Documents', icon: Users, files: ['My Projects', 'Task Assignment', 'Leave Request Form', 'Daily Work Report'] }
    ], [bankTimelineCategories]);
    
    const isAdmin = useMemo(() => currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d)), [currentUser]);

    const filteredRecords = useMemo(() => {
        let userRecords = records;
>>>>>>> origin/main
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
<<<<<<< HEAD
    }, [userRecords, searchQuery, activeCategory, mainCategories, bankTimelineCategories]);

     const filteredRecordsByEmployee = useMemo(() => {
        if (!employeeSearchQuery) return [];
        return userRecords.filter(r => 
            r.employeeName.toLowerCase().includes(employeeSearchQuery.toLowerCase())
        );
    }, [userRecords, employeeSearchQuery]);

    const recordsByFileName = useMemo(() => {
        const recordsToGroup = employeeSearchQuery ? filteredRecordsByEmployee : filteredRecordsByCategory;
        return recordsToGroup.reduce((acc, record) => {
=======
    }, [records, employeeOnly, currentUser, searchQuery, activeCategory, mainCategories]);

    const recordsByFileName = useMemo(() => {
        if (activeCategory === 'Employee Documents' && !employeeOnly) return {}; // This view is handled by recordsByEmployee
        return filteredRecords.reduce((acc, record) => {
>>>>>>> origin/main
            if (!acc[record.fileName]) {
                acc[record.fileName] = [];
            }
            acc[record.fileName].push(record);
            return acc;
        }, {} as Record<string, SavedRecord[]>);
<<<<<<< HEAD
    }, [filteredRecordsByCategory, filteredRecordsByEmployee, employeeSearchQuery]);

    const getAssignedToFromRecord = (record: SavedRecord) => {
      if (record.fileName === 'Task Assignment' && Array.isArray(record.data) && record.data[0]?.category === 'Task Assignment') {
        const assignedToItem = record.data[0].items.find((item: any) => item.label === 'assignedTo');
        return assignedToItem?.value || 'N/A';
      }
      return 'N/A';
    };

=======
    }, [filteredRecords, activeCategory, employeeOnly]);

     const recordsByEmployee = useMemo(() => {
        if (activeCategory !== 'Employee Documents' || employeeOnly) return {};
        return filteredRecords.reduce((acc, record) => {
            const employeeName = record.employeeName || 'Unknown';
            if (!acc[employeeName]) {
                acc[employeeName] = [];
            }
            acc[employeeName].push(record);
            return acc;
        }, {} as Record<string, SavedRecord[]>);
    }, [filteredRecords, activeCategory, employeeOnly]);
>>>>>>> origin/main

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
<<<<<<< HEAD
    
        const isTimeline = viewingRecord.fileName.endsWith('Timeline');
        const isMyProjects = viewingRecord.fileName === 'My Projects';
        const isTaskAssignment = viewingRecord.fileName === 'Task Assignment';
        
        if (isMyProjects || isTaskAssignment) {
            const scheduleData = viewingRecord.data.find((d: any) => d.category === 'My Project Schedule' || d.category === 'Task Assignment');
            if (scheduleData?.items) {
                const projectItems = scheduleData.items.map((item: { label: string, value: string }) => {
                    const details: Record<string, string> = item.value.split(', ').reduce((acc: any, part: string) => {
                        const [key, ...val] = part.split(': ');
                        acc[key.trim().toLowerCase().replace(/\s/g, '')] = val.join(': ').trim();
                        return acc;
                    }, {});
                    details.project = item.label.replace('Project: ', '');
                    return details;
                });

                return (
                    <div>
                        <h3 className="font-bold text-primary mb-2">{scheduleData.category}</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Detail</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectItems.map((p, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{p.project}</TableCell>
                                        <TableCell>{p.detail}</TableCell>
                                        <TableCell>{p.status}</TableCell>
                                        <TableCell>{p.start}</TableCell>
                                        <TableCell>{p.end}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {scheduleData.remarks && (
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="font-bold">Remarks:</h4>
                                <p className="text-sm text-muted-foreground">{scheduleData.remarks}</p>
                            </div>
                        )}
                    </div>
                );
            }
        }
    
        const isContractorOrSubList = viewingRecord.fileName.startsWith('List of');
        if (isContractorOrSubList && viewingRecord.data?.header && viewingRecord.data?.items) {
            const { header, items } = viewingRecord.data;
             return (
                <div className="space-y-4">
                    <h3 className="font-bold text-primary mb-2">Header Information</h3>
                     <Table>
                        <TableBody>
                            <TableRow><TableCell className="font-semibold">Project Name</TableCell><TableCell>{header.projectName}</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Architect</TableCell><TableCell>{header.architect}</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Date</TableCell><TableCell>{header.date}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                    <h3 className="font-bold text-primary mb-2 mt-4">Items</h3>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Work</TableHead>
                                    <TableHead>Firm</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Representative</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item: any, index:number) => (
                                    <TableRow key={item.id || index}>
                                        <TableCell>{item.work}</TableCell>
                                        <TableCell>{item.firm}</TableCell>
                                        <TableCell>{item.address}</TableCell>
                                        <TableCell>{item.phone}</TableCell>
                                        <TableCell>{item.representative}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            );
        }

        if (viewingRecord.fileName === 'Shop Drawing and Sample Record' && viewingRecord.data?.header) {
            const { header, items } = viewingRecord.data;
            const parsedItems = items.map((item: string) => {
                try {
                    return JSON.parse(item);
                } catch {
                    return {};
                }
            });
            return (
                <div className="space-y-4">
                    <h3 className="font-bold text-primary mb-2">Header Information</h3>
                     <Table>
                        <TableBody>
                            <TableRow><TableCell className="font-semibold">Project Name</TableCell><TableCell>{header.projectName}</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Architect's Project No</TableCell><TableCell>{header.architectsProjectNo}</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Contractor</TableCell><TableCell>{header.contractor}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                    <h3 className="font-bold text-primary mb-2 mt-4">Items</h3>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Record #</TableHead>
                                    <TableHead>Spec Section</TableHead>
                                    <TableHead>Drawing No</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Trade</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Copies To</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedItems.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>{item.recordNo}</TableCell>
                                        <TableCell>{item.specSectionNo}</TableCell>
                                        <TableCell>{item.drawingNo}</TableCell>
                                        <TableCell>{item.title}</TableCell>
                                        <TableCell>{item.contractorSubcontractorTrade}</TableCell>
                                        <TableCell>{item.action?.join(', ')}</TableCell>
                                        <TableCell>{item.copiesTo?.join(', ')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            );
        }

        const dataAsArray = Array.isArray(viewingRecord.data) ? viewingRecord.data : [viewingRecord.data];
        
        let remarksSection: any = null;
        let mainDataSections = dataAsArray;

        if (isTimeline) {
            remarksSection = dataAsArray.find((s: any) => s.category === 'Remarks');
            mainDataSections = dataAsArray.filter((s: any) => s.category !== 'Remarks');
=======

        if (viewingRecord.fileName === 'Running Projects Summary') {
            const summaryData = viewingRecord.data?.find((d: any) => d.category === 'Summary')?.items || [];
            const statusData = viewingRecord.data?.find((d: any) => d.category === 'Status & Remarks')?.items || [];
            
            const overallStatus = statusData.find((i:any) => i.label === 'Overall Status')?.value;
            const remarks = statusData.find((i:any) => i.label === 'Maam Isbah Remarks & Order')?.value;
            const remarksDate = statusData.find((i:any) => i.label === 'Date')?.value;

            return (
                <div className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sr.No</TableHead>
                                <TableHead>Projects</TableHead>
                                <TableHead>Nos of project</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summaryData.map((row: any) => (
                                <TableRow key={row.srNo}>
                                    <TableCell>{row.srNo}</TableCell>
                                    <TableCell>{row.project}</TableCell>
                                    <TableCell>{row.count}</TableCell>
                                    <TableCell>{row.remarks}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4 space-y-2">
                        {overallStatus && <p><strong>Overall Status:</strong> {overallStatus}</p>}
                        {remarks && <p><strong>Maam Isbah Remarks & Order:</strong> {remarks}</p>}
                        {remarksDate && <p><strong>Date:</strong> {remarksDate}</p>}
                    </div>
                </div>
            )
>>>>>>> origin/main
        }

        if (viewingRecord.fileName.includes('Timeline')) {
            const projectsData = viewingRecord.data?.find((d: any) => d.category === 'Projects')?.items || [];
            const statusData = viewingRecord.data?.find((d: any) => d.category === 'Status & Remarks')?.items || [];
            
            const overallStatus = statusData.find((i:any) => i.label === 'Overall Status')?.value;
            const remarks = statusData.find((i:any) => i.label === 'Maam Isbah Remarks & Order')?.value;
            const remarksDate = statusData.find((i:any) => i.label === 'Date')?.value;

            const tableHeaders = [
                "Sr.No", "Project Name", "Area", "Project Holder", "Allocation Date", 
                "Site Survey", "Contract", "Head Count", "Proposal", "3D's", "Tender Arch", 
                "Tender MEP", "BOQ", "Tender Status", "Comparative", "Working Drawings", 
                "Site Visit", "Final Bill", "Project Closure"
            ];
            
            return (
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    {tableHeaders.map(header => {
                                        const isDateRange = ['Site Survey', 'Contract', 'Head Count', 'Proposal', "3D's", 'Tender Arch', 'Tender MEP', 'BOQ', 'Working Drawings', 'Site Visit'].includes(header);
                                        return <TableHead key={header} colSpan={isDateRange ? 2 : 1} rowSpan={isDateRange ? 1 : 2} className="align-bottom p-1 border text-center">{header}</TableHead>
                                    })}
                                </TableRow>
                                <TableRow>
                                    {tableHeaders.flatMap(header => {
                                        if (['Site Survey', 'Contract', 'Head Count', 'Proposal', "3D's", 'Tender Arch', 'Tender MEP', 'BOQ', 'Working Drawings', 'Site Visit'].includes(header)) {
                                            return [<TableHead key={`${header}-start`} className="p-1 border text-center">Start</TableHead>, <TableHead key={`${header}-end`} className="p-1 border text-center">End</TableHead>]
                                        }
                                        return [];
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectsData.map((p: any, index: number) => (
                                    <TableRow key={p.id || index}>
                                        <TableCell className="p-1 border">{p.srNo}</TableCell>
                                        <TableCell className="p-1 border">{p.projectName}</TableCell>
                                        <TableCell className="p-1 border">{p.area}</TableCell>
                                        <TableCell className="p-1 border">{p.projectHolder}</TableCell>
                                        <TableCell className="p-1 border">{p.allocationDate}</TableCell>
                                        <TableCell className="p-1 border">{p.siteSurveyStart}</TableCell>
                                        <TableCell className="p-1 border">{p.siteSurveyEnd}</TableCell>
                                        <TableCell className="p-1 border">{p.contractStart || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.contactEnd || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.headCountStart || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.headCountEnd || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.proposalStart}</TableCell>
                                        <TableCell className="p-1 border">{p.proposalEnd}</TableCell>
                                        <TableCell className="p-1 border">{p.threedStart}</TableCell>
                                        <TableCell className="p-1 border">{p.threedEnd}</TableCell>
                                        <TableCell className="p-1 border">{p.tenderArchStart}</TableCell>
                                        <TableCell className="p-1 border">{p.tenderArchEnd}</TableCell>
                                        <TableCell className="p-1 border">{p.tenderMepStart}</TableCell>
                                        <TableCell className="p-1 border">{p.tenderMepEnd}</TableCell>
                                        <TableCell className="p-1 border">{p.boqStart}</TableCell>
                                        <TableCell className="p-1 border">{p.boqEnd}</TableCell>
                                        <TableCell className="p-1 border">{p.tenderStatus}</TableCell>
                                        <TableCell className="p-1 border">{p.comparative}</TableCell>
                                        <TableCell className="p-1 border">{p.workingDrawingsStart || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.workingDrawingsEnd || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.siteVisitStart || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.siteVisitEnd || ''}</TableCell>
                                        <TableCell className="p-1 border">{p.finalBill}</TableCell>
                                        <TableCell className="p-1 border">{p.projectClosure}</TableCell>
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
    
            return (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Day</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Total Units</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry: any, index: number) => (
                            <TableRow key={entry.id || index}>
                                <TableCell>{isValid(parseISO(entry.date)) ? format(parseISO(entry.date), 'dd-MMM-yyyy') : 'Invalid Date'}</TableCell>
                                <TableCell>{isValid(parseISO(entry.date)) ? format(parseISO(entry.date), 'EEEE') : '-'}</TableCell>
                                <TableCell>{entry.startTime}</TableCell>
                                <TableCell>{entry.endTime}</TableCell>
                                <TableCell>{entry.projectName}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell>{calculateTotalUnits(entry.startTime, entry.endTime)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
                    
<<<<<<< HEAD
                    const isTimelineProject = isTimeline && section.category === 'Projects';

                    const headers = isTimelineProject
                        ? Object.keys(firstItem || {}).filter(key => key !== 'id')
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
                                    if (typeof item === 'object' && item.label && item.value !== undefined) return <TableRow key={i}><TableCell className="font-semibold">{item.label}</TableCell><TableCell>{String(item.value)}</TableCell></TableRow>;
                                    if (typeof item === 'string') {
                                        const parts = item.split(/:(.*)/s);
                                        return parts.length > 1 ? <TableRow key={i}><TableCell className="font-semibold">{parts[0]}</TableCell><TableCell>{parts[1]?.trim()}</TableCell></TableRow> : <TableRow key={i}><TableCell colSpan={2}>{item}</TableCell></TableRow>;
                                    }
                                     return <TableRow key={i}><TableCell colSpan={2}>{JSON.stringify(item)}</TableCell></TableRow>;
                                })}
                                </TableBody>
                            </Table>
=======
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
>>>>>>> origin/main
                        </div>
                    );
                })}
            </div>
        );
    };

<<<<<<< HEAD
    if (!isClient) {
        return (
             <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
        );
    }
=======
>>>>>>> origin/main

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
                            className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent hover:border-primary transition-all"
                            onClick={() => setActiveCategory(name)}
                        >
                            <Icon className="w-12 h-12 text-primary" />
                            <p className="font-semibold text-lg text-center">{name}</p>
                        </Card>
                    ))}
                </div>
            ) : (
<<<<<<< HEAD
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => setActiveCategory(null)}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <CardTitle className="text-2xl font-bold">{activeCategory}</CardTitle>
=======
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
                                
                                return (
                                    <AccordionItem value={fileName} key={fileName}>
                                        <AccordionTrigger className="bg-muted/50 hover:bg-muted px-4 py-2 rounded-md font-semibold text-lg flex justify-between w-full">
                                            <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><span>{fileName}</span><Badge variant="secondary">{fileRecords.length}</Badge></div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2">
                                            <div className="border rounded-b-lg">
                                                <Table>
<<<<<<< HEAD
                                                    <TableHeader><TableRow><TableHead>Project Name</TableHead>{!employeeOnly && <TableHead>Created By</TableHead>}<TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
=======
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Project Name</TableHead>
                                                            <TableHead>File Name</TableHead>
                                                            {!employeeOnly && <TableHead>Created By</TableHead>}
                                                            <TableHead>Date</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
>>>>>>> 6000ad1 (recod is format ma save ho file name project name etcc etc)
                                                    <TableBody>
                                                        {fileRecords.map(record => (
                                                            <TableRow key={record.id}>
                                                                <TableCell className="font-medium">{record.projectName}</TableCell>
                                                                <TableCell>{record.fileName}</TableCell>
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
>>>>>>> origin/main
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
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Project Name</TableHead>
                                                                {isTaskAssignment && <TableHead>Assigned To</TableHead>}
                                                                {!employeeOnly && <TableHead>Created By</TableHead>}
                                                                <TableHead>Date</TableHead>
                                                                <TableHead className="text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
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

    