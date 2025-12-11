
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useCurrentUser } from '@/context/UserContext';
import { useRecords, type SavedRecord } from '@/context/RecordContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function MyProjectsReportComponent() {
  const { user: currentUser } = useCurrentUser();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId');
  const displayUser = employeeId ? null : currentUser; 
  
  const { records, isLoading } = useRecords();
  
  const [scheduleRecord, setScheduleRecord] = useState<SavedRecord | null>(null);

  useEffect(() => {
    if (displayUser) {
      const foundRecord = records.find(r => 
        r.employeeId === displayUser.uid && 
        r.fileName === 'My Projects'
      );
      setScheduleRecord(foundRecord || null);
    }
  }, [records, displayUser]);
  
  const scheduleData = useMemo(() => {
    if (!scheduleRecord?.data?.[0]) return null;
    return scheduleRecord.data[0];
  }, [scheduleRecord]);

  const handleDownload = () => {
    if (!scheduleData || !displayUser) return;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('My Project Schedule', 14, 22);
    doc.setFontSize(10);
    doc.text(`Employee: ${displayUser.name}`, 14, 30);
    if(scheduleData.schedule) {
      doc.text(`Schedule: ${scheduleData.schedule.start || ''} to ${scheduleData.schedule.end || ''}`, 14, 36);
    }

    const body = scheduleData.items.map((item: any) => {
      const projectName = item.label.replace('Project: ', '');
      const details = item.value.split(', ').reduce((acc: any, part: string) => {
        const [key, ...val] = part.split(': ');
        acc[key.trim()] = val.join(': ');
        return acc;
      }, {});
      return [projectName, details.Detail, details.Status, details.Start, details.End];
    });

    (doc as any).autoTable({
        startY: 42,
        head: [['Project Name', 'Detail', 'Status', 'Start Date', 'End Date']],
        body: body,
        headStyles: { fillColor: [22, 163, 74] }, // Tailwind's `bg-primary` color
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    if (scheduleData.remarks) {
        doc.text('Remarks:', 14, finalY);
        doc.text(scheduleData.remarks, 14, finalY + 5);
    }

    doc.save('my-project-schedule.pdf');
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Loading project schedule...</span>
      </div>
    );
  }
  
  if (!scheduleData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Project Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">No project schedule has been saved yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
            <h1 className="text-3xl font-bold">My Project Schedule</h1>
            <p className="mt-2 text-muted-foreground">
                <span className="font-semibold">Employee:</span> {displayUser?.name}
            </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary/90">
              <TableHead className="font-bold text-primary-foreground">Project Name</TableHead>
              <TableHead className="font-bold text-primary-foreground">Detail</TableHead>
              <TableHead className="font-bold text-primary-foreground">Status</TableHead>
              <TableHead className="font-bold text-primary-foreground">Start Date</TableHead>
              <TableHead className="font-bold text-primary-foreground">End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {scheduleData.items?.map((item: any, i: number) => {
                const projectName = item.label.replace('Project: ', '');
                const details = item.value.split(', ').reduce((acc: any, part: string) => {
                    const [key, ...val] = part.split(': ');
                    acc[key.trim()] = val.join(': ');
                    return acc;
                }, {});
                return (
                     <TableRow key={i}>
                        <TableCell>{projectName}</TableCell>
                        <TableCell>{details.Detail}</TableCell>
                        <TableCell>{details.Status}</TableCell>
                        <TableCell>{details.Start}</TableCell>
                        <TableCell>{details.End}</TableCell>
                    </TableRow>
                )
             })}
          </TableBody>
        </Table>
        {scheduleData.remarks && (
            <div className="mt-4">
                <h4 className="font-bold">Remarks:</h4>
                <p className="text-muted-foreground">{scheduleData.remarks}</p>
            </div>
        )}
      <div className="flex justify-end pt-6">
            <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
      </div>
    </div>
  );
}

export default function MyProjectsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading Page...</div>}>
      <MyProjectsReportComponent />
    </Suspense>
  );
}
