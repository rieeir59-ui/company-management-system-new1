
'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import DashboardPageHeader from '@/components/dashboard/PageHeader';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Download, Loader2, Edit, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useCurrentUser } from '@/context/UserContext';
import Link from 'next/link';
import { getFormUrlFromFileName, allFileNames } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { getIconForFile } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const timelineFileNames = [
    'Timeline Schedule',
    'Commercial Timeline',
    'Residential Timeline',
    'Askari Bank Timeline',
    'Bank Alfalah Timeline',
    'Bank Al Habib Timeline',
    'CBD Timeline',
    'DIB Timeline',
    'FBL Timeline',
    'HBL Timeline',
    'MCB Timeline',
    'UBL Timeline',
];

function SavedRecordsPageComponent() {
    const image = PlaceHolderImages.find(p => p.id === 'saved-records');
    const { user: currentUser, isUserLoading } = useCurrentUser();
    const { records: allRecords, isLoading, error, deleteRecord } = useRecords();
    const [recordToDelete, setRecordToDelete] = useState<SavedRecord | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewingRecord, setViewingRecord] = useState<SavedRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    const searchParams = useSearchParams();
    const filterParam = searchParams.get('filter');

    useEffect(() => {
        if(filterParam) {
            setSelectedCategory(filterParam);
        } else {
            setSelectedCategory(null);
        }
    }, [filterParam]);

     const myRecords = useMemo(() => {
        if (!currentUser) return [];
        return allRecords.filter(rec => rec.employeeId === currentUser.record);
    }, [allRecords, currentUser]);

    const openDeleteDialog = (e: React.MouseEvent, record: SavedRecord) => {
        e.stopPropagation();
        setRecordToDelete(record);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        deleteRecord(recordToDelete.id);
        setIsDeleteDialogOpen(false);
        setRecordToDelete(null);
    };
    
    const groupedRecords = useMemo(() => {
        const source = myRecords;
        const grouped = source.reduce((acc, record) => {
            const fileName = record.fileName;
            if (!acc[fileName]) {
                acc[fileName] = [];
            }
            acc[fileName].push(record);
            return acc;
        }, {} as Record<string, SavedRecord[]>);

        allFileNames.forEach(name => {
            if (!grouped[name]) {
                grouped[name] = [];
            }
        });
        
        return grouped;
    }, [myRecords]);

    const openViewDialog = (e: React.MouseEvent, record: SavedRecord) => {
        e.stopPropagation();
        setViewingRecord(record);
        setIsViewDialogOpen(true);
    };
    
    const handleDownload = (record: SavedRecord) => {
        const doc = new jsPDF() as any;
        generateDefaultPdf(doc, record);
        doc.output('dataurlnewwindow');
    };

    const generateDefaultPdf = (doc: jsPDF, record: SavedRecord) => {
        let yPos = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(record.projectName, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(10);
        
        const headerData = [
            ['File', record.fileName],
            ['Saved by', record.employeeName],
            ['Date', new Date(record.createdAt).toLocaleDateString()],
        ];

        (doc as any).autoTable({
            startY: yPos,
            theme: 'plain',
            body: headerData,
            styles: { fontSize: 10 },
        });

        yPos = (doc as any).autoTable.previous.finalY + 10;
        
        const dataArray = Array.isArray(record.data) ? record.data : [record.data];

        dataArray.forEach((section: any) => {
            if (yPos > 260) { doc.addPage(); yPos = 20; }
            
            if (record.fileName === 'Site Visit Proforma' && section.category !== 'Basic Information' && section.category !== 'Pictures' && section.items[0]?.Item) {
                const tableBody = section.items.map((item: any) => [item.Item, item.Status, item.Remarks]);
                if (tableBody.length > 0) {
                    (doc as any).autoTable({
                        head: [[section.category]],
                        body: [],
                        startY: yPos,
                        theme: 'plain',
                        headStyles: { fontStyle: 'bold', fontSize: 12, textColor: [45, 95, 51] },
                    });
                    yPos = (doc as any).autoTable.previous.finalY + 2;

                    (doc as any).autoTable({
                        head: [['Item', 'Status', 'Remarks']],
                        body: tableBody,
                        startY: yPos,
                        theme: 'grid',
                        headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0 },
                        styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' }
                    });
                    yPos = (doc as any).autoTable.previous.finalY + 10;
                }
                return;
            }


            const body: (string | number)[][] = [];

            if (section.items && Array.isArray(section.items)) {
                section.items.forEach((item: any) => {
                     let label: string;
                     let value: string;
                    if(typeof item === 'object' && item !== null && (item.label || item.comment)) {
                       label = item.label || item.comment;
                       value = item.value || (item.url ? 'See Link' : '');
                       body.push([label, value]);
                    } else if (typeof item === 'string') {
                         const parts = item.split(':');
                         if (parts.length > 1) {
                            body.push([parts[0], parts.slice(1).join(':').trim()]);
                        }
                    }
                });
            }
            
            if (body.length > 0) {
                (doc as any).autoTable({
                    head: [[section.category || 'Details']],
                    body: body,
                    startY: yPos,
                    theme: 'grid',
                    headStyles: { fontStyle: 'bold', fillColor: [45, 95, 51], textColor: 255 },
                    styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' }
                });
                yPos = (doc as any).autoTable.previous.finalY + 10;
            }
        });
    }

    if (isLoading || isUserLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-4">Loading your records...</span>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-8">
                <DashboardPageHeader
                    title="Your Saved Records"
                    description="Access your saved checklists, documents, and forms."
                    imageUrl={image?.imageUrl || ''}
                    imageHint={image?.imageHint || ''}
                />
                
                {error && (
                     <Card className="text-center py-12 bg-destructive/10 border-destructive">
                        <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
                        <CardContent><p className="text-destructive/90">{error}</p></CardContent>
                    </Card>
                )}

                {!isLoading && !error && selectedCategory ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" onClick={() => setSelectedCategory(null)}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle>{selectedCategory}</CardTitle>
                                    <CardDescription>Your saved "{selectedCategory}" records.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project Name</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedRecords[selectedCategory] && groupedRecords[selectedCategory].length > 0 ? (
                                            groupedRecords[selectedCategory].map(record => {
                                                const formUrl = getFormUrlFromFileName(record.fileName, 'employee-dashboard');
                                                return (
                                                    <TableRow key={record.id} onClick={(e) => openViewDialog(e, record)} className="cursor-pointer">
                                                        <TableCell className="font-medium">{record.projectName}</TableCell>
                                                        <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                                {formUrl && (
                                                                    <Button asChild variant="ghost" size="icon">
                                                                        <Link href={`${formUrl}?id=${record.id}`}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Link>
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" onClick={(e) => openDeleteDialog(e, record)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                    You have no saved records for this category.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(groupedRecords).map(([fileName, fileRecords]) => {
                           if(fileRecords.length === 0) return null;
                           const Icon = getIconForFile(fileName);
                           return (
                            <Card 
                                key={fileName} 
                                className="flex flex-col justify-between cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                                onClick={() => setSelectedCategory(fileName)}
                            >
                                <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
                                   <div className="bg-primary/10 p-3 rounded-full">
                                        <Icon className="h-6 w-6 text-primary" />
                                   </div>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-lg font-semibold">{fileName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{fileRecords.length} record(s)</p>
                                </CardContent>
                            </Card>
                           )
                        })}
                    </div>
                )}
                 {myRecords.length === 0 && !isLoading && !error && !selectedCategory && (
                    <Card className="text-center py-12">
                        <CardHeader><CardTitle>No Records Found</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">You haven't saved any records yet.</p></CardContent>
                    </Card>
                )}
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the record for "{recordToDelete?.projectName}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{viewingRecord?.projectName}</DialogTitle>
                        <DialogDescription>{viewingRecord?.fileName} - Saved by {viewingRecord?.employeeName} on {viewingRecord && new Date(viewingRecord.createdAt).toLocaleDateString()}</DialogDescription>
                    </DialogHeader>
                     <div className="max-h-[70vh] overflow-y-auto p-1">
                        {viewingRecord?.data && (Array.isArray(viewingRecord.data) ? viewingRecord.data : [viewingRecord.data]).map((section: any, index: number) => {
                             if (viewingRecord.fileName === 'Site Visit Proforma' && section.category !== 'Basic Information' && section.category !== 'Pictures' && section.items[0]?.Item) {
                                return (
                                    <div key={index} className="mb-4">
                                        <h3 className="font-bold text-lg mb-2 bg-muted p-2 rounded-md">{section.category}</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-1/2">Item</TableHead>
                                                    <TableHead className="w-1/4">Status</TableHead>
                                                    <TableHead className="w-1/4">Remarks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {section.items.map((item: any, itemIndex: number) => (
                                                    <TableRow key={itemIndex}>
                                                        <TableCell>{item.Item}</TableCell>
                                                        <TableCell>{item.Status}</TableCell>
                                                        <TableCell>{item.Remarks}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                );
                            }
                            return (
                                <div key={index} className="mb-4">
                                    <h3 className="font-bold text-lg mb-2 bg-muted p-2 rounded-md">{section.category}</h3>
                                    <Table>
                                        <TableBody>
                                            {section.items && Array.isArray(section.items) && section.items.map((item: any, itemIndex: number) => {
                                                if (typeof item === 'string') {
                                                    const parts = item.split(':');
                                                    const label = parts[0];
                                                    const value = parts.slice(1).join(':').trim();
                                                    return (
                                                        <TableRow key={itemIndex}>
                                                            <TableCell className="font-medium w-1/3">{label}</TableCell>
                                                            <TableCell>{value}</TableCell>
                                                        </TableRow>
                                                    )
                                                } else if (typeof item === 'object' && item !== null && (item.label || item.comment)) {
                                                    return (
                                                        <TableRow key={itemIndex}>
                                                            <TableCell className="font-medium w-1/3">{item.label || item.comment}</TableCell>
                                                            <TableCell>{item.value || (item.url && <Link href={item.url} target="_blank" className="text-primary hover:underline">View File</Link>)}</TableCell>
                                                        </TableRow>
                                                    )
                                                }
                                                return null;
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )
                        })}
                    </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                        <Button onClick={() => viewingRecord && handleDownload(viewingRecord)}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function SavedRecordsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
            <SavedRecordsPageComponent />
        </Suspense>
    )
}
