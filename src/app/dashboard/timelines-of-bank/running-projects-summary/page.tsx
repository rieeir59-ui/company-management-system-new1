
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ArrowLeft, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { bankProjectsMap, bankTimelineCategories } from '@/lib/projects-data';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { useRecords } from '@/context/RecordContext';
import { useCurrentUser } from '@/context/UserContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SummaryRow {
  srNo: number;
  project: string;
  count: number;
  remarks: string;
}

const projectOrder = bankTimelineCategories.map(name => ({
    name,
    key: `${name.toLowerCase().replace(/ /g, '-')}`
}));

// Debounce hook
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}


export default function RunningProjectsSummaryPage() {
    const { toast } = useToast();
    const { records, addOrUpdateRecord } = useRecords();
    const { user: currentUser } = useCurrentUser();
    const isAdmin = useMemo(() => currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d)), [currentUser]);

    const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
    const [overallStatus, setOverallStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [remarksDate, setRemarksDate] = useState(new Date().toISOString().split('T')[0]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const savedSummaryRecord = records.find(r => r.fileName === "Running Projects Summary");
        const savedRemarksMap: Record<string, string> = {};

        if (savedSummaryRecord && savedSummaryRecord.data) {
            const summaryItems = savedSummaryRecord.data.find((d: any) => d.category === 'Summary')?.items || [];
            if (Array.isArray(summaryItems)) {
                 summaryItems.forEach((item: any) => {
                    const projectName = item.project;
                    if(projectName) {
                        savedRemarksMap[projectName] = item.remarks || '';
                    }
                });
            }
            
            const statusAndRemarksItems = savedSummaryRecord.data.find((d: any) => d.category === 'Status & Remarks')?.items || [];
             if(Array.isArray(statusAndRemarksItems)) {
                const savedOverallStatus = statusAndRemarksItems.find((i: any) => i.label === 'Overall Status')?.value;
                const savedRemarks = statusAndRemarksItems.find((i: any) => i.label === 'Maam Isbah Remarks & Order')?.value;
                const savedDate = statusAndRemarksItems.find((i: any) => i.label === 'Date')?.value;
                
                if (savedOverallStatus) setOverallStatus(savedOverallStatus);
                if (savedRemarks) setRemarks(savedRemarks);
                if (savedDate) setRemarksDate(savedDate);
             }
        }
        
        const data: SummaryRow[] = projectOrder.map((proj, index) => {
            const bankTimelineRecord = records.find(r => r.fileName === `${proj.name} Timeline`);
            let projectCount = 0;
            if (bankTimelineRecord) {
                projectCount = bankTimelineRecord.data.find((d: any) => d.category === 'Projects')?.items.length || 0;
            } else {
                projectCount = (bankProjectsMap[proj.key as keyof typeof bankProjectsMap] || []).length;
            }
            
            return {
                srNo: index + 1,
                project: proj.name,
                count: projectCount,
                remarks: savedRemarksMap[proj.name] || ''
            };
        });
        
        setSummaryData(data);
        setIsInitialLoad(false);
    }, [records]);
    
    const handleSave = useCallback((currentData = summaryData, currentStatus = overallStatus, currentRemarks = remarks, currentDate = remarksDate, showToast = true) => {
        if (!isAdmin || !currentUser) {
             if(showToast) toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to save this summary.' });
             return;
        }

        addOrUpdateRecord({
            fileName: "Running Projects Summary",
            projectName: "Running Projects Summary",
            data: [
                {
                    category: "Summary",
                    items: currentData 
                },
                {
                    category: "Status & Remarks",
                    items: [
                        { label: 'Overall Status', value: currentStatus },
                        { label: 'Maam Isbah Remarks & Order', value: currentRemarks },
                        { label: 'Date', value: currentDate },
                    ]
                }
            ],
        } as any, showToast);

    }, [addOrUpdateRecord, isAdmin, toast, summaryData, overallStatus, remarks, remarksDate, currentUser]);

    const debouncedSave = useDebounce(handleSave, 2000);

    useEffect(() => {
        if (!isInitialLoad && currentUser) {
            debouncedSave(summaryData, overallStatus, remarks, remarksDate, false);
        }
    }, [summaryData, overallStatus, remarks, remarksDate, debouncedSave, isInitialLoad, currentUser]);


    const totalProjects = useMemo(() => {
        return summaryData.reduce((acc, curr) => acc + Number(curr.count || 0), 0);
    }, [summaryData]);
    
    const handleRemarkChange = (srNo: number, value: string) => {
        setSummaryData(prevData => prevData.map(row => row.srNo === srNo ? { ...row, remarks: value } : row));
    };

    const handleDownload = () => {
        const doc = new jsPDF();
        let yPos = 20;

        doc.setFontSize(16);
        doc.text('Running Projects Summary', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        (doc as any).autoTable({
            head: [['Sr.No', 'Projects', 'Nos of project', 'Remarks']],
            body: summaryData.map(row => [row.srNo, row.project, row.count, row.remarks]),
            startY: yPos,
            theme: 'grid',
            foot: [['', 'Total', totalProjects, '']],
            footStyles: { fontStyle: 'bold' }
        });
        yPos = (doc as any).autoTable.previous.finalY + 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Overall Status:', 14, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(overallStatus, 180), 14, yPos);
        yPos += doc.getTextDimensions(overallStatus, { maxWidth: 180 }).h + 10;

        doc.setFont('helvetica', 'bold');
        doc.text('Maam Isbah Remarks & Order:', 14, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(remarks, 180), 14, yPos);
        yPos += doc.getTextDimensions(remarks, { maxWidth: 180 }).h + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Date: ${remarksDate}`, 14, yPos);

        doc.save('running_projects_summary.pdf');
        toast({ title: 'Download Complete', description: 'The summary has been downloaded as a PDF.' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <CardTitle className="font-headline text-3xl text-primary">Running Projects Summary</CardTitle>
                 </div>
                 <div className="flex gap-2">
                    {isAdmin && <Button onClick={() => handleSave()} variant="outline"><Save className="mr-2 h-4 w-4" /> Save</Button>}
                    <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-2 border-primary/20 hover:bg-transparent">
                            <TableHead className="w-[100px] text-lg font-semibold text-foreground">Sr.No</TableHead>
                            <TableHead className="text-lg font-semibold text-foreground">Projects</TableHead>
                            <TableHead className="text-lg font-semibold text-foreground">Nos of project</TableHead>
                            <TableHead className="text-lg font-semibold text-foreground">Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summaryData.map((row) => (
                            <TableRow key={row.srNo} className="border-0">
                                <TableCell className="text-base font-medium text-muted-foreground pt-4">{row.srNo}</TableCell>
                                <TableCell className="text-base font-medium pt-4">{row.project}</TableCell>
                                <TableCell className="text-base font-medium pt-4">{row.count}</TableCell>
                                <TableCell>
                                    <Textarea 
                                        value={row.remarks}
                                        onChange={(e) => handleRemarkChange(row.srNo, e.target.value)}
                                        placeholder="Add remarks..."
                                        className="bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:border-primary"
                                        disabled={!isAdmin}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6 border-t mt-4">
                <div className="w-full">
                    <Label htmlFor="overall_status" className="font-bold text-lg">Overall Status</Label>
                    <Textarea 
                        id="overall_status"
                        value={overallStatus}
                        onChange={e => setOverallStatus(e.target.value)}
                        rows={4}
                        disabled={!isAdmin}
                        className="mt-2"
                    />
                </div>
                <div className="w-full">
                    <Label htmlFor="remarks" className="font-bold text-lg">Maam Isbah Remarks & Order</Label>
                    <Textarea 
                        id="remarks"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        rows={3}
                        disabled={!isAdmin}
                        className="mt-2"
                    />
                </div>
                 <div className="w-full">
                    <Label htmlFor="remarks_date" className="font-bold text-lg">Date</Label>
                    <Input 
                        id="remarks_date"
                        type="date"
                        value={remarksDate}
                        onChange={e => setRemarksDate(e.target.value)}
                        className="w-fit mt-2"
                        disabled={!isAdmin}
                    />
                </div>
                <div className="w-full text-right font-bold text-xl p-3 bg-muted rounded-md mt-4">
                    Total Projects: {totalProjects}
                </div>
            </CardFooter>
        </Card>
    );
}
