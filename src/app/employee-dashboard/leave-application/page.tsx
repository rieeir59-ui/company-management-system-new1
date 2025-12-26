
'use client';

import { useState } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useRecords } from '@/context/RecordContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function LeaveApplicationPage() {
  const image = PlaceHolderImages.find(p => p.id === 'site-visit');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { addRecord } = useRecords();

  const [formState, setFormState] = useState({
    status: 'Full-time',
    leaveFrom: '',
    leaveTo: '',
    returnDate: '',
    reasonType: '',
    reasonDetail: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleRadioChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    const dataToSave = {
      fileName: 'Leave Request Form',
      projectName: `Leave for ${currentUser.name}`,
      data: [{
        category: 'Leave Application Details',
        items: [
          { label: 'Employee Name', value: currentUser.name },
          { label: 'Employee Number', value: currentUser.record },
          { label: 'Department', value: currentUser.departments.join(', ') },
          { label: 'Position', value: currentUser.role },
          ...Object.entries(formState).map(([key, value]) => ({
             label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), 
             value
          })),
        ],
      }],
    };
    addRecord(dataToSave as any);
  };

  const handleDownloadPdf = () => {
    if (!currentUser) return;
    const doc = new jsPDF() as jsPDFWithAutoTable;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LEAVE REQUEST FORM', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee to Complete', 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.autoTable({
        startY: y,
        theme: 'plain',
        body: [
            [`Employee Name: ${currentUser.name}`, `Employee Number: ${currentUser.record}`],
            [`Department: ${currentUser.departments.join(', ')}`, `Position: ${currentUser.role}`],
        ]
    });
    y = doc.autoTable.previous.finalY + 5;

    doc.text('Status (select one):', 14, y);
    doc.rect(50, y-3.5, 4, 4);
    if(formState.status === 'Full-time') doc.text('X', 51, y);
    doc.text('Full-time', 55, y);
    doc.rect(80, y-3.5, 4, 4);
    if(formState.status === 'Part-time') doc.text('X', 81, y);
    doc.text('Part-time', 85, y);
    y+= 10;

    doc.text(`I hereby request a leave of absence effective from ( ${formState.leaveFrom} ) to ( ${formState.leaveTo} )`, 14, y);
    y += 7;
    doc.text(`I expect to return to work on Date: ( ${formState.returnDate} )`, 14, y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Reason for Requested:', 14, y);
    y += 8;
    
    const reasons = ['SICK LEAVE', 'CASUAL LEAVE', 'ANNUAL LEAVE'];
    reasons.forEach(reason => {
        doc.rect(14, y - 3.5, 4, 4);
        if(formState.reasonType === reason) doc.text('X', 15, y);
        doc.text(reason, 20, y);
        y += 7;
    });

    doc.text(`REASON: ${formState.reasonDetail}`, 14, y);
    y += 20;
    
    doc.setFont('helvetica', 'bold');
    doc.text('HR Department Approval:', 14, y);
    y += 8;
    doc.rect(14, y - 3.5, 4, 4);
    doc.text('LEAVE APPROVED', 20, y);
    y += 7;
    doc.rect(14, y - 3.5, 4, 4);
    doc.text('LEAVE DENIED', 20, y);
    y += 7;
    doc.text('REASON: ________________________________________________________________', 14, y);
    y += 20;

    doc.rect(14, y - 3.5, 4, 4);
    doc.text('PAID LEAVE', 20, y);
    doc.rect(60, y - 3.5, 4, 4);
    doc.text('UNPAID LEAVE', 66, y);
    y += 20;

    doc.text('COMPANY CEO: SIGNATURE: ____________________', 14, y);
    doc.text('DATE: ____________________', 120, y);

    doc.save('Leave_Request_Form.pdf');
    toast({ title: 'Download Started', description: 'Your PDF is being generated.' });
  };

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Leave Application"
        description="Apply for leave by filling out the form below."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center text-primary">Leave Request Form</CardTitle>
        </CardHeader>
        <CardContent className="max-w-3xl mx-auto space-y-6">
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Employee to Complete</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee Name</Label>
                      <Input value={currentUser?.name || ''} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Employee Number</Label>
                      <Input value={currentUser?.record || ''} readOnly />
                    </div>
                     <div className="space-y-2">
                      <Label>Department</Label>
                      <Input value={currentUser?.departments.join(', ') || ''} readOnly />
                    </div>
                     <div className="space-y-2">
                      <Label>Position</Label>
                      <Input value={currentUser?.role || ''} readOnly />
                    </div>
                </div>
                 <div className="space-y-2 mt-4">
                    <Label>Status (select one)</Label>
                    <RadioGroup name="status" onValueChange={(v) => handleRadioChange('status', v)} value={formState.status} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Full-time" id="status_full" /><Label htmlFor="status_full">Full-time</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Part-time" id="status_part" /><Label htmlFor="status_part">Part-time</Label></div>
                    </RadioGroup>
                </div>
                <div className="mt-4">
                    <p>I hereby request a leave of absence effective from</p>
                    <div className="flex items-center gap-4 mt-2">
                        <Input name="leaveFrom" type="date" value={formState.leaveFrom} onChange={handleChange} />
                        <span className="font-semibold">to</span>
                        <Input name="leaveTo" type="date" value={formState.leaveTo} onChange={handleChange} />
                    </div>
                </div>
                 <div className="mt-4">
                    <Label htmlFor="returnDate">I expect to return to work on Date:</Label>
                    <Input id="returnDate" name="returnDate" type="date" value={formState.returnDate} onChange={handleChange} />
                </div>
            </div>

            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Reason for Requested:</h3>
                <RadioGroup name="reasonType" onValueChange={(v) => handleRadioChange('reasonType', v)} value={formState.reasonType} className="space-y-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="SICK LEAVE" id="reason_sick" /><Label htmlFor="reason_sick">SICK LEAVE</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="CASUAL LEAVE" id="reason_casual" /><Label htmlFor="reason_casual">CASUAL LEAVE</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="ANNUAL LEAVE" id="reason_annual" /><Label htmlFor="reason_annual">ANNUAL LEAVE</Label></div>
                </RadioGroup>
                <div className="mt-4">
                    <Label htmlFor="reasonDetail">REASON:</Label>
                    <Textarea id="reasonDetail" name="reasonDetail" value={formState.reasonDetail} onChange={handleChange} />
                </div>
            </div>
          
        </CardContent>
        <CardFooter className="flex justify-end gap-4 p-6">
            <Button onClick={handleSave} variant="outline"><Save className="mr-2 h-4 w-4" /> Save Record</Button>
            <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
