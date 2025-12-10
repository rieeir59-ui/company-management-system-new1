
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  PlusCircle,
  Save,
  Trash2,
  Calendar,
  Eye,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useRecords } from '@/context/RecordContext';
import {
  format,
  eachDayOfInterval,
  parseISO,
  differenceInMinutes,
  isValid,
} from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Textarea } from '@/components/ui/textarea';

type ReportEntry = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  customerJobNumber: string;
  projectName: string;
  designType: string;
  projectType: string;
  description: string;
};

const calculateTotalUnits = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '0:00';
    
    // Create dummy dates to parse times
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);

    if (!isValid(start) || !isValid(end) || end < start) return '0:00';
    
    const diff = differenceInMinutes(end, start);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return `${hours}:${String(minutes).padStart(2, '0')}`;
};


export default function DailyReportPage() {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { addRecord, records } = useRecords();

  const [dateFrom, setDateFrom] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [dateTo, setDateTo] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const dailyReportRecords = records.filter(r => r.fileName === 'Daily Work Report');
    const loadedEntries: ReportEntry[] = [];
    dailyReportRecords.forEach(record => {
      if (record.data && Array.isArray(record.data)) {
        record.data.forEach((dayData: any) => {
          if (dayData.category === 'Work Entries' && Array.isArray(dayData.items)) {
            dayData.items.forEach((item: any) => {
              loadedEntries.push({
                id: item.id || Date.now() + Math.random(),
                date: item.date,
                startTime: item.startTime,
                endTime: item.endTime,
                customerJobNumber: item.customerJobNumber,
                projectName: item.projectName,
                designType: item.designType,
                projectType: item.projectType,
                description: item.description,
              });
            });
          }
        });
      }
    });
    setEntries(loadedEntries);
  }, [records]);

  const dateInterval = useMemo(() => {
    try {
      const start = parseISO(dateFrom);
      const end = parseISO(dateTo);
      if (isValid(start) && isValid(end) && end >= start) {
        return eachDayOfInterval({ start, end });
      }
    } catch (e) {
      // Invalid date format
    }
    return [];
  }, [dateFrom, dateTo]);
  
  const entriesByDate = useMemo(() => {
      return entries.reduce((acc, entry) => {
          (acc[entry.date] = acc[entry.date] || []).push(entry);
          return acc;
      }, {} as Record<string, ReportEntry[]>);
  }, [entries]);

  const addEntry = (date: string) => {
    setEntries([
      ...entries,
      {
        id: Date.now(),
        date: date,
        startTime: '',
        endTime: '',
        customerJobNumber: '',
        projectName: '',
        designType: 'DESIGN',
        projectType: 'DESIGN',
        description: '',
      },
    ]);
  };
  
  const handleEntryChange = (id: number, field: keyof ReportEntry, value: string) => {
      setEntries(entries.map(entry => (entry.id === id ? { ...entry, [field]: value } : entry)));
  };

  const removeEntry = (id: number) => {
      setEntries(entries.filter(entry => entry.id !== id));
  };
  
  const handleSave = async (date: string) => {
    const dayEntries = entries.filter(e => e.date === date);
    if (dayEntries.length === 0) {
        toast({ variant: 'destructive', title: 'No Entries', description: `There are no entries to save for ${date}.`});
        return;
    }
    
    await addRecord({
        fileName: 'Daily Work Report',
        projectName: `Work Report for ${date}`,
        data: [{
            category: 'Work Entries',
            items: dayEntries,
        }],
    } as any);
  };
  
  const handleDownload = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    doc.setFontSize(10);
    let yPos = 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ISBAH HASSAN & ASSOCIATES', pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.setFontSize(10);
    doc.text('WEEKLY WORK REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    (doc as any).autoTable({
        startY: yPos,
        theme: 'plain',
        styles: { fontSize: 9 },
        body: [
            [`EMPLOYEE NAME: ${currentUser?.name || 'N/A'}`, `EMPLOYEE POSITION: ${currentUser?.departments.join(', ') || 'N/A'}`],
            [`DATE FROM: ${dateFrom}`, `TO DATE: ${dateTo}`, `WEEK NUMBER: __`],
        ],
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } }
    });

    yPos = (doc as any).autoTable.previous.finalY + 2;

    dateInterval.forEach(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const dayEntries = entriesByDate[dayString] || [];
        const totalDayUnitsInMinutes = dayEntries.reduce((acc, entry) => {
            const [hours, minutes] = calculateTotalUnits(entry.startTime, entry.endTime).split(':').map(Number);
            return acc + (hours * 60) + minutes;
        }, 0);
        const totalHours = Math.floor(totalDayUnitsInMinutes / 60);
        const totalMinutes = totalDayUnitsInMinutes % 60;
        
        if (yPos > 150) { doc.addPage(); yPos = 20; }

        (doc as any).autoTable({
            startY: yPos,
            head: [[
                { content: format(day, 'EEEE').toUpperCase(), colSpan: 9, styles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' } }
            ]],
            body: dayEntries.map(entry => [
                format(parseISO(entry.date), 'dd-MMM'), 
                entry.startTime, 
                entry.endTime, 
                entry.customerJobNumber, 
                entry.projectName, 
                entry.designType, 
                entry.projectType, 
                entry.description,
                calculateTotalUnits(entry.startTime, entry.endTime)
            ]),
            foot: [[
                { content: 'TOTAL UNITS', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `${totalHours}:${String(totalMinutes).padStart(2, '0')}`, styles: { fontStyle: 'bold' } }
            ]],
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0 },
            didDrawPage: (data: any) => { yPos = data.cursor.y + 5; },
             columnStyles: { 8: { halign: 'right' } }
        });
         yPos = (doc as any).autoTable.previous.finalY + 5;
    });

    if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }

    (doc as any).autoTable({
        startY: yPos,
        theme: 'grid',
        body: [
            ['EMPLOYEE SIGNATURE: ____________________', 'MANAGER STUDIO: ____________________', 'MANAGER ACCOUNTS: ____________________', 'CEO SIGNATURE: ____________________'],
            [{ content: 'NOTE: ALL ARCHITECT/DESIGNER/DRAFTSMEN SHOULD SUBMIT THESE TIME SHEET EVERY SATURDAY ON WEEKLY BASIS ORDERED BY ISBAH HASSAN', colSpan: 4, styles: { fontStyle: 'bold' } }],
        ],
        styles: { fontSize: 8 },
    });
    
    // Add footer to all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save('weekly-work-report.pdf');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl text-primary flex items-center justify-center gap-2">
          <Calendar /> Daily Work Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="p-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Date From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label>To Date</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
             <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                    <Button><Eye className="mr-2 h-4 w-4" /> View Report</Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Weekly Work Report</DialogTitle>
                        <DialogDescription>
                            Preview of your report from {dateFrom} to {dateTo}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1">
                        {dateInterval.map(day => {
                             const dayString = format(day, 'yyyy-MM-dd');
                             const dayEntries = entriesByDate[dayString] || [];
                             return (
                                <Card key={dayString} className="mb-4">
                                    <CardHeader><CardTitle>{format(day, 'EEEE, dd MMM yyyy')}</CardTitle></CardHeader>
                                    <CardContent>
                                         <Table>
                                            <TableHeader>
                                                <TableRow><TableHead>Time</TableHead><TableHead>Project</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Units</TableHead></TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dayEntries.map(entry => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                                                        <TableCell>{entry.projectName}</TableCell>
                                                        <TableCell>{entry.description}</TableCell>
                                                        <TableCell className="text-right">{calculateTotalUnits(entry.startTime, entry.endTime)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                             )
                        })}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </Card>
        
        <Accordion type="multiple" defaultValue={dateInterval.map(d => format(d, 'yyyy-MM-dd'))} className="w-full space-y-2">
            {dateInterval.map(day => {
                const dayString = format(day, 'yyyy-MM-dd');
                const dayEntries = entriesByDate[dayString] || [];
                 const totalDayUnitsInMinutes = dayEntries.reduce((acc, entry) => {
                    const [hours, minutes] = calculateTotalUnits(entry.startTime, entry.endTime).split(':').map(Number);
                    return acc + (hours * 60) + minutes;
                }, 0);
                const totalHours = Math.floor(totalDayUnitsInMinutes / 60);
                const totalMinutes = totalDayUnitsInMinutes % 60;

                return (
                    <AccordionItem value={dayString} key={dayString}>
                        <AccordionTrigger className="bg-primary/10 px-4 rounded-md font-bold">
                            {format(day, 'EEEE, dd MMM yyyy')}
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border rounded-b-md">
                           <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Customer Job</TableHead>
                                        <TableHead>Design</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Total Units</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dayEntries.map(entry => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="min-w-[200px]">
                                                <div className="flex gap-2">
                                                    <Input type="time" value={entry.startTime} onChange={e => handleEntryChange(entry.id, 'startTime', e.target.value)} />
                                                    <Input type="time" value={entry.endTime} onChange={e => handleEntryChange(entry.id, 'endTime', e.target.value)} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <Input placeholder="Job Number" value={entry.customerJobNumber} onChange={e => handleEntryChange(entry.id, 'customerJobNumber', e.target.value)} />
                                                <Input placeholder="Project Name" value={entry.projectName} onChange={e => handleEntryChange(entry.id, 'projectName', e.target.value)} className="mt-1" />
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <Input placeholder="Design Type" value={entry.designType} onChange={e => handleEntryChange(entry.id, 'designType', e.target.value)} />
                                                <Input placeholder="Project Type" value={entry.projectType} onChange={e => handleEntryChange(entry.id, 'projectType', e.target.value)} className="mt-1" />
                                            </TableCell>
                                            <TableCell className="min-w-[250px]"><Textarea value={entry.description} onChange={e => handleEntryChange(entry.id, 'description', e.target.value)} /></TableCell>
                                            <TableCell className="font-semibold text-center">{calculateTotalUnits(entry.startTime, entry.endTime)}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                           </div>
                           <div className="flex justify-between items-center mt-4">
                                <Button onClick={() => addEntry(dayString)} size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Add Entry</Button>
                                <div className="flex items-center gap-4">
                                    <div className="font-bold text-lg">Total: {totalHours}:{String(totalMinutes).padStart(2, '0')}</div>
                                    <Button onClick={() => handleSave(dayString)} size="sm" variant="outline"><Save className="mr-2 h-4 w-4" /> Save Day</Button>
                                </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
