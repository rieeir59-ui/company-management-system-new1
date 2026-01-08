
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRecords } from '@/context/RecordContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';


export default function ArchitectsFieldReportPage() {
    const { toast } = useToast();
    const { addRecord } = useRecords();
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [projectName, setProjectName] = useState('');

    const [formState, setFormState] = useState({
        project: '',
        contract: '',
        date: new Date().toISOString().split('T')[0],
        weather: '',
        completion_pct: '',
        report_no: '',
        architect_project_no: '',
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        temp_range: '',
        conformance: '',
        work_in_progress: '',
        present_at_site: '',
        observations: '',
        items_to_verify: '',
        action_required: '',
        attachments: '',
        report_by: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
         if (id === 'project') {
            setProjectName(value);
        }
    };

    const handleSave = async () => {
         const recordData = {
            fileName: "Architect's Field Report",
            projectName: projectName || `Field Report ${formState.report_no}`,
            data: [{
                category: "Report Details",
                items: Object.entries(formState).map(([key, value]) => ({
                    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: value || 'N/A'
                }))
            }],
        };

        try {
            await addRecord(recordData as any);
            setIsSaveOpen(false);
        } catch (error) {
            // error is handled by the context
        }
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        let yPos = 20;
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const footerText = "Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522 , info@isbahhassan.com , www.isbahhassan.com";

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ISBAH HASSAN & ASSOCIATES', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFontSize(8);
        doc.text('ARCHITECTURAL - ENGINEERING - CONSTRUCTIONS', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("ARCHITECT'S FIELD REPORT", doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        doc.setFontSize(10);
        (doc as any).autoTable({
            startY: yPos,
            theme: 'plain',
            body: [
                [`Project: ${formState.project}`, `Field Report No. ${formState.report_no}`],
                [`Contract: ${formState.contract}`, `Architects Project No: ${formState.architect_project_no}`],
                [`Date: ${formState.date}`, `Time: ${formState.time}`],
                [`Weather: ${formState.weather}`, `Tem. Range: ${formState.temp_range}`],
                [`Est. % of Completion: ${formState.completion_pct}`, `Conformance with Schedule: ${formState.conformance}`],
            ],
            styles: { cellPadding: 1 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
        
        const addTextAreaContent = (label: string, value: string) => {
            if (yPos > 260) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text(label, 14, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const splitText = doc.splitTextToSize(value, doc.internal.pageSize.width - 28);
            doc.text(splitText, 14, yPos);
            yPos += splitText.length * 5 + 5;
        };

        addTextAreaContent('Work in Progress:', formState.work_in_progress);
        addTextAreaContent('Present at Site:', formState.present_at_site);
        addTextAreaContent('Observations:', formState.observations);
        addTextAreaContent('Items to Verify:', formState.items_to_verify);
        addTextAreaContent('Information or Action Required:', formState.action_required);
        addTextAreaContent('Attachments:', formState.attachments);

        yPos += 10;
        if (yPos > 260) { doc.addPage(); yPos = 20; }
        doc.text(`Report By: ${formState.report_by}`, 14, yPos);
        yPos += 20;

        const signatureLine = (label: string, x: number) => {
            doc.line(x, yPos, x + 40, yPos);
            yPos += 5;
            doc.text(label, x + 15, yPos);
            yPos -= 5;
        }

        const signatures = ['Owner', 'Architect', 'Contractor', 'Field', 'Other'];
        signatures.forEach((label, index) => {
            if (index > 0 && index % 3 === 0) {
                yPos += 20;
            }
            signatureLine(label, 14 + (index % 3) * 60);
        })
        
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save('architects-field-report.pdf');
        toast({ title: 'Download Started', description: 'Your PDF is being generated.' });
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <p className="font-bold text-primary">ISBAH HASSAN & ASSOCIATES</p>
                <p className="text-sm text-muted-foreground">ARCHITECTURAL - ENGINEERING - CONSTRUCTIONS</p>
                <CardTitle className="font-headline text-3xl text-primary pt-4">Architect's Field Report</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-lg">
                        <div><Label htmlFor="project">Project</Label><Input id="project" value={formState.project} onChange={handleChange} /></div>
                        <div><Label htmlFor="report_no">Field Report No.</Label><Input id="report_no" value={formState.report_no} onChange={handleChange} /></div>
                        <div><Label htmlFor="contract">Contract</Label><Input id="contract" value={formState.contract} onChange={handleChange} /></div>
                        <div><Label htmlFor="architect_project_no">Architects Project No</Label><Input id="architect_project_no" value={formState.architect_project_no} onChange={handleChange} /></div>
                        <div><Label htmlFor="date">Date</Label><Input id="date" type="date" value={formState.date} onChange={handleChange} /></div>
                        <div><Label htmlFor="time">Time</Label><Input id="time" type="time" value={formState.time} onChange={handleChange} /></div>
                        <div><Label htmlFor="weather">Weather</Label><Input id="weather" value={formState.weather} onChange={handleChange} /></div>
                        <div><Label htmlFor="temp_range">Tem. Range</Label><Input id="temp_range" value={formState.temp_range} onChange={handleChange} /></div>
                        <div><Label htmlFor="completion_pct">Est. % of Completion</Label><Input id="completion_pct" value={formState.completion_pct} onChange={handleChange} /></div>
                        <div><Label htmlFor="conformance">Conformance with Schedule</Label><Input id="conformance" value={formState.conformance} onChange={handleChange} /></div>
                    </div>

                    <div className="space-y-6">
                        <div><Label htmlFor="work_in_progress">Work in Progress:</Label><Textarea id="work_in_progress" rows={3} value={formState.work_in_progress} onChange={handleChange} /></div>
                        <div><Label htmlFor="present_at_site">Present at Site:</Label><Textarea id="present_at_site" rows={2} value={formState.present_at_site} onChange={handleChange} /></div>
                        <div><Label htmlFor="observations">Observations:</Label><Textarea id="observations" rows={4} value={formState.observations} onChange={handleChange} /></div>
                        <div><Label htmlFor="items_to_verify">Items to Verify:</Label><Textarea id="items_to_verify" rows={3} value={formState.items_to_verify} onChange={handleChange} /></div>
                        <div><Label htmlFor="action_required">Information or Action Required:</Label><Textarea id="action_required" rows={3} value={formState.action_required} onChange={handleChange} /></div>
                        <div><Label htmlFor="attachments">Attachments:</Label><Textarea id="attachments" rows={2} value={formState.attachments} onChange={handleChange} /></div>
                        <div><Label htmlFor="report_by">Report By:</Label><Input id="report_by" value={formState.report_by} onChange={handleChange} /></div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-16 pt-8 border-t">
                         <p className="text-muted-foreground">Signatures:</p>
                        <div className="flex justify-end gap-4">
                           <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button"><Save className="mr-2 h-4 w-4" /> Save Record</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Save Record</DialogTitle>
                                        <DialogDescription>Please provide a name for this record.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        <Label htmlFor="recordName">Project Name</Label>
                                        <Input id="recordName" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button onClick={handleSave}>Save</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button type="button" onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
