
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { Loader2, Search, Trash2, Edit, Download, Eye, Landmark, Building2, Home as HomeIcon, ClipboardCheck, ArrowLeft, FolderOpen, Compass } from 'lucide-react';
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
import { getIconForCategory, getIconForFile } from '@/lib/icons';
import { getFormUrlFromFileName } from '@/lib/utils';
import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const bankTimelineCategories = [
    "Askari Bank Timeline", "Bank Alfalah Timeline", "Bank Al Habib Timeline", "CBD Timeline", "DIB Timeline", "FBL Timeline", "HBL Timeline", "MCB Timeline", "UBL Timeline", "Commercial Timeline", "Residential Timeline"
];

const managementRecordTypes = [
    "Architect's Supplemental Instructions", "Bill of Quantity", "Change Order",
    "Consent of Surety (Retainage)", "Consent of Surety (Final Payment)", "Construction Change Directive",
    "Construction Activity Schedule", "Continuation Sheet", "Drawings List", "Instruction Sheet",
    "List of Contractors", "List of Sub-Consultants", "Preliminary Project Budget", "Project Agreement",
    "Project Application Summary", "Project Checklist", "Project Data", "Proposal Request",
    "Rate Analysis", "Shop Drawing and Sample Record", "Timeline Schedule",
    "My Projects", "Site Visit Proforma", "Site Survey Report", "Uploaded File", "Task Assignment",
    "Project Information"
];

const managementCategoriesWithIcons = [
    { name: "Site Survey", icon: Compass },
    { name: "Project Information", icon: FolderOpen },
    { name: "Architect's Supplemental Instructions", icon: getIconForCategory("Architect's Supplemental Instructions")},
    { name: "Bill of Quantity", icon: getIconForCategory("Bill of Quantity")},
    { name: "Change Order", icon: getIconForCategory("Change Order")},
    { name: "Consent of Surety", icon: getIconForCategory("Consent of Surety")},
    { name: "Construction Change Directive", icon: getIconForCategory("Construction Change Directive")},
    { name: "Construction Activity Schedule", icon: getIconForCategory("Construction Activity Schedule")},
    { name: "Continuation Sheet", icon: getIconForCategory("Continuation Sheet")},
    { name: "Drawings List", icon: getIconForCategory("Drawings List")},
    { name: "Instruction Sheet", icon: getIconForCategory("Instruction Sheet")},
    { name: "List of Contractors", icon: getIconForCategory("List of Contractors")},
    { name: "List of Sub-Consultants", icon: getIconForCategory("List of Sub-Consultants")},
    { name: "Preliminary Project Budget", icon: getIconForCategory("Preliminary Project Budget")},
    { name: "Project Agreement", icon: getIconForCategory("Project Agreement")},
    { name: "Project Application Summary", icon: getIconForCategory("Project Application Summary")},
    { name: "Project Checklist", icon: getIconForCategory("Project Checklist")},
    { name: "Project Data", icon: getIconForCategory("Project Data")},
    { name: "Proposal Request", icon: getIconForCategory("Proposal Request")},
    { name: "Rate Analysis", icon: getIconForCategory("Rate Analysis")},
    { name: "Shop Drawing and Sample Record", icon: getIconForCategory("Shop Drawing and Sample Record")},
    { name: "Timeline Schedule", icon: getIconForCategory("Timeline Schedule")},
    { name: "My Projects", icon: getIconForCategory("My Projects")},
    { name: "Site Visit Proforma", icon: getIconForCategory("Site Visit Proforma")},
    { name: "Uploaded File", icon: getIconForCategory("Uploaded File")},
    { name: "Task Assignment", icon: getIconForCategory("Task Assignment")},
]


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
        const details = record.data.find((d: any) => d.category === 'Agreement Details')?.items || [];
        addText(`Made as of the day ${details.find((d:any)=>d.label.includes('day'))?.value || '________________'}`);
        addText(`Between the Owner: ${details.find((d:any)=>d.label.includes('Owner'))?.value || '________________'}`);
        addText(`For the Design of: ${details.find((d:any)=>d.label.includes('Design'))?.value || '________________'}`);
        addText(`Address: ${details.find((d:any)=>d.label.includes('Address'))?.value || '________________'}`);
        
        const costBody = record.data.find((d: any) => d.category === 'Cost Breakdown')?.items.map((item: any) => [item.label, item.value]) || [];
        (doc as any).autoTable({ startY: yPos, theme: 'plain', styles: { fontSize: 10 }, body: costBody });
        yPos = (doc as any).autoTable.previous.finalY + 10;
        
        addText('PAYMENT SCHEDULE:', true, 0, 12, 8);
        const paymentBody = record.data.find((d: any) => d.category === 'Payment Schedule')?.items.map((item: any) => [item.label, item.value]) || [];
        (doc as any).autoTable({ startY: yPos, body: paymentBody, theme: 'plain', styles: { fontSize: 10, cellPadding: 1 } });
        yPos = (doc as any).autoTable.previous.finalY + 10;
        
        addText('Project Management', true, 0, 12, 8);
        addText('Top Supervision:', true, 2, 10, 5);
        addList(record.data.find((d: any) => d.category === 'Top Supervision')?.items || []);

        addText('Detailed Supervision:', true, 2, 10, 5);
        addText(record.data.find((d: any) => d.category === 'Detailed Supervision')?.items[0]?.value || '', false, 5);

        addText('Please Note:', true, 0, 12, 8);
        addList(record.data.find((d: any) => d.category === 'Notes')?.items || []);
        addText(record.data.find((d: any) => d.category === 'Extra Services Note')?.items[0]?.value || '', true, 2);

        doc.addPage(); yPos = 20;

        addText("Architect's Responsibilities", true, 0, 12, 8);
        addList(record.data.find((d: any) => d.category === "Architect's Responsibilities")?.items || []);

        addText("The Architect will not be responsible for the following things:", true, 0, 12, 8);
        addList(record.data.find((d: any) => d.category === 'Not Responsible For')?.items || []);

        addText("ARTICLE-1: Termination of the Agreement", true, 0, 12, 8);
        addList(record.data.find((d: any) => d.category === 'Termination')?.items || []);

        doc.addPage(); yPos = 20;

        addText("ARTICLE-2: Bases of Compensation", true, 0, 12, 8);
        addList(record.data.find((d: any) => d.category === 'Compensation')?.items || []);

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

const SectionCard = ({ title, icon: Icon, onClick, className }: { title: string, icon: React.ElementType, onClick: () => void, className?: string }) => (
    <Card
        className={cn("p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent hover:border-primary transition-all", className)}
        onClick={onClick}
    >
        <Icon className="w-12 h-12 text-primary" />
        <p className="font-semibold text-lg text-center">{title}</p>
    </Card>
);

const initialBanks = ["MCB", "DIB", "FBL", "UBL", "HBL", "Askari Bank", "Bank Alfalah", "Bank Al Habib", "CBD", "Commercial", "Residential"];

export default function SavedRecordsComponent({ employeeOnly = false }: { employeeOnly?: boolean }) {
    const { records, isLoading, error, deleteRecord } = useRecords();
    const { user: currentUser } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [selectedMgmtRecordType, setSelectedMgmtRecordType] = useState<string | null>(null);
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

    const bankNameToCategory = (bankName: string) => `${bankName} Timeline`;

    const filteredRecords = useMemo(() => {
        let recordsToFilter = userRecords;
    
        if (activeCategory === 'Banks') {
            recordsToFilter = recordsToFilter.filter(r => bankTimelineCategories.includes(r.fileName));
            if (selectedBank) {
                const categoryName = bankNameToCategory(selectedBank);
                recordsToFilter = recordsToFilter.filter(r => r.fileName === categoryName);
            }
        } else if (activeCategory === 'Management Records') {
            if (selectedMgmtRecordType) {
                 const typesToFilter = selectedMgmtRecordType === "Site Survey" 
                    ? ["Site Survey Report", "Site Visit Proforma"] 
                    : [selectedMgmtRecordType];
                 recordsToFilter = recordsToFilter.filter(r => typesToFilter.includes(r.fileName));
            } else {
                recordsToFilter = recordsToFilter.filter(r => managementRecordTypes.includes(r.fileName));
            }
        } else if (activeCategory === 'Assigned Tasks') {
            recordsToFilter = recordsToFilter.filter(r => r.fileName === 'Task Assignment');
        } else if (activeCategory) {
            recordsToFilter = []; // If category is active but not one of the main ones, show nothing until a sub-cat is picked
        }
    
        if (!searchQuery) return recordsToFilter;
    
        return recordsToFilter.filter(record =>
            (record.projectName && record.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (record.fileName && record.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    
    }, [userRecords, activeCategory, selectedBank, selectedMgmtRecordType, searchQuery]);
    

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
    
    const handleCategorySelect = (category: string) => {
        setActiveCategory(category);
        setSelectedBank(null);
        setSelectedMgmtRecordType(null);
    };
    
    const handleBankSelect = (bank: string) => {
        setSelectedBank(bank);
    };

    const handleMgmtRecordTypeSelect = (recordType: string) => {
        setSelectedMgmtRecordType(recordType);
    };
    
    const handleBackToCategories = () => {
        setActiveCategory(null);
        setSelectedBank(null);
        setSelectedMgmtRecordType(null);
        setSearchQuery('');
    };
    
    const handleBackToBanks = () => {
        setSelectedBank(null);
        setSearchQuery('');
    }
    
    const handleBackToMgmtCategories = () => {
        setSelectedMgmtRecordType(null);
        setSearchQuery('');
    }

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

    if (viewingRecord.fileName === 'Site Survey Report' && Array.isArray(viewingRecord.data)) {
        const data = viewingRecord.data.reduce((acc, section) => {
            acc[section.category] = section.items;
            return acc;
        }, {} as Record<string, any[]>);

        return (
            <div className="space-y-4">
                {Object.entries(data).map(([category, items]) => (
                    <div key={category}>
                        <h3 className="font-bold text-lg text-primary mb-2">{category}</h3>
                        <Table>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-semibold">{item.label}</TableCell>
                                        <TableCell>{item.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ))}
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
    
    const renderContent = () => {
        if (!activeCategory) {
             return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SectionCard title="Banks" icon={Landmark} onClick={() => handleCategorySelect('Banks')} />
                    <SectionCard title="Management Records" icon={Building2} onClick={() => handleCategorySelect('Management Records')} />
                    <SectionCard title="Assigned Tasks" icon={ClipboardCheck} onClick={() => handleCategorySelect('Assigned Tasks')} />
                </div>
            );
        }
        
        if (activeCategory === 'Banks' && !selectedBank) {
            return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {initialBanks.map(bank => (
                        <SectionCard 
                            key={bank} 
                            title={bank} 
                            icon={Landmark}
                            onClick={() => handleBankSelect(bank)}
                        />
                    ))}
                </div>
            );
        }

        if (activeCategory === 'Management Records' && !selectedMgmtRecordType) {
            return (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {managementCategoriesWithIcons.map(cat => (
                         <SectionCard 
                            key={cat.name} 
                            title={cat.name} 
                            icon={cat.icon}
                            onClick={() => handleMgmtRecordTypeSelect(cat.name)}
                        />
                    ))}
                </div>
            );
        }
        
        return (
             <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{selectedBank || selectedMgmtRecordType || activeCategory}</CardTitle>
                         {selectedBank && <Button onClick={handleBackToBanks} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Banks</Button>}
                         {selectedMgmtRecordType && <Button onClick={handleBackToMgmtCategories} variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Management Categories</Button>}
                    </div>
                 </CardHeader>
                 <CardContent>
                    {filteredRecords.length > 0 ? (
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
                                 {filteredRecords.map(record => {
                                     const Icon = getIconForFile(record.fileName);
                                     return (
                                         <TableRow key={record.id}>
                                             <TableCell className="font-medium flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground"/> {record.projectName}</TableCell>
                                             <TableCell>{record.fileName}</TableCell>
                                             {!employeeOnly && <TableCell>{record.employeeName}</TableCell>}
                                             <TableCell>{record.createdAt.toLocaleDateString()}</TableCell>
                                             <TableCell className="text-right">
                                                 <div className="flex gap-1 justify-end">
                                                     <Button variant="ghost" size="icon" onClick={() => openViewDialog(record)}><Eye className="h-4 w-4" /></Button>
                                                     {canEditOrDelete(record) && (
                                                         <>
                                                             <Link href={`${getFormUrlFromFileName(record.fileName, dashboardPrefix)}?id=${record.id}`}><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></Link>
                                                             <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(record)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                         </>
                                                     )}
                                                 </div>
                                             </TableCell>
                                         </TableRow>
                                     )
                                 })}
                             </TableBody>
                         </Table>
                    ) : (
                         <div className="text-center py-10">
                            <p className="text-muted-foreground">
                                {searchQuery 
                                    ? `No records found for "${searchQuery}".`
                                    : `No records found for ${selectedBank || selectedMgmtRecordType || activeCategory}.`
                                }
                            </p>
                        </div>
                    )}
                 </CardContent>
               </Card>
        );
    }

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
            {activeCategory && (
                 <div>
                    <Button onClick={handleBackToCategories} variant="outline" className="mb-4">
                       <ArrowLeft className="mr-2 h-4 w-4"/> Back to Categories
                    </Button>
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search in ${selectedBank || selectedMgmtRecordType || activeCategory}...`}
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}
            
            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : error ? (
                <div className="text-destructive text-center">{error}</div>
            ) : (
                renderContent()
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

    