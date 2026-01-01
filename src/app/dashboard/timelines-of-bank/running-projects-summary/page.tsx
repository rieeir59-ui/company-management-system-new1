
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ArrowLeft, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { bankTimelineCategories, bankProjectsMap } from '@/lib/projects-data';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRecords } from '@/context/RecordContext';
import { useCurrentUser } from '@/context/UserContext';

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

export default function RunningProjectsSummaryPage() {
    const { toast } = useToast();
    const { records, addOrUpdateRecord } = useRecords();
    const { user: currentUser } = useCurrentUser();
    const isAdmin = currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d));

    const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
    
    const [overallStatus, setOverallStatus] = useState('All timelines are being followed, and there are no current blockers. Coordination between architectural, MEP, and structural teams is proceeding as planned. Client feedback loops are active, with regular meetings ensuring alignment on design and progress milestones. Procurement for long-lead items has been initiated for critical projects to mitigate potential delays. Resource allocation is optimized across all running projects.');
    const [remarks, setRemarks] = useState('Continue monitoring the critical path for each project. Ensure that any client-requested changes are documented and their impact on the timeline is assessed immediately. A follow-up meeting is scheduled for next week to review the progress of the tender packages.');
    const [remarksDate, setRemarksDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        // This effect runs once on mount and whenever records change to load saved remarks.
        const summaryRecord = records.find(r => r.fileName === 'Running Projects Summary');
        
        let savedRemarksMap: Record<string, string> = {};
        if (summaryRecord) {
            const summaryCategory = summaryRecord.data?.find((d: any) => d.category === 'Summary');
            if (summaryCategory && Array.isArray(summaryCategory.items)) {
                summaryCategory.items.forEach((item: SummaryRow) => {
                    savedRemarksMap[item.project] = item.remarks;
                });
            }

            const statusData = summaryRecord.data?.find((d: any) => d.category === 'Status & Remarks')?.items || [];
            const savedOverallStatus = statusData.find((i:any) => i.label === 'Overall Status')?.value;
            const savedRemarks = statusData.find((i:any) => i.label === 'Maam Isbah Remarks & Order')?.value;
            const savedDate = statusData.find((i:any) => i.label === 'Date')?.value;
            if (savedOverallStatus) setOverallStatus(savedOverallStatus);
            if (savedRemarks) setRemarks(savedRemarks);
            if (savedDate) setRemarksDate(savedDate);
        }

        // The source of truth for the count is now always bankProjectsMap.
        const data: SummaryRow[] = projectOrder.map((proj, index) => {
            const projects = bankProjectsMap[proj.key as keyof typeof bankProjectsMap] || [];
            return {
                srNo: index + 1,
                project: proj.name,
                count: projects.length, // Always use live count from the map
                remarks: savedRemarksMap[proj.name] || '' // Use saved remarks if available
            };
        });
        
        setSummaryData(data);
    }, [records]);


    const totalProjects = useMemo(() => {
        return summaryData.reduce((acc, curr) => acc + Number(curr.count || 0), 0);
    }, [summaryData]);
    
    const handleRemarkChange = (srNo: number, value: string) => {
        setSummaryData(prevData => prevData.map(row => row.srNo === srNo ? { ...row, remarks: value } : row));
    };

    const handleSave = () => {
        if (!isAdmin) {
             toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to save this summary.' });
             return;
        }

        addOrUpdateRecord({
            fileName: "Running Projects Summary",
            projectName: "Running Projects Summary",
            data: [
                {
                    category: "Summary",
                    items: summaryData // Save the current state which includes updated remarks
                },
                {
                    category: "Status & Remarks",
                    items: [
                        { label: 'Overall Status', value: overallStatus },
                        { label: 'Maam Isbah Remarks & Order', value: remarks },
                        { label: 'Date', value: remarksDate },
                    ]
                }
            ],
        } as any);
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
        yPos += doc.getTextDimensions(overallStatus, {maxWidth: 180}).h + 10;

        doc.setFont('helvetica', 'bold');
        doc.text('Maam Isbah Remarks & Order:', 14, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(remarks, 180), 14, yPos);
        yPos += doc.getTextDimensions(remarks, {maxWidth: 180}).h + 10;
        
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
                    {isAdmin && <Button onClick={handleSave} variant="outline"><Save className="mr-2 h-4 w-4" /> Save</Button>}
                    <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Sr.No</TableHead>
                            <TableHead>Projects</TableHead>
                            <TableHead>Nos of project</TableHead>
                            <TableHead>Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summaryData.map((row) => (
                            <TableRow key={row.srNo}>
                                <TableCell>{row.srNo}</TableCell>
                                <TableCell>{row.project}</TableCell>
                                <TableCell>
                                    <Input 
                                        type="number"
                                        value={row.count}
                                        readOnly // The count is now derived, not editable.
                                        className="w-24 border-0 bg-transparent"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={row.remarks}
                                        onChange={(e) => handleRemarkChange(row.srNo, e.target.value)}
                                        placeholder="Add remarks..."
                                        className="border-0 focus-visible:ring-1"
                                        disabled={!isAdmin}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6">
                <div className="w-full">
                    <Label htmlFor="overall_status" className="font-bold">Overall Status</Label>
                    <Textarea 
                        id="overall_status"
                        value={overallStatus}
                        onChange={e => setOverallStatus(e.target.value)}
                        rows={4}
                        disabled={!isAdmin}
                    />
                </div>
                <div className="w-full">
                    <Label htmlFor="remarks" className="font-bold">Maam Isbah Remarks & Order</Label>
                    <Textarea 
                        id="remarks"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        rows={3}
                        disabled={!isAdmin}
                    />
                </div>
                 <div className="w-full">
                    <Label htmlFor="remarks_date" className="font-bold">Date</Label>
                    <Input 
                        id="remarks_date"
                        type="date"
                        value={remarksDate}
                        onChange={e => setRemarksDate(e.target.value)}
                        className="w-fit"
                        disabled={!isAdmin}
                    />
                </div>
                <div className="w-full text-right font-bold text-lg p-2 bg-muted rounded-md">
                    Total Projects: {totalProjects}
                </div>
            </CardFooter>
        </Card>
    );
}
