
'use client';

import { useState } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useRecords } from '@/context/RecordContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function LeaveApplicationPage() {
  const image = PlaceHolderImages.find(p => p.id === 'site-visit');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { addRecord } = useRecords();

  const [formState, setFormState] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (value: string) => {
    setFormState(prev => ({ ...prev, leaveType: value }));
  };

  const handleSave = () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    const dataToSave = {
      fileName: 'Leave Application',
      projectName: `Leave for ${currentUser.name}`,
      data: [{
        category: 'Leave Application Details',
        items: [
          { label: 'Employee Name', value: currentUser.name },
          { label: 'Department', value: currentUser.departments.join(', ') },
          { label: 'Leave Type', value: formState.leaveType },
          { label: 'Start Date', value: formState.startDate },
          { label: 'End Date', value: formState.endDate },
          { label: 'Reason', value: formState.reason },
        ],
      }],
    };
    addRecord(dataToSave as any);
  };

  const handleDownloadPdf = () => {
    if (!currentUser) return;
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(18);
    doc.text('Leave Application Form', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const bodyData = [
        ['Employee Name', currentUser.name],
        ['Department', currentUser.departments.join(', ')],
        ['Leave Type', formState.leaveType],
        ['Start Date', formState.startDate],
        ['End Date', formState.endDate],
        ['Reason', formState.reason],
    ];

    doc.autoTable({
        startY: 30,
        head: [['Field', 'Information']],
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [45, 95, 51] },
    });

    doc.save('leave-application.pdf');
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
          <CardTitle>Leave Application Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee Name</Label>
              <Input value={currentUser?.name || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={currentUser?.departments.join(', ') || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaveType">Type of Leave</Label>
              <Select onValueChange={handleSelectChange} value={formState.leaveType}>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Annual">Annual Leave</SelectItem>
                  <SelectItem value="Maternity">Maternity Leave</SelectItem>
                  <SelectItem value="Paternity">Paternity Leave</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" value={formState.startDate} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" value={formState.endDate} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave</Label>
            <Textarea id="reason" name="reason" value={formState.reason} onChange={handleChange} rows={5} />
          </div>
          <div className="flex justify-end gap-4">
            <Button onClick={handleSave} variant="outline"><Save className="mr-2 h-4 w-4" /> Save Record</Button>
            <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
