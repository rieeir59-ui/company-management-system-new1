'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { Loader2, Search, Trash2, Edit, Download, Eye, Landmark, Building2, Home as HomeIcon } from 'lucide-react';
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
    "Askari Bank Timeline", "Bank Alfalah Timeline", "Bank Al Habib Timeline", "CBD Timeline", "DIB Timeline", "FBL Timeline", "HBL Timeline", "MCB Timeline", "UBL Timeline"
];

const managementCategories = [
    "Architect's Supplemental Instructions", "Bill of Quantity", "Change Order",
    "Consent of Surety (Retainage)", "Consent of Surety (Final Payment)", "Construction Change Directive",
    "Construction Activity Schedule", "Continuation Sheet", "Drawings List", "Instruction Sheet",
    "List of Contractors", "List of Sub-Consultants", "Preliminary Project Budget", "Project Agreement",
    "Project Application Summary", "Project Checklist", "Project Data", "Proposal Request",
    "Rate Analysis", "Shop Drawing and Sample Record", "Timeline Schedule",
    "My Projects", "Task Assignment", "Site Visit Proforma", "Site Survey Report", "Uploaded File"
];

const bankNameToCategory = (bankName: string) => `${bankName} Timeline`;

const initialBanks = ["MCB", "DIB", "FAYSAL", "UBL", "HBL", "Askari Bank", "Bank Alfalah", "Bank Al Habib", "CBD"];

const generateDefaultPdf = (record: SavedRecord) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(record.fileName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(12);
    doc.text(record.projectName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(10);
    doc.text(`Record ID: ${record.id}`, 14, yPos);
    doc.text(`Date: ${record.createdAt.toLocaleDateString()}`, pageWidth - 14, yPos, { align: 'right' });
    yPos += 10;
    
    if (record.fileName === 'Site Visit Proforma' && Array.isArray(record.data)) {
        record.data.forEach(section => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(section.category, 14, yPos);
            yPos += 8;

            if (section.category === 'Pictures') {
                doc.setFont('helvetica', 'normal');
                section.items.forEach((item: { comment: string; url: string; }) => {
                    doc.text(`- ${item.comment || 'No comment'}`, 18, yPos);
                    yPos += 5;
                });
            } else if (Array.isArray(section.items)) {
                const body = section.items.map((item: { Item: string; Status: string; Remarks: string; label?: string; value?: string; }) => {
                    if (item.Item) {
                        return [item.Item, item.Status, item.Remarks || 'N/A'];
                    } else if (item.label) {
                        return [item.label, item.value];
                    }
                    return null;
                }).filter(Boolean);

                if (body.length > 0) {
                    const head = body[0].length === 3 ? [['Item', 'Status', 'Remarks']] : [['Field', 'Value']];
                    (doc as any).autoTable({
                        startY: yPos,
                        head: head,
                        body: body,
                        theme: 'grid',
                    });
                    yPos = (doc as any).autoTable.previous.finalY + 10;
                }
            }
        });
    } else if (bankTimelineCategories.includes(record.fileName) && record.data) {
        record.data.forEach((section: any) => {
            if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(section.category, 14, yPos);
            yPos += 8;
            
            if (section.category === 'Projects' && Array.isArray(section.items)) {
                (doc as any).autoTable({
                    startY: yPos,
                    head: [Object.keys(section.items[0] || {})],
                    body: section.items.map(item => Object.values(item)),
                    theme: 'grid',
                    styles: { fontSize: 5, cellPadding: 1, overflow: 'linebreak' },
                    headStyles: { fillColor: [45, 95, 51] },
                });
                yPos = (doc as any).autoTable.previous.finalY + 10;
            } else if (Array.isArray(section.items)) {
                section.items.forEach((item: any) => {
                    if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
                    let text = '';
                    if (typeof item === 'string') text = item;
                    else if (item.label) text = `${item.label}: ${item.value}`;
                    else if (item.title) text = `${item.title}: ${item.status}`;
                    doc.text(text, 18, yPos, { maxWidth: pageWidth - 36 });
                    yPos += (doc as any).getTextDimensions(text, { maxWidth: pageWidth - 36 }).h + 5;
                });
            }
        });

    } else if (Array.isArray(record.data)) {
        record.data.forEach(section => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(section.category, 14, yPos);
            yPos += 8;
            
            if (Array.isArray(section.items)) {
                const body = section.items.map((item: any) => {
                    if(typeof item === 'string') {
                        const parts = item.split(':');
                        return [parts[0], parts.slice(1).join(':').trim()];
                    }
                    if(item.label) {
                        return [item.label, item.value];
                    }
                    if(item.Item){
                         return [item.Item, item.Status, item.Remarks];
                    }
                    try {
                        const parsed = JSON.parse(item);
                        return Object.values(parsed);
                    } catch {
                        return [item];
                    }
                });
                 (doc as any).autoTable({
                    startY: yPos,
                    body: body,
                    theme: 'grid',
                });
                yPos = (doc as any).autoTable.previous.finalY + 10;
            }
        });
    }

    // Footer
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
            } else if (activeCategory === 'Management Records') {
                 recordsToFilter = recordsToFilter.filter(r => managementCategories.includes(r.fileName));
            }
        }

        if (!searchQuery) return recordsToFilter;

        return recordsToFilter.filter(record =>
            record.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );

    }, [userRecords, activeCategory, searchQuery]);
    
    const bankProjects = useMemo(() => {
        return initialBanks.map(bank => {
            const categoryName = bankNameToCategory(bank);
            return {
                name: bank,
                records: filteredRecords.filter(r => r.fileName === categoryName)
            };
        });
    }, [filteredRecords]);


    const managementProjects = useMemo(() => {
        return managementCategories.map(category => ({
            name: category,
            records: filteredRecords.filter(r => r.fileName === category)
        }));
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
        const isAdmin = ['admin', 'software-engineer', 'ceo'].includes(currentUser.department);
        return isAdmin || currentUser.uid === record.employeeId;
    };
    
    const renderRecordContent = () => {
        if (!viewingRecord) return null;
    
        if (viewingRecord.fileName === 'My Projects' && viewingRecord.data && viewingRecord.data[0]) {
            const scheduleData = viewingRecord.data[0];
            const projects = scheduleData.items?.filter((item: any) => item.label.startsWith('Project:')) || [];
            return (
                <Table>
                    <TableBody>
                        <TableRow><TableCell className="font-semibold">Work Schedule</TableCell><TableCell>{scheduleData.schedule.start || 'N/A'} to {scheduleData.schedule.end || 'N/A'}</TableCell></TableRow>
                        <TableRow><TableCell className="font-semibold">Remarks</TableCell><TableCell>{scheduleData.remarks || 'N/A'}</TableCell></TableRow>
                        <TableRow><TableCell className="font-semibold" colSpan={2}>Projects</TableCell></TableRow>
                        {projects.map((p: any, i:number) => {
                            const details = p.value.split(', ').reduce((acc: any, part: string) => {
                                const [key, ...val] = part.split(': ');
                                acc[key.trim()] = val.join(': ');
                                return acc;
                            }, {});
                            return <TableRow key={i}><TableCell colSpan={2} className="pl-8">{p.label.replace('Project: ', '')}: {details.Detail}</TableCell></TableRow>
                        })}
                    </TableBody>
                </Table>
            );
        }
    
        if (bankTimelineCategories.includes(viewingRecord.fileName) && viewingRecord.data) {
            return (
                <div className="space-y-4">
                  {viewingRecord.data.map((section: any, index: number) => (
                    <div key={index}>
                      <h4 className="font-bold">{section.category}</h4>
                      {Array.isArray(section.items) ? (
                        <Table>
                            {section.category === 'Projects' && (
                                <TableHeader>
                                <TableRow>{Object.keys(section.items[0] || {}).map(key => <TableHead key={key}>{key}</TableHead>)}</TableRow>
                                </TableHeader>
                            )}
                          <TableBody>
                            {section.items.map((item: any, i: number) => (
                              <TableRow key={i}>{Object.values(item).map((val: any, j: number) => <TableCell key={j}>{val}</TableCell>)}</TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : <p>No items in this section.</p>}
                    </div>
                  ))}
                </div>
            )
        }

        if (Array.isArray(viewingRecord.data)) {
            return (
                <Table>
                    <TableBody>
                        {viewingRecord.data.map((section: any, index: number) => (
                            <React.Fragment key={index}>
                                <TableRow className="bg-muted">
                                    <TableCell colSpan={3} className="font-bold text-primary">{section.category}</TableCell>
                                </TableRow>
                                {Array.isArray(section.items) ? section.items.map((item: any, i: number) => {
                                    if(typeof item === 'string') {
                                        try {
                                            const parsed = JSON.parse(item);
                                            return <TableRow key={`${index}-${i}`}>{Object.entries(parsed).map(([key, val]) => <TableCell key={key}>{String(val)}</TableCell>)}</TableRow>
                                        } catch (e) {
                                            const parts = item.split(':');
                                            return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8">{parts[0]}</TableCell><TableCell colSpan={2}>{parts.slice(1).join(':').trim()}</TableCell></TableRow>;
                                        }
                                    } else if (item.Item) {
                                         return (
                                            <TableRow key={`${index}-${i}`}>
                                                <TableCell className="font-medium pl-8">{item.Item}</TableCell>
                                                <TableCell>{item.Status}</TableCell>
                                                <TableCell>{item.Remarks}</TableCell>
                                            </TableRow>
                                         )
                                    } else if (item.label) {
                                        return <TableRow key={`${index}-${i}`}><TableCell className="font-medium pl-8">{item.label}</TableCell><TableCell colSpan={2}>{item.value}</TableCell></TableRow>;
                                    }
                                    return null;
                                }) : <TableRow><TableCell colSpan={3}>{String(section.items)}</TableCell></TableRow>}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            );
        }

        // Fallback for non-array, non-special-cased data
        if (typeof viewingRecord.data === 'object' && viewingRecord.data !== null) {
             const header = viewingRecord.data.header || {};
             const items = viewingRecord.data.items || [];
             const category = viewingRecord.data.category || 'Details';
             return (
                <div>
                    <h3 className="font-bold text-lg mb-2">{category}</h3>
                    <div className="space-y-1 mb-4 p-2 border rounded">
                        {Object.entries(header).map(([key, value]) => (
                            <p key={key}><span className="font-semibold">{key}:</span> {String(value)}</p>
                        ))}
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>{Object.keys(items[0] || {}).map(key => <TableHead key={key}>{key}</TableHead>)}</TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item: any, i: number) => <TableRow key={i}>{Object.values(item).map((val: any, j: number) => <TableCell key={j}>{String(val)}</TableCell>)}</TableRow>)}
                        </TableBody>
                     </Table>
                </div>
             )
        }

        return <p>Could not render record data.</p>;
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
            {activeCategory === null ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SectionCard title="Bank Timelines" icon={Landmark} onClick={() => setActiveCategory('Banks')} />
                    <SectionCard title="Management Records" icon={Building2} onClick={() => setActiveCategory('Management Records')} />
                </div>
            ) : (
                <div>
                    <Button onClick={() => setActiveCategory(null)} variant="outline" className="mb-4">
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
                    {isLoading ? (
                      <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : error ? (
                      <div className="text-destructive text-center">{error}</div>
                    ) : (
                      <div className="space-y-6">
                        {(activeCategory === 'Banks' ? bankProjects : managementProjects)
                            .filter(group => group.records.length > 0)
                            .map(group => (
                            <Card key={group.name}>
                                <CardHeader><CardTitle>{group.name}</CardTitle></CardHeader>
                                <CardContent>
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
                                            {group.records.map(record => {
                                                const Icon = getIconForCategory(record.fileName);
                                                return (
                                                    <TableRow key={record.id}>
                                                        <TableCell className="font-medium">{record.projectName}</TableCell>
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
                                </CardContent>
                            </Card>
                        ))}
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
