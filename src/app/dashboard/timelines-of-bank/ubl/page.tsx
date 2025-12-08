
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download, PlusCircle, Trash2, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRecords } from '@/context/RecordContext';
import { generateTimeline } from '@/ai/flows/generate-timeline-flow';

interface ProjectRow {
  id: number;
  srNo: string;
  projectName: string;
  area: string;
  projectHolder: string;
  allocationDate: string;
  siteSurveyStart: string;
  siteSurveyEnd: string;
  contactStart: string;
  contactEnd: string;
  headCountStart: string;
  headCountEnd: string;
  proposalStart: string;
  proposalEnd: string;
  threedStart: string;
  threedEnd: string;
  tenderArchStart: string;
  tenderArchEnd: string;
  tenderMepStart: string;
  tenderMepEnd: string;
  boqStart: string;
  boqEnd: string;
  tenderStatus: string;
  comparative: string;
  workingDrawings: string;
  siteVisit: string;
  finalBill: string;
  projectClosure: string;
}

const initialProjectRows: ProjectRow[] = [];

function UBLTimelineComponent() {
    const { toast } = useToast();
    const { addRecord } = useRecords();
    const [projectRows, setProjectRows] = useState<ProjectRow[]>(initialProjectRows);
    const [remarks, setRemarks] = useState('');
    const [remarksDate, setRemarksDate] = useState('');

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

            if (projectExists) {
                 const updatedProjectRows = projectRows.map(row => {
                    if (row.projectName.toLowerCase() === genProjectName.toLowerCase()) {
                        return {
                            ...row,
                            siteSurveyStart: taskMap['sitesurvey']?.start || row.siteSurveyStart,
                            siteSurveyEnd: taskMap['sitesurvey']?.end || row.siteSurveyEnd,
                            contactStart: taskMap['contact']?.start || row.contactStart,
                            contactEnd: taskMap['contact']?.end || row.contactEnd,
                            headCountStart: taskMap['headcountrequirment']?.start || row.headCountStart,
                            headCountEnd: taskMap['headcountrequirment']?.end || row.headCountEnd,
                            proposalStart: taskMap['proposaldesigndevelopment']?.start || row.proposalStart,
                            proposalEnd: taskMap['proposaldesigndevelopment']?.end || row.proposalEnd,
                            threedStart: taskMap['3ds']?.start || row.threedStart,
                            threedEnd: taskMap['3ds']?.end || row.threedEnd,
                            tenderArchStart: taskMap['tenderpackagearchitectural']?.start || row.tenderArchStart,
                            tenderArchEnd: taskMap['tenderpackagearchitectural']?.end || row.tenderArchEnd,
                            tenderMepStart: taskMap['tenderpackagemep']?.start || row.tenderMepStart,
                            tenderMepEnd: taskMap['tenderpackagemep']?.end || row.tenderMepEnd,
                            boqStart: taskMap['boq']?.start || row.boqStart,
                            boqEnd: taskMap['boq']?.end || row.boqEnd,
                            tenderStatus: taskMap['tenderstatus']?.start || row.tenderStatus,
                            comparative: taskMap['comparative']?.start || row.comparative,
                            workingDrawings: taskMap['workingdrawings']?.start || row.workingDrawings,
                            siteVisit: taskMap['sitevisit']?.start || row.siteVisit,
                            finalBill: taskMap['finalbill']?.start || row.finalBill,
                            projectClosure: taskMap['projectclosure']?.start || row.projectClosure,
                        };
                    }
                    return row;
                });
                 setProjectRows(updatedProjectRows);
            } else {
                 const newId = projectRows.length > 0 ? Math.max(...projectRows.map(r => r.id)) + 1 : 1;
                 const newRow: ProjectRow = {
                    id: newId, srNo: String(newId), projectName: genProjectName, area: genArea, projectHolder: '', allocationDate: '',
                    siteSurveyStart: taskMap['sitesurvey']?.start || '',
                    siteSurveyEnd: taskMap['sitesurvey']?.end || '',
                    contactStart: taskMap['contact']?.start || '',
                    contactEnd: taskMap['contact']?.end || '',
                    headCountStart: taskMap['headcountrequirment']?.start || '',
                    headCountEnd: taskMap['headcountrequirment']?.end || '',
                    proposalStart: taskMap['proposaldesigndevelopment']?.start || '',
                    proposalEnd: taskMap['proposaldesigndevelopment']?.end || '',
                    threedStart: taskMap['3ds']?.start || '',
                    threedEnd: taskMap['3ds']?.end || '',
                    tenderArchStart: taskMap['tenderpackagearchitectural']?.start || '',
                    tenderArchEnd: taskMap['tenderpackagearchitectural']?.end || '',
                    tenderMepStart: taskMap['tenderpackagemep']?.start || '',
                    tenderMepEnd: taskMap['tenderpackagemep']?.end || '',
                    boqStart: taskMap['boq']?.start || '',
                    boqEnd: taskMap['boq']?.end || '',
                    tenderStatus: taskMap['tenderstatus']?.start || '',
                    comparative: taskMap['comparative']?.start || '',
                    workingDrawings: taskMap['workingdrawings']?.start || '',
                    siteVisit: taskMap['sitevisit']?.start || '',
                    finalBill: taskMap['finalbill']?.start || '',
                    projectClosure: taskMap['projectclosure']?.start || '',
                };
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
        setProjectRows(projectRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const addProjectRow = () => {
        const newId = projectRows.length > 0 ? Math.max(...projectRows.map(r => r.id)) + 1 : 1;
        setProjectRows([...projectRows, {
            id: newId, srNo: String(newId), projectName: '', area: '', projectHolder: '', allocationDate: '',
            siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '',
            proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '',
            tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '',
            workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: ''
        }]);
    };
    
    const removeProjectRow = (id: number) => {
        setProjectRows(projectRows.filter(row => row.id !== id));
    };
    
    const handleSave = () => {
        addRecord({
            fileName: 'UBL Timeline',
            projectName: 'UBL Projects',
            data: [
                { category: 'Projects', items: projectRows },
                { category: 'Remarks', items: [{label: 'Maam Isbah Remarks & Order', value: remarks}, {label: 'Date', value: remarksDate}] },
            ]
        } as any);
    };

    const handleDownload = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(10);
        doc.text("UBL Timeline", 14, 15);
        
        const head = [
            ['Sr.No', 'Project Name', 'Area in Sft', 'Project Holder', 'Allocation Date / RFP', 
             'Site Survey\nStart', 'Site Survey\nEnd', 'Contact\nStart', 'Contact\nEnd', 'Head Count / Requirment\nStart', 'Head Count / Requirment\nEnd',
             'Proposal / Design Development\nStart', 'Proposal / Design Development\nEnd', '3D\'s\nStart', '3D\'s\nEnd',
             'Tender Package Architectural\nStart', 'Tender Package Architectural\nEnd', 'Tender Package MEP\nStart', 'Tender Package MEP\nEnd',
             'BOQ\nStart', 'BOQ\nEnd', 'Tender Status', 'Comparative', 'Working Drawings', 'Site Visit', 'Final Bill', 'Project Closure']
        ];
        
        const body = projectRows.map(p => [
            p.srNo, p.projectName, p.area, p.projectHolder, p.allocationDate,
            p.siteSurveyStart, p.siteSurveyEnd, p.contactStart, p.contactEnd, p.headCountStart, p.headCountEnd,
            p.proposalStart, p.proposalEnd, p.threedStart, p.threedEnd,
            p.tenderArchStart, p.tenderArchEnd, p.tenderMepStart, p.tenderMepEnd,
            p.boqStart, p.boqEnd, p.tenderStatus, p.comparative, p.workingDrawings, p.siteVisit, p.finalBill, p.projectClosure
        ]);

        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 5, cellPadding: 1 },
            headStyles: { fillColor: [45, 95, 51], fontStyle: 'bold' },
        });
        let lastY = (doc as any).autoTable.previous.finalY + 10;
        
        doc.text("Maam Isbah Remarks & Order", 14, lastY);
        lastY += 7;
        doc.text(remarks, 14, lastY);
        lastY += 10;

        doc.text(`Date: ${remarksDate}`, 14, lastY);

        doc.save('ubl_timeline.pdf');
        toast({ title: 'Downloaded', description: 'Timeline has been downloaded as PDF.' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle className="text-center font-headline text-3xl text-primary">UBL Timeline</CardTitle>
                <div className="flex gap-2">
                    <Button onClick={handleSave} variant="outline"><Save className="mr-2 h-4 w-4" /> Save</Button>
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
                        <thead>
                            <tr className="bg-primary/20">
                                <th rowSpan={2} className="border p-1">Sr.No</th>
                                <th rowSpan={2} className="border p-1">Project Name</th>
                                <th rowSpan={2} className="border p-1">Area in Sft</th>
                                <th rowSpan={2} className="border p-1">Project Holder</th>
                                <th rowSpan={2} className="border p-1">Allocation Date / RFP</th>
                                <th colSpan={2} className="border p-1">Site Survey</th>
                                <th colSpan={2} className="border p-1">Contact</th>
                                <th colSpan={2} className="border p-1">Head Count / Requirment</th>
                                <th colSpan={2} className="border p-1">Proposal / Design Development</th>
                                <th colSpan={2} className="border p-1">3D's</th>
                                <th colSpan={2} className="border p-1">Tender Package Architectural</th>
                                <th colSpan={2} className="border p-1">Tender Package MEP</th>
                                <th colSpan={2} className="border p-1">BOQ</th>
                                <th rowSpan={2} className="border p-1">Tender Status</th>
                                <th rowSpan={2} className="border p-1">Comparative</th>
                                <th rowSpan={2} className="border p-1">Working Drawings</th>
                                <th rowSpan={2} className="border p-1">Site Visit</th>
                                <th rowSpan={2} className="border p-1">Final Bill</th>
                                <th rowSpan={2} className="border p-1">Project Closure</th>
                                <th rowSpan={2} className="border p-1">Action</th>
                            </tr>
                            <tr className="bg-primary/10">
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                                <th className="border p-1">Start Date</th><th className="border p-1">End Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectRows.map(row => (
                                <tr key={row.id}>
                                    <td className="border"><Input type="text" value={row.srNo} onChange={e => handleProjectChange(row.id, 'srNo', e.target.value)} className="w-12 text-center" /></td>
                                    <td className="border"><Input type="text" value={row.projectName} onChange={e => handleProjectChange(row.id, 'projectName', e.target.value)} className="min-w-[200px]" /></td>
                                    <td className="border"><Input type="text" value={row.area} onChange={e => handleProjectChange(row.id, 'area', e.target.value)} className="w-24" /></td>
                                    <td className="border"><Input type="text" value={row.projectHolder} onChange={e => handleProjectChange(row.id, 'projectHolder', e.target.value)} className="w-32" /></td>
                                    <td className="border"><Input type="text" value={row.allocationDate} onChange={e => handleProjectChange(row.id, 'allocationDate', e.target.value)} className="w-28" /></td>
                                    <td className="border"><Input type="date" value={row.siteSurveyStart} onChange={e => handleProjectChange(row.id, 'siteSurveyStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.siteSurveyEnd} onChange={e => handleProjectChange(row.id, 'siteSurveyEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.contactStart} onChange={e => handleProjectChange(row.id, 'contactStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.contactEnd} onChange={e => handleProjectChange(row.id, 'contactEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.headCountStart} onChange={e => handleProjectChange(row.id, 'headCountStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.headCountEnd} onChange={e => handleProjectChange(row.id, 'headCountEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.proposalStart} onChange={e => handleProjectChange(row.id, 'proposalStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.proposalEnd} onChange={e => handleProjectChange(row.id, 'proposalEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.threedStart} onChange={e => handleProjectChange(row.id, 'threedStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.threedEnd} onChange={e => handleProjectChange(row.id, 'threedEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.tenderArchStart} onChange={e => handleProjectChange(row.id, 'tenderArchStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.tenderArchEnd} onChange={e => handleProjectChange(row.id, 'tenderArchEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.tenderMepStart} onChange={e => handleProjectChange(row.id, 'tenderMepStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.tenderMepEnd} onChange={e => handleProjectChange(row.id, 'tenderMepEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.boqStart} onChange={e => handleProjectChange(row.id, 'boqStart', e.target.value)} /></td>
                                    <td className="border"><Input type="date" value={row.boqEnd} onChange={e => handleProjectChange(row.id, 'boqEnd', e.target.value)} /></td>
                                    <td className="border"><Input type="text" value={row.tenderStatus} onChange={e => handleProjectChange(row.id, 'tenderStatus', e.target.value)} className="w-24" /></td>
                                    <td className="border"><Input type="text" value={row.comparative} onChange={e => handleProjectChange(row.id, 'comparative', e.target.value)} className="w-24" /></td>
                                    <td className="border"><Input type="text" value={row.workingDrawings} onChange={e => handleProjectChange(row.id, 'workingDrawings', e.target.value)} className="w-24" /></td>
                                    <td className="border"><Input type="text" value={row.siteVisit} onChange={e => handleProjectChange(row.id, 'siteVisit', e.target.value)} className="w-24" /></td>
                                    <td className="border"><Input type="text" value={row.finalBill} onChange={e => handleProjectChange(row.id, 'finalBill', e.target.value)} className="w-24" /></td>
                                    <td className="border"><Input type="text" value={row.projectClosure} onChange={e => handleProjectChange(row.id, 'projectClosure', e.target.value)} className="w-24" /></td>
                                    <td className="border p-1"><Button variant="destructive" size="icon" onClick={() => removeProjectRow(row.id)}><Trash2 className="h-4 w-4" /></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <Button onClick={addProjectRow} size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/>Add Row</Button>
                
                <div className="mt-8">
                    <h3 className="font-bold text-lg mb-2">Maam Isbah Remarks & Order</h3>
                    <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={4} />
                    <Input type="date" value={remarksDate} onChange={e => setRemarksDate(e.target.value)} className="mt-2 w-fit" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function Page() {
  return <UBLTimelineComponent />;
}

    