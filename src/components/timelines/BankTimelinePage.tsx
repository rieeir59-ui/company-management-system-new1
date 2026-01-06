
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download, PlusCircle, Trash2, Bot, ArrowLeft, Edit, CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRecords } from '@/context/RecordContext';
import { generateTimeline } from '@/ai/flows/generate-timeline-flow';
import { bankProjectsMap, type ProjectRow, bankTimelineCategories } from '@/lib/projects-data';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { addDays, subDays, differenceInDays } from 'date-fns';
import { Label } from '../ui/label';
import { useCurrentUser } from '@/context/UserContext';


type DashboardType = 'dashboard' | 'employee-dashboard';

const StyledTextarea = ({ initialValue, onBlur }: { initialValue: string, onBlur: (value: string) => void }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <Textarea 
            className="border-0 bg-transparent h-8 min-h-[4rem] p-1 focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background w-48" 
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={() => onBlur(value)}
        />
    )
}

const StyledInput = (props: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & { initialValue: string, onBlur: (value: string) => void }) => {
    const { initialValue, onBlur, ...rest } = props;
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);
    
    return (
         <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onBlur(value)}
            {...rest}
        />
    )
}

export default function BankTimelinePage({ dashboardType }: { dashboardType: DashboardType }) {
    const params = useParams();
    const bankName = Array.isArray(params.bankName) ? params.bankName[0] : params.bankName;
    const { toast } = useToast();
    const { user: currentUser } = useCurrentUser();
    const { addOrUpdateRecord, records } = useRecords();

    const formattedBankName = useMemo(() => {
        return bankTimelineCategories.find(b => b.toLowerCase().replace(/ /g, '-') === bankName) || bankName;
    }, [bankName]);

    const initialData = useMemo(() => bankProjectsMap[bankName as keyof typeof bankProjectsMap] || [], [bankName]);

    const [projectRows, setProjectRows] = useState<ProjectRow[]>([]);
    
    const [overallStatus, setOverallStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [remarksDate, setRemarksDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const record = records.find(r => r.fileName === `${formattedBankName} Timeline`);
        if (record && record.data) {
            const projects = record.data.find((d: any) => d.category === 'Projects')?.items || [];
            const statusAndRemarks = record.data.find((d: any) => d.category === 'Status & Remarks')?.items || [];
            
            if (projects.length > 0) {
                setProjectRows(projects);
            } else {
                setProjectRows(initialData);
            }
            
            const savedOverallStatus = statusAndRemarks.find((i:any) => i.label === 'Overall Status')?.value;
            const savedRemarks = statusAndRemarks.find((i:any) => i.label === 'Maam Isbah Remarks & Order')?.value;
            const savedDate = statusAndRemarks.find((i:any) => i.label === 'Date')?.value;

            setOverallStatus(savedOverallStatus || '');
            setRemarks(savedRemarks || '');
            if (savedDate) setRemarksDate(savedDate);
            
        } else {
            setProjectRows(initialData);
        }
    }, [bankName, formattedBankName, initialData, records]);
    
     const handleSave = () => {
        if (!currentUser) {
             toast({ variant: 'destructive', title: 'Permission Denied', description: 'You must be logged in to save.' });
             return;
        }

        addOrUpdateRecord({
            fileName: `${formattedBankName} Timeline`,
            projectName: `${formattedBankName} Projects`,
            employeeId: currentUser.uid,
            employeeName: currentUser.name,
            employeeRecord: currentUser.record,
            data: [
                { category: 'Projects', items: projectRows },
                { category: 'Status & Remarks', items: [{label: 'Overall Status', value: overallStatus}, {label: 'Maam Isbah Remarks & Order', value: remarks}, {label: 'Date', value: remarksDate}] },
            ]
        } as any, true);

    };


    const [genProjectName, setGenProjectName] = useState('');
    const [genArea, setGenArea] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateTimeline = async () => {
        if (!genProjectName || !genArea) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please enter a project name and area to generate a timeline.',
            });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateTimeline({ projectName: genProjectName, area: genArea });
            
            const taskMap: Record<string, { start: string, end: string }> = {};
            result.tasks.forEach(task => {
                const key = task.taskName.toLowerCase().replace(/[^a-z0-9]/g, '');
                taskMap[key] = { start: task.startDate, end: task.endDate };
            });

            const projectExists = projectRows.some(row => row.projectName.toLowerCase() === genProjectName.toLowerCase());

            const updateRowWithAITimeline = (row: ProjectRow): ProjectRow => ({
                ...row,
                area: genArea,
                siteSurveyStart: taskMap['sitesurvey']?.start || row.siteSurveyStart,
                siteSurveyEnd: taskMap['sitesurvey']?.end || row.siteSurveyEnd,
                proposalStart: taskMap['proposaldesigndevelopment']?.start || row.proposalStart,
                proposalEnd: taskMap['proposaldesigndevelopment']?.end || row.proposalEnd,
                threedStart: taskMap['3ds']?.start || row.threedStart,
                threedEnd: taskMap['3ds']?.end || row.threedEnd,
                tenderArchStart: taskMap['tenderpackagearchitectural']?.start || row.tenderArchStart,
                tenderArchEnd: taskMap['tenderpackagearchitectural']?.end || row.tenderArchEnd,
            });

            if (projectExists) {
                 setProjectRows(rows => rows.map(row => 
                    row.projectName.toLowerCase() === genProjectName.toLowerCase() ? updateRowWithAITimeline(row) : row
                ));
            } else {
                 const newId = projectRows.length > 0 ? Math.max(...projectRows.map(r => r.id)) + 1 : 1;
                 const newSrNo = projectRows.length > 0 ? String(parseInt(projectRows[projectRows.length - 1].srNo) + 1) : '1';
                 let newRow: ProjectRow = {
                    id: newId, srNo: newSrNo, projectName: genProjectName, area: genArea, projectHolder: '', allocationDate: '',
                    siteSurveyStart: '', siteSurveyEnd: '', contract: '', headCount: '',
                    proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', designLockDate: '', submissionDrawingStart: '', submissionDrawingEnd: '',
                    tenderArchStart: '', tenderArchEnd: '',
                    tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', interior: '', comparative: '',
                    workingDrawingsStart: '', workingDrawingsEnd: '',
                    siteVisit: '', finalBill: '', projectClosure: '', remarks: ''
                };
                newRow = updateRowWithAITimeline(newRow);
                setProjectRows(prevRows => [...prevRows, newRow]);
            }
            
            toast({ title: 'Timeline Generated', description: `Dates for '${genProjectName}' have been filled in.` });

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: 'Could not generate the timeline. Please try again.',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleProjectChange = (id: number, field: keyof ProjectRow, value: string) => {
        setProjectRows(currentTasks => {
            return currentTasks.map(task => {
                if (task.id === id) {
                    return { ...task, [field]: value };
                }
                return task;
            });
        });
    };
    
    const DateInput = ({ value, onChange }: { value: string, onChange: (value: string) => void}) => {
        let dateValue: Date | undefined = undefined;
        let displayValue: string = '';
    
        if (value && isValid(parseISO(value))) {
            dateValue = parseISO(value);
            displayValue = format(dateValue, "dd-MMM-yy");
        } else if (!value) {
            displayValue = "Pick a date";
        } else {
            displayValue = value;
        }

        return (
            <div className="relative">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal text-xs h-8 pr-8 border-0 bg-transparent hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-primary", !value && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {displayValue}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={dateValue}
                            onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                {value && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 hover:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                        }}
                    >
                        <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                )}
            </div>
        )
    }

    const addProjectRow = () => {
        const newId = projectRows.length > 0 ? Math.max(...projectRows.map(r => r.id)) + 1 : 1;
        const newSrNo = projectRows.length > 0 ? String(parseInt(projectRows[projectRows.length - 1].srNo) + 1) : '1';
        const newRow: ProjectRow = {
            id: newId, srNo: newSrNo, projectName: '', area: '', projectHolder: '', allocationDate: '',
            siteSurveyStart: '', siteSurveyEnd: '', contract: '', headCount: '',
            proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', designLockDate: '', submissionDrawingStart: '', submissionDrawingEnd: '',
            tenderArchStart: '', tenderArchEnd: '',
            tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', interior: '', comparative: '',
            workingDrawingsStart: '', workingDrawingsEnd: '',
            siteVisit: '', finalBill: '', projectClosure: '', remarks: ''
        };
        const updatedRows = [...projectRows, newRow];
        setProjectRows(updatedRows);
    };
    
    const removeProjectRow = (id: number) => {
        const updatedRows = projectRows
            .filter(row => row.id !== id)
            .map((row, index) => ({
                ...row,
                srNo: String(index + 1)
            }));

        setProjectRows(updatedRows);
        handleSave();
        toast({ title: 'Project Deleted', description: 'The project has been removed and the timeline has been updated.' });
    };

    const handleDownload = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(10);
        doc.text(formattedBankName, 14, 15);
        
        const head = [
            [
                { content: 'Sr.No', rowSpan: 2 }, { content: 'Project Name', rowSpan: 2 }, { content: 'Area in Sft', rowSpan: 2 },
                { content: 'Project Holder', rowSpan: 2 }, { content: 'Allocation Date / RFP', rowSpan: 2 },
                { content: 'Site Survey', colSpan: 2 }, { content: 'Contract', colSpan: 2 },
                { content: 'Head Count / Requirement', colSpan: 2 }, { content: 'Proposal / Design Development', colSpan: 2 },
                { content: "3D's", colSpan: 2 }, { content: 'Design Lock Date', rowSpan: 2 },
                { content: 'Submission Drawing', colSpan: 2},
                { content: 'Architecture Working Drawing', colSpan: 2 }, { content: 'Tender Package MEP', colSpan: 2 },
                { content: 'BOQ', colSpan: 2 }, { content: 'Interior', rowSpan: 2 }, { content: 'Comparative', rowSpan: 2 },
                { content: 'Working Drawings', colSpan: 2 }, { content: 'Site Visit', colSpan: 2 },
                { content: 'Final Bill', rowSpan: 2 }, { content: 'Project Closure', rowSpan: 2 },
                { content: 'Remarks', rowSpan: 2 }
            ],
            [
                'Start', 'End', 'Start', 'End', 'Start', 'End', 'Start', 'End',
                'Start', 'End', 'Start', 'End', 'Start', 'End', 'Start', 'End',
                'Start', 'End', 'Start', 'End'
            ]
        ];
        
        const body = projectRows.map(p => [
            p.srNo, p.projectName, p.area, p.projectHolder, p.allocationDate, p.siteSurveyStart, p.siteSurveyEnd, p.contract, p.headCount,
            p.proposalStart, p.proposalEnd,
            p.threedStart, p.threedEnd,
            p.designLockDate,
            p.submissionDrawingStart, p.submissionDrawingEnd,
            p.tenderArchStart, p.tenderArchEnd,
            p.tenderMepStart, p.tenderMepEnd,
            p.boqStart, p.boqEnd,
            p.interior, p.comparative,
            p.workingDrawingsStart, p.workingDrawingsEnd,
            p.siteVisit,
            p.finalBill, p.projectClosure,
            p.remarks
        ]);

        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 5, cellPadding: 1, valign: 'middle', halign: 'center' },
            headStyles: { fillColor: [45, 95, 51], fontStyle: 'bold', fontSize: 4.5, valign: 'middle', halign: 'center' },
        });
        let lastY = (doc as any).autoTable.previous.finalY + 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Overall Status:", 14, lastY);
        lastY += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(overallStatus, 14, lastY, { maxWidth: 260 });
        lastY += doc.getTextDimensions(overallStatus, { maxWidth: 260 }).h + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.text("Maam Isbah Remarks & Order", 14, lastY);
        lastY += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(remarks, 14, lastY, { maxWidth: 260 });
        lastY += doc.getTextDimensions(remarks, { maxWidth: 260 }).h + 10;

        doc.text(`Date: ${remarksDate}`, 14, lastY);

        doc.save(`${bankName}_timeline.pdf`);
        toast({ title: 'Downloaded', description: 'Timeline has been downloaded as PDF.' });
    };

    if (!initialData.length && !projectRows.length) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>No Data Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">No project data found for {formattedBankName}.</p>
                        <Button asChild className="mt-6">
                            <Link href={`/${dashboardType}`} className="flex items-center gap-2">
                               <ArrowLeft className="h-4 w-4" />
                               Back to Dashboard
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
        
    const tableHeaders = [
        { name: "Sr.No", span: 1, rowSpan: 2 },
        { name: "Project Name", span: 1, rowSpan: 2 },
        { name: "Area in Sft", span: 1, rowSpan: 2 },
        { name: "Project Holder", span: 1, rowSpan: 2 },
        { name: "Allocation Date / RFP", span: 1, rowSpan: 2 },
        { name: "Site Survey", span: 2, rowSpan: 1 },
        { name: "Contract", span: 1, rowSpan: 2 },
        { name: "Head Count / Requirement", span: 1, rowSpan: 2 },
        { name: "Proposal / Design Development", span: 2, rowSpan: 1 },
        { name: "3D's", span: 2, rowSpan: 1 },
        { name: "Design Lock Date", span: 1, rowSpan: 2 },
        { name: "Submission Drawing", span: 2, rowSpan: 1},
        { name: "Architecture Working Drawing", span: 2, rowSpan: 1 },
        { name: "Tender Package MEP", span: 2, rowSpan: 1 },
        { name: "BOQ", span: 2, rowSpan: 1 },
        { name: "Interior", span: 1, rowSpan: 2 },
        { name: "Comparative", span: 1, rowSpan: 2 },
        { name: "Site Visit", span: 1, rowSpan: 2 },
        { name: "Final Bill", span: 1, rowSpan: 2 },
        { name: "Project Closure", span: 1, rowSpan: 2 },
        { name: "Remarks", span: 1, rowSpan: 2 },
        { name: "Action", span: 1, rowSpan: 2 }
    ];

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={`/${dashboardType}`}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <CardTitle className="text-center font-headline text-3xl text-primary">{formattedBankName} Timeline</CardTitle>
                </div>
                <div className="flex gap-2">
                    {currentUser && <Button onClick={handleSave} variant="outline"><Save className="mr-2 h-4 w-4" /> Save All</Button>}
                    <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <Card className="mb-6 bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5" /> AI Timeline Generator</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full"><Input placeholder="Project Name" value={genProjectName} onChange={(e) => setGenProjectName(e.target.value)} /></div>
                        <div className="flex-1 w-full"><Input placeholder="Area in sft" value={genArea} onChange={(e) => setGenArea(e.target.value)} /></div>
                        <Button onClick={handleGenerateTimeline} disabled={isGenerating} className="w-full md:w-auto">
                            {isGenerating ? 'Generating...' : 'Generate Timeline'}
                        </Button>
                    </CardContent>
                </Card>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                        <thead className="sticky top-0 bg-primary/20 z-10">
                            <tr>
                                {tableHeaders.map((header) => (
                                     <th key={header.name} className="border p-1 align-bottom whitespace-nowrap" colSpan={header.span} rowSpan={header.rowSpan}>{header.name}</th>
                                ))}
                            </tr>
                            <tr className="bg-primary/10">
                                {tableHeaders.flatMap(header => {
                                    if (header.span > 1) {
                                        return [<th key={`${header.name}-start`} className="border p-1">Start</th>, <th key={`${header.name}-end`} className="border p-1">End</th>]
                                    }
                                    return [];
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {projectRows.map(row => (
                                <tr key={row.id}>
                                    <td className="border text-center p-1"><StyledInput type="text" initialValue={row.srNo} onBlur={v => handleProjectChange(row.id, 'srNo', v)} className="w-12 text-center" /></td>
                                    <td className="border p-1"><StyledInput type="text" initialValue={row.projectName} onBlur={v => handleProjectChange(row.id, 'projectName', v)} className="min-w-[200px]" /></td>
                                    <td className="border p-1"><StyledInput type="text" initialValue={row.area} onBlur={v => handleProjectChange(row.id, 'area', v)} className="w-24" /></td>
                                    <td className="border p-1"><StyledInput type="text" initialValue={row.projectHolder} onBlur={v => handleProjectChange(row.id, 'projectHolder', v)} className="w-32" /></td>
                                    <td className="border p-1"><DateInput value={row.allocationDate} onChange={v => handleProjectChange(row.id, 'allocationDate', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.siteSurveyStart} onChange={v => handleProjectChange(row.id, 'siteSurveyStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.siteSurveyEnd} onChange={v => handleProjectChange(row.id, 'siteSurveyEnd', v)} /></td>
                                    <td className="border p-1"><StyledInput type="text" initialValue={row.contract} onBlur={v => handleProjectChange(row.id, 'contract', v)} className="w-24" /></td>
                                    <td className="border p-1"><StyledInput type="text" initialValue={row.headCount || ''} onBlur={v => handleProjectChange(row.id, 'headCount', v)} className="w-32" /></td>
                                    <td className="border p-1"><DateInput value={row.proposalStart} onChange={v => handleProjectChange(row.id, 'proposalStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.proposalEnd} onChange={v => handleProjectChange(row.id, 'proposalEnd', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.threedStart} onChange={v => handleProjectChange(row.id, 'threedStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.threedEnd} onChange={v => handleProjectChange(row.id, 'threedEnd', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.designLockDate} onChange={v => handleProjectChange(row.id, 'designLockDate', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.submissionDrawingStart} onChange={v => handleProjectChange(row.id, 'submissionDrawingStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.submissionDrawingEnd} onChange={v => handleProjectChange(row.id, 'submissionDrawingEnd', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.tenderArchStart} onChange={v => handleProjectChange(row.id, 'tenderArchStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.tenderArchEnd} onChange={v => handleProjectChange(row.id, 'tenderArchEnd', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.tenderMepStart} onChange={v => handleProjectChange(row.id, 'tenderMepStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.tenderMepEnd} onChange={v => handleProjectChange(row.id, 'tenderMepEnd', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.boqStart} onChange={v => handleProjectChange(row.id, 'boqStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.boqEnd} onChange={v => handleProjectChange(row.id, 'boqEnd', v)} /></td>
                                    <td className="border p-1"><StyledInput type="text" initialValue={row.interior} onBlur={v => handleProjectChange(row.id, 'interior', v)} className="w-24" /></td>
                                    <td className="border p-1"><StyledInput type="text" initialValue={row.comparative} onBlur={v => handleProjectChange(row.id, 'comparative', v)} className="w-24" /></td>
                                    <td className="border p-1"><DateInput value={row.workingDrawingsStart || ''} onChange={v => handleProjectChange(row.id, 'workingDrawingsStart', v)} /></td>
                                    <td className="border p-1"><DateInput value={row.workingDrawingsEnd || ''} onChange={v => handleProjectChange(row.id, 'workingDrawingsEnd', v)} /></td>
                                    <td className="border p-1"><StyledTextarea initialValue={row.siteVisit} onBlur={v => handleProjectChange(row.id, 'siteVisit', v)} /></td>
                                    <td className="border p-1"><StyledTextarea initialValue={row.finalBill} onBlur={v => handleProjectChange(row.id, 'finalBill', v)} /></td>
                                    <td className="border p-1"><StyledTextarea initialValue={row.projectClosure} onBlur={v => handleProjectChange(row.id, 'projectClosure', v)} /></td>
                                    <td className="border p-1"><StyledTextarea initialValue={row.remarks} onBlur={v => handleProjectChange(row.id, 'remarks', v)} /></td>
                                    <td className="border p-1">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => removeProjectRow(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-start mt-4">
                    <Button onClick={addProjectRow} variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add Project</Button>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6 border-t mt-4">
                 <div className="w-full">
                    <Label htmlFor="overall_status" className="font-bold text-lg">Overall Status</Label>
                    <Textarea 
                        id="overall_status"
                        value={overallStatus}
                        onChange={e => setOverallStatus(e.target.value)}
                        rows={4}
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
                    />
                </div>
            </CardFooter>
        </Card>
    );
}
