'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { bankProjectsMap } from '@/lib/projects-data';
import Link from 'next/link';

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

    const summaryData = useMemo(() => {
        const data: SummaryRow[] = projectOrder.map((proj, index) => ({
            srNo: index + 1,
            project: proj.name,
            count: bankProjectsMap[proj.key]?.length || 0,
            remarks: ''
        }));
        // The image shows Sr.No 11 for Residential, skipping 10
        const residentialIndex = data.findIndex(d => d.project === 'Residential');
        if (residentialIndex !== -1) {
            data[residentialIndex].srNo = 11;
        }

        return data;
    }, []);

    const totalProjects = useMemo(() => {
        return summaryData.reduce((acc, curr) => acc + curr.count, 0);
    }, [summaryData]);

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
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <CardTitle className="font-headline text-3xl text-primary">Running Projects Summary</CardTitle>
                 </div>
                <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
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
                                <TableCell>{row.remarks}</TableCell>
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
