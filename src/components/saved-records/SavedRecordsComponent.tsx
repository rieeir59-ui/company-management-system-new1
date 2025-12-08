
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { Loader2, Search, Trash2, Edit, Download, Eye, Landmark, Building2, Home as HomeIcon, ClipboardCheck } from 'lucide-react';
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
import { getIconForCategory } from '@/lib/icons';
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

const managementCategories = [
    "Architect's Supplemental Instructions", "Bill of Quantity", "Change Order",
    "Consent of Surety (Retainage)", "Consent of Surety (Final Payment)", "Construction Change Directive",
    "Construction Activity Schedule", "Continuation Sheet", "Drawings List", "Instruction Sheet",
    "List of Contractors", "List of Sub-Consultants", "Preliminary Project Budget", "Project Agreement",
    "Project Application Summary", "Project Checklist", "Project Data", "Proposal Request",
    "Rate Analysis", "Shop Drawing and Sample Record", "Timeline Schedule",
    "My Projects", "Site Visit Proforma", "Site Survey Report", "Uploaded File"
];

const bankNameToCategory = (bankName: string) => `${bankName} Timeline`;

const initialBanks = ["MCB", "DIB", "FBL", "UBL", "HBL", "Askari Bank", "Bank Alfalah", "Bank Al Habib", "CBD"];

const generateDefaultPdf = (record: SavedRecord) => {
    const isBankTimeline = bankTimelineCategories.includes(record.fileName);
    const doc = new jsPDF({ orientation: isBankTimeline ? 'landscape' : 'portrait' });
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    let yPos = 20;
    const primaryColor = [45, 95, 51];
    const margin = 14;

    // Header
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


    const addSection = (title: string, items: any) => {
        if (!items || (Array.isArray(items) && items.length === 0)) return;
        
        if (yPos > (isBankTimeline ? pageHeight - 60 : pageHeight - 40)) { doc.addPage(); yPos = 20; }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(title, 14, yPos);
        yPos += 8;
        doc.setTextColor(0,0,0);

        let body: (string | number)[][] = [];

        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                if (typeof item === 'string') {
                    try {
                        // Handle JSON strings in items (like from Bill of Quantity)
                        const parsed = JSON.parse(item);
                        if(typeof parsed === 'object' && parsed !== null) {
                             Object.entries(parsed).forEach(([key, val]) => {
                                if (key !== 'id' && key !== 'isHeader') {
                                    body.push([key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), String(val)]);
                                }
                            });
                             body.push(['---', '---']); // Separator
                        }
                    } catch (e) {
                        const parts = item.split(/:(.*)/s);
                        if (parts.length > 1) {
                            body.push([parts[0], parts[1].trim()]);
                        } else {
                            body.push([item, '']);
                        }
                    }
                } else if (item && typeof item === 'object') {
                    if (item.label && item.value !== undefined) { // For {label, value} objects
                        body.push([item.label, item.value]);
                    } else if (item.Item && item.Status !== undefined) {
                         body.push([item.Item, `${item.Status} ${item.Remarks ? `(${item.Remarks})` : ''}`]);
                    } else {
                       body.push([JSON.stringify(item, null, 2), '']);
                    }
                }
            });
        } else if (typeof items === 'object' && items !== null) { // For objects like 'header'
             Object.entries(items).forEach(([key, val]) => {
                body.push([key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), String(val)]);
            });
        }
        
        if (body.length > 0) {
            (doc as any).autoTable({
                startY: yPos,
                body: body,
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
                columnStyles: { 0: { fontStyle: 'bold' } }
            });
            yPos = (doc as any).autoTable.previous.finalY + 10;
        }
    };
    
    if (isBankTimeline && Array.isArray(record.data)) {
        record.data.forEach((section: any) => {
             if (section.category === 'Projects' && Array.isArray(section.items) && section.items.length > 0) {
                if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(section.category, 14, yPos);
                yPos += 8;

                const head = Object.keys(section.items[0] || {}).filter(k => k !== 'id');
                const body = section.items.map((item: any) => Object.keys(item).filter(k => k !== 'id').map(key => item[key]));
                
                (doc as any).autoTable({
                    startY: yPos,
                    head: [head],
                    body: body,
                    theme: 'grid',
                    styles: { fontSize: 4, cellPadding: 1, overflow: 'linebreak' },
                    headStyles: { fontStyle: 'bold', fillColor: primaryColor, textColor: [255,255,255] },
                });
                yPos = (doc as any).autoTable.previous.finalY + 10;
             } else if (section.category === 'Overall Status' && Array.isArray(section.items)) {
                addSection(section.category, section.items.map((item:any) => ({label: item.title, value: item.status})));
             } else {
                addSection(section.category, section.items);
             }
        });

    } else if (Array.isArray(record.data)) {
        record.data.forEach((section: any) => {
            if (typeof section === 'object' && section !== null && section.category) {
                 addSection(section.category, section.items);
            }
        });
    } else if (typeof record.data === 'object' && record.data !== null) { // For flat object data
        addSection("Details", Object.entries(record.data).map(([key, value]) => ({label: key, value: String(value)})));
    }


    // Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`${record.projectName}_${record.fileName}.pdf`);
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

    const filteredRecords = useMemo(() => {
        let recordsToFilter = userRecords;
    
        if (activeCategory) {
            if (activeCategory === 'Banks') {
                recordsToFilter = recordsToFilter.filter(r => bankTimelineCategories.includes(r.fileName));
                if (selectedBank) {
                    const categoryName = bankNameToCategory(selectedBank);
                    recordsToFilter = recordsToFilter.filter(r => r.fileName === categoryName);
                }
            } else if (activeCategory === 'Management Records') {
                 recordsToFilter = recordsToFilter.filter(r => managementCategories.includes(r.fileName));
                 if (selectedMgmtRecordType) {
                    recordsToFilter = recordsToFilter.filter(r => r.fileName === selectedMgmtRecordType);
                 }
            } else if (activeCategory === 'Assigned Tasks') {
                recordsToFilter = recordsToFilter.filter(r => r.fileName === 'Task Assignment');
            }
        }
    
        if (!searchQuery) return recordsToFilter;
    
        return recordsToFilter.filter(record =>
            record.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.fileName.toLowerCase().includes(searchQuery.toLowerCase())
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
        const isAdmin = ['admin', 'software-engineer', 'ceo'].includes(currentUser.department);
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
        
        return (
            <div className="space-y-4">
                {projectSection && Array.isArray(projectSection.items) && (
                    <div>
                        <h3 className="font-bold text-lg text-primary mb-2">Projects</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {Object.keys(projectSection.items[0] || {}).filter(key => key !== 'id').map(key => <TableHead key={key}>{key}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectSection.items.map((item: any, index: number) => (
                                        <TableRow key={index}>
                                            {Object.keys(item).filter(key => key !== 'id').map(key => <TableCell key={key}>{item[key]}</TableCell>)}
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
    

    if (viewingRecord.fileName === 'My Projects' && viewingRecord.data && viewingRecord.data[0]) {
        const scheduleData = viewingRecord.data[0];
        const projects = scheduleData.items?.filter((item: any) => item.label.startsWith('Project:')) || [];
        return (
            <Table>
                <TableBody>
                    <TableRow><TableCell className="font-semibold">Work Schedule</TableCell><TableCell>{scheduleData.schedule.start || 'N/A'} to {scheduleData.schedule.end || 'N/A'}</TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold">Remarks</TableCell><TableCell>{scheduleData.remarks || 'N/A'}</TableCell></TableRow>
                    {projects.length > 0 && (
                        <TableRow><TableCell className="font-bold text-primary" colSpan={2}>Projects</TableCell></TableRow>
                    )}
                    {projects.map((p: any, i:number) => {
                        const details = p.value.split(', ').reduce((acc: any, part: string) => {
                            const [key, ...val] = part.split(': ');
                            acc[key.trim()] = val.join(': ');
                            return acc;
                        }, {});
                        return (
                            <React.Fragment key={i}>
                                <TableRow><TableCell className="pl-8 font-semibold" colSpan={2}>{p.label.replace('Project: ', '')}</TableCell></TableRow>
                                <TableRow><TableCell className="pl-12">Detail</TableCell><TableCell>{details.Detail}</TableCell></TableRow>
                                <TableRow><TableCell className="pl-12">Status</TableCell><TableCell>{details.Status}</TableCell></TableRow>
                                <TableRow><TableCell className="pl-12">Dates</TableCell><TableCell>{details.Start} to {details.End}</TableCell></TableRow>
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
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
                                    try {
                                        const parsed = JSON.parse(item);
                                        if(typeof parsed === 'object' && parsed !== null) {
                                             return Object.entries(parsed).map(([key, val]) => {
                                                if (key !== 'id' && key !== 'isHeader') {
                                                    return <TableRow key={key}><TableCell className="font-medium pl-8">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</TableCell><TableCell>{String(val)}</TableCell></TableRow>
                                                }
                                                return null;
                                            });
                                        }
                                    } catch (e) {
                                        const parts = item.split(/:(.*)/s);
                                        if (parts.length > 1) {
                                            return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8">{parts[0]}</TableCell><TableCell>{parts[1]?.trim()}</TableCell></TableRow>;
                                        } else {
                                            return <TableRow key={`${index}-${i}`}><TableCell colSpan={2} className="pl-8">{item}</TableCell></TableRow>;
                                        }
                                    }
                                } else if (item && typeof item === 'object') {
                                    if (item.label && item.value !== undefined) { 
                                        return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8">{item.label}</TableCell><TableCell>{item.value}</TableCell></TableRow>;
                                    } else if (item.Item && item.Status !== undefined) {
                                         return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8">{item.Item}</TableCell><TableCell>{item.Status} {item.Remarks ? `(${item.Remarks})` : ''}</TableCell></TableRow>
                                    } else {
                                       return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8" colSpan={2}>{JSON.stringify(item)}</TableCell></TableRow>;
                                    }
                                }
                                return null;
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
                    {managementCategories.map(cat => {
                        const Icon = getIconForCategory(cat);
                        return (
                             <SectionCard 
                                key={cat} 
                                title={cat} 
                                icon={Icon}
                                onClick={() => handleMgmtRecordTypeSelect(cat)}
                            />
                        )
                    })}
                </div>
            );
        }
        
        return (
             <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{selectedBank || selectedMgmtRecordType || activeCategory}</CardTitle>
                         {selectedBank && <Button onClick={handleBackToBanks} variant="outline">Back to Banks</Button>}
                         {selectedMgmtRecordType && <Button onClick={handleBackToMgmtCategories} variant="outline">Back to Management Categories</Button>}
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
                                     const Icon = getIconForCategory(record.fileName);
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
                        Back to Categories
                    </Button>
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search in ${activeCategory}...`}
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
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{viewingRecord?.fileName}: {viewingRecord?.projectName}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-4">
                    {renderRecordContent()}
                </div>
                <DialogFooter>
                    <Button onClick={() => viewingRecord && generateDefaultPdf(viewingRecord)}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
      </Dialog>
    </div>
  );
}
