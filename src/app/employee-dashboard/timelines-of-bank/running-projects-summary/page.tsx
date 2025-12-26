
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ArrowLeft, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { bankProjectsMap } from '@/lib/projects-data';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useRecords } from '@/context/RecordContext';

interface SummaryRow {
  srNo: number;
  project: string;
  count: number;
  remarks: string;
}

const projectOrder = [
    { name: 'HBL', key: 'hbl' },
    { name: 'Bank Alfalah', key: 'bank-al-falah' },
    { name: 'Faysal Bank', key: 'faysal-bank' },
    { name: 'UBL', key: 'ubl' },
    { name: 'DIB', key: 'dib' },
    { name: 'MCB', key: 'mcb' },
    { name: 'Askari Bank', key: 'askari-bank' },
    { name: 'Commercial', key: 'commercial' },
    { name: 'C.B.D', key: 'cbd' },
    { name: 'Residential', key: 'residential' }
];

export default function RunningProjectsSummaryPage() {
    const { toast } = useToast();
    const { addRecord } = useRecords();

    const initialSummaryData = useMemo(() => {
        const data: SummaryRow[] = projectOrder.map((proj, index) => ({
            srNo: index + 1,
            project: proj.name,
            count: bankProjectsMap[proj.key]?.length || 0,
            remarks: ''
        }));
        const residentialIndex = data.findIndex(d => d.project === 'Residential');
        if (residentialIndex !== -1) {
            data[residentialIndex].srNo = 11;
        }
        return data;
    }, []);

    const [summaryData, setSummaryData] = useState<SummaryRow[]>(initialSummaryData);

    const totalProjects = useMemo(() => {
        return summaryData.reduce((acc, curr) => acc + curr.count, 0);
    }, [summaryData]);

    const handleRemarkChange = (srNo: number, value: string) => {
        setSummaryData(prevData => prevData.map(row => row.srNo === srNo ? { ...row, remarks: value } : row));
    };

    const handleSave = () => {
        addRecord({
            fileName: "Running Projects Summary",
            projectName: "Running Projects Summary",
            data: [
                {
                    category: "Summary",
                    items: summaryData
                }
            ],
        } as any);
        toast({ title: 'Success', description: 'Summary has been saved to records.' });
    };

    const handleDownload = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Running Projects Summary', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

        (doc as any).autoTable({
            head: [['Sr.No', 'Projects', 'Nos of project', 'Remarks']],
            body: summaryData.map(row => [row.srNo, row.project, row.count, row.remarks]),
            startY: 30,
            theme: 'grid',
            foot: [['', 'Total', totalProjects, '']],
            footStyles: { fontStyle: 'bold' }
        });
        
        doc.save('running_projects_summary.pdf');
        toast({ title: 'Download Complete', description: 'The summary has been downloaded as a PDF.' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/employee-dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <CardTitle className="font-headline text-3xl text-primary">Running Projects Summary</CardTitle>
                 </div>
                 <div className="flex gap-2">
                    <Button onClick={handleSave} variant="outline"><Save className="mr-2 h-4 w-4" /> Save</Button>
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
                                <TableCell>{row.count}</TableCell>
                                <TableCell>
                                    <Input 
                                        value={row.remarks}
                                        onChange={(e) => handleRemarkChange(row.srNo, e.target.value)}
                                        placeholder="Add remarks..."
                                        className="border-0 focus-visible:ring-1"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="font-bold bg-muted">
                            <TableCell colSpan={2} className="text-right">Total</TableCell>
                            <TableCell>{totalProjects}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

