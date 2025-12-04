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
import { getIconForFile } from '@/lib/icons';
import { getFormUrlFromFileName } from '@/lib/utils';
import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';

const bankTimelineCategories = [
    "Commercial Timeline", "Residential Timeline", "Askari Bank Timeline", "Bank Alfalah Timeline", "Bank Al Habib Timeline", "CBD Timeline", "DIB Timeline", "FBL Timeline", "HBL Timeline", "MCB Timeline", "UBL Timeline"
];

const initialBanks = ["MCB", "DIB", "FAYSAL", "UBL", "HBL", "Askari Bank", "Bank Alfalah", "Bank Al Habib", "CBD"];

const bankNameToCategory = (bankName: string) => {
    return `${bankName} Timeline`;
}

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
                const body = section.items.map((item: string) => {
                    const parts = item.split(':');
                    return [parts[0], parts.slice(1).join(':').trim()];
                });
                (doc as any).autoTable({
                    startY: yPos,
                    head: [['Field', 'Value']],
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

export default function SavedRecordsComponent({ employeeOnly = false }: { employeeOnly?: boolean }) {
    const { records, isLoading, error, deleteRecord } = useRecords();
    const { user: currentUser } = useCurrentUser();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>('All Saved Records');
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    const userRecords = useMemo(() => {
        if (employeeOnly && currentUser) {
            return records.filter(r => r.employeeId === currentUser.record);
        }
        return records;
    }, [records, employeeOnly, currentUser]);

    const categories = useMemo(() => {
        const cats: string[] = ['All Saved Records'];
        const uniqueFileNames = [...new Set(userRecords.map(r => r.fileName))];
        
        if (uniqueFileNames.some(name => bankTimelineCategories.includes(name))) {
            cats.push('Bank Timelines');
        }

        const otherCats = uniqueFileNames.filter(name => !bankTimelineCategories.includes(name));
        return [...cats, ...otherCats];
    }, [userRecords]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [categories, searchQuery]);

    const filteredRecords = useMemo(() => {
        let recordsToFilter = userRecords;

        if (activeCategory && activeCategory !== 'All Saved Records') {
            if (activeCategory === 'Bank Timelines') {
                recordsToFilter = recordsToFilter.filter(r => bankTimelineCategories.includes(r.fileName));
            } else {
                recordsToFilter = recordsToFilter.filter(r => r.fileName === activeCategory);
            }
        }

        if (!searchQuery) return recordsToFilter;

        return recordsToFilter.filter(record =>
            record.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );

    }, [userRecords, activeCategory, searchQuery]);

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
        return isAdmin || currentUser.record === record.employeeId;
    };
    
    const bankProjects = useMemo(() => {
        return initialBanks.map(bank => {
            const categoryName = bankNameToCategory(bank);
            return {
                name: bank,
                records: userRecords.filter(r => r.fileName === categoryName)
            };
        }).filter(b => b.records.length > 0);
    }, [userRecords]);

    const renderRecordContent = () => {
        if (!viewingRecord) return null;
    
        if (viewingRecord.fileName === 'My Projects' && viewingRecord.data && viewingRecord.data[0]) {
            const scheduleData = viewingRecord.data[0];
            const projects = scheduleData.items.filter((item: any) => item.label.startsWith('Project:'));
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
    
        if (bankTimelineCategories.includes(viewingRecord.fileName)) {
            const projects = viewingRecord.data?.find(d => d.category === 'Projects')?.items || [];
            const statuses = viewingRecord.data?.find(d => d.category === 'Overall Status')?.items || [];
            const remarks = viewingRecord.data?.find(d => d.category === 'Remarks')?.items || [];
            
            return (
                <div className="space-y-4">
                    <h4 className="font-bold">Projects</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>{Object.keys(projects[0] || {}).map(key => <TableHead key={key}>{key}</TableHead>)}</TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((p: any, i: number) => <TableRow key={i}>{Object.values(p).map((val: any, j: number) => <TableCell key={j}>{val}</TableCell>)}</TableRow>)}
                        </TableBody>
                    </Table>
                     <h4 className="font-bold mt-4">Overall Status</h4>
                    <Table>
                        <TableBody>
                            {statuses.map((s: any, i: number) => <TableRow key={i}><TableCell>{s.title}</TableCell><TableCell>{s.status}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                     <h4 className="font-bold mt-4">Remarks</h4>
                    <Table>
                        <TableBody>
                            {remarks.map((r: any, i: number) => <TableRow key={i}><TableCell>{r.label}</TableCell><TableCell>{r.value}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            )
        }

        return (
            <Table>
                <TableBody>
                    {viewingRecord.data.map((section: any, index: number) => (
                        <React.Fragment key={index}>
                            <TableRow className="bg-muted">
                                <TableCell colSpan={2} className="font-bold text-primary">{section.category}</TableCell>
                            </TableRow>
                            {Array.isArray(section.items) ? section.items.map((item: any, i: number) => (
                                <TableRow key={`${index}-${i}`}>
                                    <TableCell className="font-medium pl-8">{item.label || item.field || `Item ${i+1}`}</TableCell>
                                    <TableCell>{item.value}</TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={2}>{String(section.items)}</TableCell></TableRow>}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <nav className="mt-4 space-y-1">
                {filteredCategories.map(category => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category === 'Bank Timelines' ? <Landmark className="mr-2 h-4 w-4" /> : getIconForFile(category)({className: 'mr-2 h-4 w-4'})}
                    {category}
                  </Button>
                ))}
              </nav>
            </div>
            <div className="md:col-span-3">
              {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : error ? (
                <div className="text-destructive text-center">{error}</div>
              ) : activeCategory === 'Bank Timelines' ? (
                <div className="space-y-4">
                  {bankProjects.map(bank => (
                    <Card key={bank.name}>
                        <CardHeader><CardTitle>{bank.name}</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Project Name</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {bank.records.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{record.projectName}</TableCell>
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
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Project Name</TableHead>
                      {!employeeOnly && <TableHead>Created By</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow><TableCell colSpan={employeeOnly ? 4 : 5} className="text-center h-24">No records found.</TableCell></TableRow>
                    ) : (
                      filteredRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium flex items-center gap-2">{getIconForFile(record.fileName)({className: 'h-4 w-4'})} {record.fileName}</TableCell>
                          <TableCell>{record.projectName}</TableCell>
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
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
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
