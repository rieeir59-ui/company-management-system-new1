
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
  Calendar as CalendarIcon,
  Eye,
  User,
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
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Employee } from '@/lib/employees';

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
  const { user: currentUser, employees } = useCurrentUser();
  const { addRecord, records } = useRecords();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(currentUser?.uid);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined | null>(currentUser);

  const isAdmin = useMemo(() => currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer'].includes(d)), [currentUser]);

  useEffect(() => {
    if(currentUser && !selectedEmployeeId) {
      setSelectedEmployeeId(currentUser?.uid);
      setSelectedEmployee(currentUser);
    }
  }, [currentUser, selectedEmployeeId]);

  const handleEmployeeChange = (employeeUid: string) => {
      setSelectedEmployeeId(employeeUid);
      const employee = employees.find(e => e.uid === employeeUid);
      setSelectedEmployee(employee);
  };


  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState('all');
  
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isCustomRange, setIsCustomRange] = useState(false);
  
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const targetEmployeeId = isAdmin ? selectedEmployeeId : currentUser?.uid;
    if (!targetEmployeeId) {
        setEntries([]);
        return;
    }

    const dailyReportRecords = records.filter(r => r.fileName === 'Daily Work Report' && r.employeeId === targetEmployeeId);
    
    const loadedEntriesMap = new Map<number, ReportEntry>();

    dailyReportRecords.forEach(record => {
      if (record.data && Array.isArray(record.data)) {
        record.data.forEach((dayData: any) => {
          if (dayData.category === 'Work Entries' && Array.isArray(dayData.items)) {
            dayData.items.forEach((item: any) => {
              const entryId = item.id || Date.now() + Math.random();
              if (!loadedEntriesMap.has(entryId)) {
                  loadedEntriesMap.set(entryId, {
                    id: entryId,
                    date: item.date,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    customerJobNumber: item.customerJobNumber,
                    projectName: item.projectName,
                    designType: item.designType,
                    projectType: item.projectType,
                    description: item.description,
                  });
              }
            });
          }
        });
      }
    });
    setEntries(Array.from(loadedEntriesMap.values()));
  }, [records, currentUser, selectedEmployeeId, isAdmin]);

  const dateInterval = useMemo(() => {
    try {
      if (isCustomRange && dateFrom && dateTo) {
         if (isValid(dateFrom) && isValid(dateTo) && dateTo >= dateFrom) {
            return eachDayOfInterval({ start: dateFrom, end: dateTo });
         }
      } else {
        const monthStart = startOfMonth(currentDate);
        if (selectedWeek === 'all') {
          return eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
        } else {
          const weekIndex = parseInt(selectedWeek, 10) - 1;
          let weekStart = startOfWeek(addMonths(monthStart, 0), { weekStartsOn: 1 });
          weekStart = new Date(weekStart.setDate(weekStart.getDate() + weekIndex * 7));
          
          if(weekStart.getMonth() !== currentDate.getMonth()){
             weekStart = startOfMonth(currentDate);
          }

          let weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          
          if(weekEnd.getMonth() !== currentDate.getMonth()){
            weekEnd = endOfMonth(currentDate);
          }

          return eachDayOfInterval({ start: weekStart, end: weekEnd });
        }
      }
    } catch (e) {
      console.error("Error creating date interval:", e);
    }
    return [];
  }, [dateFrom, dateTo, isCustomRange, currentDate, selectedWeek]);
  
  const entriesByDate = useMemo(() => {
      const targetEmployeeId = isAdmin ? selectedEmployeeId : currentUser?.uid;
      return entries
        .filter(entry => {
            const entryDate = parseISO(entry.date);
            return dateInterval.some(d => format(d, 'yyyy-MM-dd') === format(entryDate, 'yyyy-MM-dd'));
        })
        .reduce((acc, entry) => {
          (acc[entry.date] = acc[entry.date] || []).push(entry);
          return acc;
      }, {} as Record<string, ReportEntry[]>);
  }, [entries, dateInterval, isAdmin, selectedEmployeeId, currentUser]);

  const totalPeriodUnits = useMemo(() => {
    const totalMinutes = dateInterval.reduce((total, day) => {
        const dayString = format(day, 'yyyy-MM-dd');
        const dayEntries = entriesByDate[dayString] || [];
        const dayTotalMinutes = dayEntries.reduce((acc, entry) => {
            const [hours, minutes] = calculateTotalUnits(entry.startTime, entry.endTime).split(':').map(Number);
            return acc + (hours * 60) + minutes;
        }, 0);
        return total + dayTotalMinutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }, [dateInterval, entriesByDate]);

  const addEntry = (date: string) => {
    setEntries([
      ...entries,
      {
        id: Date.now() + Math.random(),
        date: date,
        startTime: '',
        endTime: '',
        customerJobNumber: 'IHA-J000-0000',
        projectName: 'C-B-D',
        designType: 'EXTERIOR',
        projectType: 'COMMERCIAL',
        description: 'MEETING',
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
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522, info@isbahhassan.com, www.isbahhassan.com";
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
            [`EMPLOYEE NAME: ${selectedEmployee?.name || currentUser?.name || 'N/A'}`, `EMPLOYEE POSITION: ${selectedEmployee?.departments.join(', ') || currentUser?.departments.join(', ') || 'N/A'}`],
            [`DATE FROM: ${dateInterval.length > 0 ? format(dateInterval[0], 'yyyy-MM-dd') : ''}`, `TO DATE: ${dateInterval.length > 0 ? format(dateInterval[dateInterval.length - 1], 'yyyy-MM-dd') : ''}`],
             [{ content: `TOTAL UNITS FOR PERIOD: ${totalPeriodUnits}`, colSpan: 3, styles: { fontStyle: 'bold' } }],
        ],
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } }
    });

    yPos = (doc as any).autoTable.previous.finalY + 2;

    (doc as any).autoTable({
        startY: yPos,
        head: [[
            { content: 'DAY', styles: { halign: 'center', valign: 'middle' } },
            { content: 'DATE', styles: { halign: 'center', valign: 'middle' } },
            { content: 'TIME\nSTART', styles: { halign: 'center' } },
            { content: 'TIME\nEND', styles: { halign: 'center' } },
            { content: 'CUSTOMER JOB\nNUMBER', styles: { halign: 'center' } },
            { content: 'PROJECT NAME', styles: { halign: 'center', valign: 'middle' } },
            { content: 'DESIGN TYPE', styles: { halign: 'center', valign: 'middle' } },
            { content: 'PROJECT TYPE', styles: { halign: 'center', valign: 'middle' } },
            { content: 'DESCRIPTION', styles: { halign: 'center', valign: 'middle' } },
            { content: 'TOTAL UNITS', styles: { halign: 'center', valign: 'middle' } },
        ]],
        body: dateInterval.flatMap((day, dayIndex) => {
            const dayString = format(day, 'yyyy-MM-dd');
            const dayEntries = entriesByDate[dayString] || [];
             const totalDayUnitsInMinutes = dayEntries.reduce((acc, entry) => {
                const [hours, minutes] = calculateTotalUnits(entry.startTime, entry.endTime).split(':').map(Number);
                return acc + (hours * 60) + minutes;
            }, 0);
            const totalHours = Math.floor(totalDayUnitsInMinutes / 60);
            const totalMinutes = totalDayUnitsInMinutes % 60;
            
            const rows = dayEntries.map((entry, entryIndex) => [
                entryIndex === 0 ? format(day, 'EEEE').toUpperCase() : '',
                entryIndex === 0 ? format(parseISO(entry.date), 'dd-MMM') : '',
                entry.startTime, 
                entry.endTime, 
                entry.customerJobNumber, 
                entry.projectName, 
                entry.designType, 
                entry.projectType, 
                entry.description,
                calculateTotalUnits(entry.startTime, entry.endTime)
            ]);
            
            if (dayEntries.length > 0) {
                 rows.push([
                    { content: 'TOTAL UNITS', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: `${totalHours}:${String(totalMinutes).padStart(2, '0')}`, styles: { fontStyle: 'bold', halign: 'center' } }
                ]);
            }
            return rows.length > 0 ? rows : [['', format(day, 'dd-MMM'), {content: 'No entries for this day', colSpan: 8, styles: {halign: 'center', textColor: 150}}]];
        }),
        theme: 'grid',
        headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0, halign: 'center' },
        didDrawPage: (data: any) => { yPos = data.cursor.y + 5; },
        columnStyles: { 9: { halign: 'center' } }
    });
     yPos = (doc as any).autoTable.previous.finalY + 5;

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
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save('weekly-work-report.pdf');
  };

  const years = [2024, 2025, 2026];
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM') }));

  const filterByDateRange = () => setIsCustomRange(true);
  const filterByMonthWeek = () => {
      setIsCustomRange(false);
      setDateFrom(undefined);
      setDateTo(undefined);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl text-primary flex items-center justify-center gap-2">
          <CalendarIcon /> Daily Work Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="p-4 bg-muted/50">
            {isAdmin && (
                <div className="mb-6">
                    <Label htmlFor="employee-select" className="font-semibold text-lg flex items-center gap-2"><User /> View Report For:</Label>
                    <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange}>
                        <SelectTrigger id="employee-select">
                            <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(emp => (
                                <SelectItem key={emp.uid} value={emp.uid}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2 p-4 border rounded-md">
                <Label className="font-semibold">Filter by Month & Week</Label>
                <div className="flex gap-2">
                  <Select value={String(currentDate.getFullYear())} onValueChange={(year) => setCurrentDate(new Date(parseInt(year), currentDate.getMonth(), 1))}>
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                   <Select value={String(currentDate.getMonth())} onValueChange={(month) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(month), 1))}>
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All Month</SelectItem>
                        <SelectItem value="1">Week 1</SelectItem>
                        <SelectItem value="2">Week 2</SelectItem>
                        <SelectItem value="3">Week 3</SelectItem>
                        <SelectItem value="4">Week 4</SelectItem>
                        <SelectItem value="5">Week 5</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                 <Button onClick={filterByMonthWeek} className="w-full mt-2" variant={!isCustomRange ? "default" : "secondary"}>Apply Month/Week Filter</Button>
            </div>
             <div className="space-y-2 p-4 border rounded-md">
                <Label className="font-semibold">Filter by Date Range</Label>
                 <div className="flex gap-2">
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateFrom ? format(dateFrom, "PPP") : <span>Date From</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus /></PopoverContent></Popover>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateTo ? format(dateTo, "PPP") : <span>To Date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus /></PopoverContent></Popover>
                </div>
                <Button onClick={filterByDateRange} className="w-full mt-2" variant={isCustomRange ? "default" : "secondary"} disabled={!dateFrom || !dateTo}>Filter by Date Range</Button>
            </div>
          </div>
        </Card>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
                <Button className="w-full"><Eye className="mr-2 h-4 w-4" /> View Full Report</Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl">
                <DialogHeader>
                    <DialogTitle>Weekly Work Report</DialogTitle>
                    <DialogDescription>
                        Preview of the report for {selectedEmployee?.name || currentUser?.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-1">
                    <div className="text-center p-4">
                        <h2 className="font-bold text-lg">ISBAH HASSAN & ASSOCIATES</h2>
                        <h3 className="font-semibold">WEEKLY WORK REPORT</h3>
                    </div>
                     <div className="flex justify-between text-sm px-4 pb-2">
                        <span><b>EMPLOYEE NAME:</b> {selectedEmployee?.name || currentUser?.name}</span>
                        <span><b>EMPLOYEE POSITION:</b> {selectedEmployee?.departments.join(', ') || currentUser?.departments.join(', ')}</span>
                    </div>
                    <div className="flex justify-between text-sm px-4 pb-4">
                        <span><b>DATE FROM:</b> {dateInterval.length > 0 ? format(dateInterval[0], 'yyyy-MM-dd') : ''}</span>
                         <span><b>TO DATE:</b> {dateInterval.length > 0 ? format(dateInterval[dateInterval.length - 1], 'yyyy-MM-dd') : ''}</span>
                    </div>
                    <div className="text-right px-4 pb-2 font-bold">TOTAL UNITS FOR PERIOD: {totalPeriodUnits}</div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted hover:bg-muted text-xs">
                                <TableHead className="w-[100px]">DAY</TableHead>
                                <TableHead className="w-[100px]">DATE</TableHead>
                                <TableHead>START</TableHead>
                                <TableHead>END</TableHead>
                                <TableHead>CUSTOMER JOB</TableHead>
                                <TableHead>PROJECT NAME</TableHead>
                                <TableHead>DESIGN TYPE</TableHead>
                                <TableHead>PROJECT TYPE</TableHead>
                                <TableHead>DESCRIPTION</TableHead>
                                <TableHead className="text-right">TOTAL UNITS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dateInterval.map((day) => {
                                const dayString = format(day, 'yyyy-MM-dd');
                                const dayEntries = entriesByDate[dayString] || [];
                                if (dayEntries.length === 0) return (
                                    <TableRow key={dayString}>
                                        <TableCell className="font-bold">{format(day, 'EEEE').toUpperCase()}</TableCell>
                                        <TableCell>{format(day, 'dd-MMM')}</TableCell>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">No entries for this day</TableCell>
                                    </TableRow>
                                );
                                 const totalDayUnitsInMinutes = dayEntries.reduce((acc, entry) => {
                                    const [hours, minutes] = calculateTotalUnits(entry.startTime, entry.endTime).split(':').map(Number);
                                    return acc + (hours * 60) + minutes;
                                }, 0);
                                const totalHours = Math.floor(totalDayUnitsInMinutes / 60);
                                const totalMinutes = totalDayUnitsInMinutes % 60;
                                
                                return (
                                    <React.Fragment key={dayString}>
                                        {dayEntries.map((entry, entryIndex) => (
                                            <TableRow key={entry.id}>
                                                {entryIndex === 0 ? <TableCell rowSpan={dayEntries.length + 1} className="font-bold align-top">{format(day, 'EEEE').toUpperCase()}</TableCell> : null}
                                                {entryIndex === 0 ? <TableCell rowSpan={dayEntries.length + 1} className="align-top">{format(parseISO(entry.date), 'dd-MMM')}</TableCell> : null}
                                                <TableCell>{entry.startTime}</TableCell>
                                                <TableCell>{entry.endTime}</TableCell>
                                                <TableCell>{entry.customerJobNumber}</TableCell>
                                                <TableCell>{entry.projectName}</TableCell>
                                                <TableCell>{entry.designType}</TableCell>
                                                <TableCell>{entry.projectType}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell className="text-right">{calculateTotalUnits(entry.startTime, entry.endTime)}</TableCell>
                                            </TableRow>
                                        ))}
                                         <TableRow className="bg-muted/50 font-bold">
                                            <TableCell colSpan={8} className="text-right">TOTAL UNITS</TableCell>
                                            <TableCell className="text-right">{`${totalHours}:${String(totalMinutes).padStart(2, '0')}`}</TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
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

    