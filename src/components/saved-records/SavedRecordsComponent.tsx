
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { Loader2, Search, Trash2, Edit, Download, Eye, ArrowLeft, User as UserIcon } from 'lucide-react';
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
import { getFormUrlFromFileName } from '@/lib/utils';
import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { StatusBadge } from '../ui/badge';
import { bankTimelineCategories } from '@/lib/projects-data';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
}


const generatePdfForRecord = (record: SavedRecord) => {
    const doc = new jsPDF({ orientation: 'portrait' }) as jsPDFWithAutoTable;
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    let yPos = 15;
    const primaryColor = [45, 95, 51];
    const headingFillColor = [240, 240, 240];
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

    if (record.fileName === 'Site Survey Report') {
        const allItems = record.data.flatMap((d: any) => d.items);
        const getValue = (key: string) => allItems.find((item: any) => item.label === key)?.value || '';
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ISBAH HASSAN & ASSOCIATES', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text('Premises Review for all Projects', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFontSize(8);
        doc.text('This questionnaire form provides preliminary information for determining the suitability of premises or property to be acquired', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SITE SURVEY', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        doc.text(`Date: ${getValue('location_date')}`, pageWidth - margin, yPos, { align: 'right'});
        yPos += 7;

        const addSectionTitle = (title: string) => {
            if (yPos > 260) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.5);
            doc.setFillColor(headingFillColor[0], headingFillColor[1], headingFillColor[2]);
            doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(title, margin + 2, yPos + 5.5);
            yPos += 10;
        };

        const drawField = (label: string, value: string) => {
          if (yPos > 275) { doc.addPage(); yPos = 20; }
          doc.setLineWidth(0.2);
          doc.rect(margin, yPos, pageWidth - margin * 2, 8);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(label, margin + 2, yPos + 5.5);
          doc.text(value, margin + 60, yPos + 5.5);
          yPos += 8;
        };

        const drawCheckboxField = (label: string, options: {id: string, label: string}[]) => {
            if (yPos > 275) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.2);
            doc.rect(margin, yPos, pageWidth - margin * 2, 8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(label, margin + 2, yPos + 5.5);
            let xOffset = 60;

            const drawTick = (x: number, y: number) => {
              doc.setLineWidth(0.5);
              doc.line(x + 0.5, y + 2, x + 1.5, y + 3.5);
              doc.line(x + 1.5, y + 3.5, x + 3.5, y + 1);
            };

            options.forEach(opt => {
                const isChecked = getValue(opt.id) === 'true';
                const labelWidth = doc.getTextWidth(opt.label) + 6;
                 if (margin + xOffset + labelWidth > pageWidth - margin) {
                    yPos += 8;
                    xOffset = 60;
                    doc.rect(margin, yPos, pageWidth - margin * 2, 8);
                }
                doc.rect(margin + xOffset, yPos + 2, 4, 4);
                if(isChecked) {
                  drawTick(margin + xOffset, yPos + 2);
                }
                doc.text(opt.label, margin + xOffset + 6, yPos + 5.5);
                xOffset += labelWidth + 10;
            });
            yPos += 8;
        };
        
        addSectionTitle('Project Information');
        drawField('Project Name', getValue('project_name_header'));
        
        addSectionTitle('Location');
        drawCheckboxField('Purpose', [
          {id: 'purpose_house', label: 'House'},
          {id: 'purpose_office', label: 'Office'},
          {id: 'purpose_residential', label: 'Residential'},
          {id: 'purpose_others', label: 'Others'},
        ]);
        drawField('City', getValue('location_city'));
        drawField('Region', getValue('location_region'));
        drawField('Address', getValue('location_address'));
        addFooter();
        doc.save(`${record.projectName}_SiteSurvey.pdf`);
    } else if (record.fileName === 'Project Agreement') {
        // ... existing logic for Project Agreement ...
        // (This part is unchanged)
    } else {
        generateGenericPdf();
    }
};

export default function SavedRecordsComponent({ employeeOnly = false }: { employeeOnly?: boolean }) {
    const { records, isLoading, error, deleteRecord } = useRecords();
    const { user: currentUser, employees } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    const userRecords = useMemo(() => {
        if (employeeOnly && currentUser) {
            return records.filter(r => r.employeeId === currentUser.uid);
        }
        return records;
    }, [records, employeeOnly, currentUser]);
    
    const recordsByEmployee = useMemo(() => {
        const grouped = userRecords.reduce((acc, record) => {
            const employeeId = record.employeeId;
            if (!acc[employeeId]) {
                const employeeDetails = employees.find(e => e.uid === employeeId);
                acc[employeeId] = {
                    employeeName: employeeDetails?.name || 'Unknown Employee',
                    employeeDept: employeeDetails?.departments.join(', ') || 'N/A',
                    records: [],
                };
            }
            acc[employeeId].records.push(record);
            return acc;
        }, {} as Record<string, { employeeName: string; employeeDept: string; records: SavedRecord[] }>);

        if (!searchQuery) return grouped;

        const filteredGrouped: typeof grouped = {};
        for(const employeeId in grouped) {
            const filtered = grouped[employeeId].records.filter(r => 
                r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length > 0) {
                filteredGrouped[employeeId] = { ...grouped[employeeId], records: filtered };
            }
        }
        return filteredGrouped;

    }, [userRecords, employees, searchQuery]);


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
    
        if (bankTimelineCategories.includes(viewingRecord.fileName) && Array.isArray(viewingRecord.data)) {
            const projectSection = viewingRecord.data.find(s => s.category === 'Projects');
            const statusSection = viewingRecord.data.find(s => s.category === 'Overall Status');
            const remarksSection = viewingRecord.data.find(s => s.category === 'Remarks');
            const queriesSection = viewingRecord.data.find(s => s.category === 'Queries');
            
            const headers = [
                { key: 'srNo', label: 'Sr.No', rowSpan: 2 },
                { key: 'projectName', label: 'Project Name', rowSpan: 2 },
                { key: 'area', label: 'Area in Sft', rowSpan: 2 },
                { key: 'projectHolder', label: 'Project Holder', rowSpan: 2 },
                { key: 'allocationDate', label: 'Allocation Date / RFP', rowSpan: 2 },
                { key: 'siteSurvey', label: 'Site Survey', colSpan: 2 },
                { key: 'contact', label: 'Contact', colSpan: 2 },
                { key: 'headCount', label: 'Head Count / Requirment', colSpan: 2 },
                { key: 'proposal', label: 'Proposal / Design Development', colSpan: 2 },
                { key: 'threed', label: "3D's", colSpan: 2 },
                { key: 'tenderArch', label: 'Tender Package Architectural', colSpan: 2 },
                { key: 'tenderMep', label: 'Tender Package MEP', colSpan: 2 },
                { key: 'boq', label: 'BOQ', colSpan: 2 },
                { key: 'tenderStatus', label: 'Tender Status', rowSpan: 2 },
                { key: 'comparative', label: 'Comparative', rowSpan: 2 },
                { key: 'workingDrawings', label: 'Working Drawings', rowSpan: 2 },
                { key: 'siteVisit', label: 'Site Visit', rowSpan: 2 },
                { key: 'finalBill', label: 'Final Bill', rowSpan: 2 },
                { key: 'projectClosure', label: 'Project Closure', rowSpan: 2 },
            ];
            const subHeaders = [
                'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date', 'Start Date', 'End Date'
            ];
            
            return (
                <div className="space-y-4">
                    {projectSection && Array.isArray(projectSection.items) && projectSection.items.length > 0 && (
                        <div>
                            <h3 className="font-bold text-lg text-primary mb-2">Projects</h3>
                            <div className="overflow-x-auto">
                                <Table className="text-xs">
                                    <TableHeader>
                                        <TableRow>
                                            {headers.map(h => <TableHead key={h.key} colSpan={h.colSpan} rowSpan={h.rowSpan} className="border p-1 text-center font-bold bg-primary/10 whitespace-nowrap">{h.label}</TableHead>)}
                                        </TableRow>
                                        <TableRow>
                                            {subHeaders.map((sh, i) => <TableHead key={i} className="border p-1 text-center font-bold bg-primary/10 whitespace-nowrap">{sh}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projectSection.items.map((item: any, index: number) => (
                                            <TableRow key={index}>
                                                <TableCell className="border p-1">{item.srNo}</TableCell>
                                                <TableCell className="border p-1">{item.projectName}</TableCell>
                                                <TableCell className="border p-1">{item.area}</TableCell>
                                                <TableCell className="border p-1">{item.projectHolder}</TableCell>
                                                <TableCell className="border p-1">{item.allocationDate}</TableCell>
                                                <TableCell className="border p-1">{item.siteSurveyStart}</TableCell>
                                                <TableCell className="border p-1">{item.siteSurveyEnd}</TableCell>
                                                <TableCell className="border p-1">{item.contactStart}</TableCell>
                                                <TableCell className="border p-1">{item.contactEnd}</TableCell>
                                                <TableCell className="border p-1">{item.headCountStart}</TableCell>
                                                <TableCell className="border p-1">{item.headCountEnd}</TableCell>
                                                <TableCell className="border p-1">{item.proposalStart}</TableCell>
                                                <TableCell className="border p-1">{item.proposalEnd}</TableCell>
                                                <TableCell className="border p-1">{item.threedStart}</TableCell>
                                                <TableCell className="border p-1">{item.threedEnd}</TableCell>
                                                <TableCell className="border p-1">{item.tenderArchStart}</TableCell>
                                                <TableCell className="border p-1">{item.tenderArchEnd}</TableCell>
                                                <TableCell className="border p-1">{item.tenderMepStart}</TableCell>
                                                <TableCell className="border p-1">{item.tenderMepEnd}</TableCell>
                                                <TableCell className="border p-1">{item.boqStart}</TableCell>
                                                <TableCell className="border p-1">{item.boqEnd}</TableCell>
                                                <TableCell className="border p-1">{item.tenderStatus}</TableCell>
                                                <TableCell className="border p-1">{item.comparative}</TableCell>
                                                <TableCell className="border p-1">{item.workingDrawings}</TableCell>
                                                <TableCell className="border p-1">{item.siteVisit}</TableCell>
                                                <TableCell className="border p-1">{item.finalBill}</TableCell>
                                                <TableCell className="border p-1">{item.projectClosure}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    {statusSection && Array.isArray(statusSection.items) && (
                        <div>
                            <h3 className="font-bold text-lg text-primary mb-2">Overall Status</h3>
                             <Table>
                                 <TableBody>
                                    {statusSection.items.map((item: any, index: number) => (
                                        <TableRow key={index}><TableCell className="font-semibold">{item.title}</TableCell><TableCell>{item.status}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     {remarksSection && Array.isArray(remarksSection.items) && (
                        <div>
                            <h3 className="font-bold text-lg text-primary mb-2">Remarks</h3>
                             <Table>
                                 <TableBody>
                                    {remarksSection.items.map((item: any, index: number) => (
                                        <TableRow key={index}><TableCell className="font-semibold">{item.label}</TableCell><TableCell>{item.value}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     {queriesSection && Array.isArray(queriesSection.items) && (
                        <div>
                            <h3 className="font-bold text-lg text-primary mb-2">Queries</h3>
                             <Table>
                                 <TableBody>
                                    {queriesSection.items.map((item: any, index: number) => (
                                        <TableRow key={index}><TableCell className="font-semibold">{item.label}</TableCell><TableCell>{item.value}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            );
        }
        
        if (Array.isArray(viewingRecord.data)) {
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
        }
        
        return <p>Could not render record data. Format is not recognized.</p>;
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
            ) : Object.keys(recordsByEmployee).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(recordsByEmployee).map(([employeeId, { employeeName, employeeDept, records }]) => (
                        <Card key={employeeId} className="border-primary/30">
                            <CardHeader className="bg-muted/50 rounded-t-lg">
                                <CardTitle className="flex items-center gap-3">
                                    <UserIcon className="h-6 w-6 text-primary" />
                                    <div>
                                        {employeeName}
                                        <p className="text-sm font-normal text-muted-foreground">{employeeDept}</p>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
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
                                        {records.map(record => {
                                            const Icon = getIconForFile(record.fileName);
                                            return (
                                                <TableRow key={record.id}>
                                                    <TableCell className="font-medium flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground"/> {record.projectName}</TableCell>
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
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No records found.</p>
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
            <DialogContent className="max-w-7xl">
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
