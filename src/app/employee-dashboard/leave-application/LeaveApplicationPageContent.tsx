
'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Download, Save, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useFirebase } from '@/firebase/provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Checkbox } from '@/components/ui/checkbox';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useRecords } from '@/context/RecordContext';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: {
    finalY: number;
  };
}

export default function LeaveApplicationPageContent() {
  const image = PlaceHolderImages.find(p => p.id === 'site-visit');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { firestore } = useFirebase();
  const { addRecord, getRecordById, updateRecord } = useRecords();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');

  const [formState, setFormState] = useState({
    employeeName: '',
    employeeNumber: '',
    department: '',
    position: '',
    status: '',
    leaveFrom: '',
    leaveTo: '',
    returnDate: '',
    reasonForRequested: [] as string[],
    reason: '',
  });
  
  const [recordData, setRecordData] = useState<any>(null);

  const [hrApprovalState, setHrApprovalState] = useState({
      approved: false,
      denied: false,
      reason: '',
      paid: false,
      unpaid: false,
      approvalDate: ''
  });
  
  const isAdmin = useMemo(() => currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer', 'hr'].includes(d)), [currentUser]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRecordLoading, setIsRecordLoading] = useState(!!recordId);

  useEffect(() => {
    if (recordId) {
        const record = getRecordById(recordId);
        setRecordData(record);
        if (record) {
            const employeeInfo = record.data?.find((d:any) => d.category === 'Employee Information')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
            const leaveDetails = record.data?.find((d:any) => d.category === 'Leave Details')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
            const hrInfo = record.data?.find((d:any) => d.category === 'HR Approval')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};

            setFormState(prev => ({
                ...prev,
                employeeName: employeeInfo['Employee Name'] || '',
                employeeNumber: employeeInfo['Employee Number'] || '',
                department: employeeInfo['Department'] || '',
                position: employeeInfo['Position'] || '',
                status: employeeInfo['Status'] || '',
                leaveFrom: leaveDetails['Leave From'] || '',
                leaveTo: leaveDetails['Leave To'] || '',
                returnDate: leaveDetails['Return Date'] || '',
                reasonForRequested: leaveDetails['Leave Type']?.split(', ') || [],
                reason: leaveDetails['Reason'] || '',
            }));

            setHrApprovalState({
                approved: hrInfo['Approved'] === 'true',
                denied: hrInfo['Denied'] === 'true',
                reason: hrInfo['Reason'] || '',
                paid: hrInfo['Paid Leave'] === 'true',
                unpaid: hrInfo['Unpaid Leave'] === 'true',
                approvalDate: hrInfo['Approval Date'] || '',
            });
        }
    }
    setIsRecordLoading(false);
  }, [recordId, getRecordById]);


  const totalDays = useMemo(() => {
    if (formState.leaveFrom && formState.leaveTo) {
      const from = parseISO(formState.leaveFrom);
      const to = parseISO(formState.leaveTo);
      if (isValid(from) && isValid(to) && to >= from) {
        return differenceInDays(to, from) + 1;
      }
    }
    return 0;
  }, [formState.leaveFrom, formState.leaveTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleReasonCheckboxChange = (reason: string, checked: boolean) => {
    setFormState(prev => {
      const currentReasons = prev.reasonForRequested;
      if (checked) {
        return { ...prev, reasonForRequested: [...currentReasons, reason] };
      } else {
        return { ...prev, reasonForRequested: currentReasons.filter(r => r !== reason) };
      }
    });
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit a request." });
      return;
    }
    if (!formState.leaveFrom || !formState.leaveTo || formState.reasonForRequested.length === 0 || !formState.reason) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields." });
        return;
    }

    setIsLoading(true);

    const leaveRequestData = {
        employeeId: currentUser.uid,
        employeeName: formState.employeeName,
        employeeRecord: formState.employeeNumber,
        department: formState.department,
        position: formState.position,
        status: formState.status,
        leaveType: formState.reasonForRequested.join(', '),
        leaveFrom: formState.leaveFrom,
        leaveTo: formState.leaveTo,
        returnDate: formState.returnDate,
        reason: formState.reason,
        totalDays,
        requestStatus: 'pending', 
        requestedAt: serverTimestamp()
    };
    
    try {
        const leaveDocRef = await addDoc(collection(firestore, 'leaveRequests'), leaveRequestData);
        
        await addDoc(collection(firestore, 'notifications'), {
            type: 'leave_request',
            message: `${formState.employeeName} has requested for ${totalDays} day(s) of leave.`,
            relatedId: leaveDocRef.id,
            recipientRole: 'admin',
            status: 'unread',
            createdAt: serverTimestamp(),
        });
        
        toast({
            title: "Request Sent",
            description: "Your leave request has been sent for approval.",
        });
        
        setFormState({
            employeeName: '',
            employeeNumber: '',
            department: '',
            position: '',
            status: '', leaveFrom: '', leaveTo: '', returnDate: '', reasonForRequested: [], reason: ''
        });

    } catch (serverError) {
        console.error("Error sending leave request:", serverError);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `leaveRequests`,
            operation: 'create',
            requestResourceData: leaveRequestData
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const dataToSave = {
      fileName: 'Leave Request Form',
      projectName: `Leave Request - ${formState.employeeName || 'Unknown'} - ${formState.leaveFrom}`,
      data: [
        {
          category: 'Employee Information',
          items: [
            { label: 'Employee Name', value: formState.employeeName },
            { label: 'Employee Number', value: formState.employeeNumber },
            { label: 'Department', value: formState.department },
            { label: 'Position', value: formState.position },
            { label: 'Status', value: formState.status },
          ]
        },
        {
          category: 'Leave Details',
          items: [
            { label: 'Leave From', value: formState.leaveFrom },
            { label: 'Leave To', value: formState.leaveTo },
            { label: 'Return Date', value: formState.returnDate },
            { label: 'Total Days', value: totalDays.toString() },
            { label: 'Leave Type', value: formState.reasonForRequested.join(', ') },
            { label: 'Reason', value: formState.reason },
          ]
        },
        {
          category: 'HR Approval',
          items: [
            { label: 'Approved', value: hrApprovalState.approved.toString() },
            { label: 'Denied', value: hrApprovalState.denied.toString() },
            { label: 'Reason', value: hrApprovalState.reason },
            { label: 'Paid Leave', value: hrApprovalState.paid.toString() },
            { label: 'Unpaid Leave', value: hrApprovalState.unpaid.toString() },
            { label: 'Approval Date', value: hrApprovalState.approvalDate },
          ]
        }
      ]
    };
    if (recordId) {
        updateRecord(recordId, dataToSave);
    } else {
        addRecord(dataToSave as any);
    }
  };
  
    const handleDownloadPdf = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        let yPos = 15;

        const drawCheckbox = (x: number, y: number, checked: boolean) => {
            doc.setLineWidth(0.2);
            doc.rect(x, y - 3.5, 4, 4);
            if (checked) {
                doc.setDrawColor(0);
                doc.line(x + 0.5, y - 1.5, x + 1.5, y);
                doc.line(x + 1.5, y, x + 3.5, y - 3);
            }
        };

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('LEAVE REQUEST FORM', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        doc.setFontSize(10);
        
        const addSectionHeader = (text: string) => {
            doc.setFont('helvetica', 'bold');
            doc.text(text, 14, yPos);
            yPos += 7;
            doc.setFont('helvetica', 'normal');
        };

        addSectionHeader('Employee Information');
        doc.autoTable({
            startY: yPos, theme: 'grid', showHead: false,
            body: [
                [`Employee Name: ${formState.employeeName}`, `Employee Number: ${formState.employeeNumber}`],
                [`Department: ${formState.department}`, `Position: ${formState.position}`],
                [{content: `Status: ${formState.status}`, colSpan: 2}]
            ]
        });
        yPos = doc.autoTable.previous.finalY + 10;
        
        addSectionHeader('Leave Details');
        const fromDate = formState.leaveFrom ? formState.leaveFrom : '( ____________ )';
        const toDate = formState.leaveTo ? formState.leaveTo : '( ____________ )';
        const returnDate = formState.returnDate ? formState.returnDate : '( ____________ )';
        doc.text(`I hereby request a leave of absence effective from ${fromDate} to ${toDate}`, 14, yPos);
        yPos += 7;
        doc.text(`Total Days: ${totalDays}`, 14, yPos);
        yPos += 7;
        doc.text(`I expect to return to work on Date: ${returnDate}`, 14, yPos);
        yPos += 10;
        
        addSectionHeader('Reason for Requested:');
        drawCheckbox(14, yPos, formState.reasonForRequested.includes('Sick Leave'));
        doc.text('SICK LEAVE', 20, yPos);
        yPos += 7;
        drawCheckbox(14, yPos, formState.reasonForRequested.includes('Casual Leave'));
        doc.text('CASUAL LEAVE', 20, yPos);
        yPos += 7;
        drawCheckbox(14, yPos, formState.reasonForRequested.includes('Annual Leave'));
        doc.text('ANNUAL LEAVE', 20, yPos);
        yPos += 10;
        
        doc.text('REASON:', 14, yPos);
        yPos += 5;
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos);
        if (formState.reason) {
            doc.text(formState.reason, 16, yPos - 1);
        }
        yPos += 15;
        
        addSectionHeader('HR Department Approval:');
        drawCheckbox(14, yPos, hrApprovalState.approved);
        doc.text('LEAVE APPROVED', 20, yPos);
        yPos += 7;
        drawCheckbox(14, yPos, hrApprovalState.denied);
        doc.text('LEAVE DENIED', 20, yPos);
        yPos += 10;
        
        doc.text('REASON:', 14, yPos);
        yPos += 5;
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos);
        if (hrApprovalState.reason) {
            doc.text(hrApprovalState.reason, 16, yPos-1);
        }
        yPos += 10;
        
        doc.text(`Date: ${hrApprovalState.approvalDate || '______________'}`, 14, yPos);
        yPos += 10;
        
        drawCheckbox(14, yPos, hrApprovalState.paid);
        doc.text('PAID LEAVE', 20, yPos);
        drawCheckbox(60, yPos, hrApprovalState.unpaid);
        doc.text('UNPAID LEAVE', 66, yPos);
        yPos += 20;

        doc.text('COMPANY CEO: ____________________', 14, yPos);
        doc.text('DATE: ____________________', 140, yPos);

        doc.save('Leave_Request_Form.pdf');
        toast({ title: 'Download Started', description: 'Your Leave Request Form is being generated.' });
  };
  
  if (isRecordLoading) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Leave Application"
        description="Apply for leave by filling out the form below."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
            <p className="font-bold">ISBAH HASSAN & ASSOCIATES</p>
            <p className="text-sm text-muted-foreground">architecture | interiors</p>
            <CardTitle className="font-headline text-2xl text-primary pt-4">LEAVE REQUEST FORM</CardTitle>
        </CardHeader>
        <form onSubmit={handleSendRequest}>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Employee Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employeeName">Employee Name</Label>
                          <Input id="employeeName" name="employeeName" value={formState.employeeName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employeeNumber">Employee Number</Label>
                          <Input id="employeeNumber" name="employeeNumber" value={formState.employeeNumber} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input id="department" name="department" value={formState.department} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position">Position</Label>
                          <Input id="position" name="position" value={formState.position} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input id="status" name="status" value={formState.status} onChange={handleInputChange} placeholder="e.g. Full-time, Part-time" />
                    </div>
                </div>
                 <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Leave Details</h3>
                     <p className="pt-4">I hereby request a leave of absence effective from:</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="leaveFrom" name="leaveFrom" type="date" value={formState.leaveFrom} onChange={handleInputChange} required />
                        <div className="flex items-center gap-2"> to <Input id="leaveTo" name="leaveTo" type="date" value={formState.leaveTo} onChange={handleInputChange} required /></div>
                    </div>
                    <div>
                        <p className="font-semibold">Total Days: {totalDays}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="returnDate">I expect to return to work on Date:</Label>
                        <Input id="returnDate" name="returnDate" type="date" value={formState.returnDate} onChange={handleInputChange} required className="w-fit"/>
                    </div>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                    <div className="space-y-2">
                        <Label className="font-semibold text-lg text-primary">Reason for Requested:</Label>
                        <div className="flex flex-col space-y-2 pt-2">
                            <div className="flex items-center space-x-2"><Checkbox id="sick" onCheckedChange={(c) => handleReasonCheckboxChange('Sick Leave', !!c)} checked={formState.reasonForRequested.includes('Sick Leave')} /><Label htmlFor="sick">SICK LEAVE</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="casual" onCheckedChange={(c) => handleReasonCheckboxChange('Casual Leave', !!c)} checked={formState.reasonForRequested.includes('Casual Leave')} /><Label htmlFor="casual">CASUAL LEAVE</Label></div>
                            <div className="flex items-center space-x-2"><Checkbox id="annual" onCheckedChange={(c) => handleReasonCheckboxChange('Annual Leave', !!c)} checked={formState.reasonForRequested.includes('Annual Leave')} /><Label htmlFor="annual">ANNUAL LEAVE</Label></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="font-semibold text-lg text-primary">REASON:</Label>
                        <Textarea id="reason" name="reason" value={formState.reason} onChange={handleInputChange} required />
                    </div>
                </div>
                 <div className="mt-8 p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary">HR Department Approval:</h3>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="leave_approved" checked={hrApprovalState.approved} onCheckedChange={(c) => setHrApprovalState(s => ({...s, approved: !!c, denied: !!c ? false: s.denied}))} disabled={!isAdmin} />
                        <Label htmlFor="leave_approved">LEAVE APPROVED</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="leave_denied" checked={hrApprovalState.denied} onCheckedChange={(c) => setHrApprovalState(s => ({...s, denied: !!c, approved: !!c ? false : s.approved}))} disabled={!isAdmin} />
                        <Label htmlFor="leave_denied">LEAVE DENIED</Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hr_reason">REASON:</Label>
                        <Textarea id="hr_reason" value={hrApprovalState.reason} onChange={e => setHrApprovalState(s => ({...s, reason: e.target.value}))} disabled={!isAdmin}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="hr_approval_date">Date:</Label>
                        <Input id="hr_approval_date" type="date" value={hrApprovalState.approvalDate} onChange={(e) => setHrApprovalState(s => ({...s, approvalDate: e.target.value}))} disabled={!isAdmin}/>
                    </div>
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="paid_leave" checked={hrApprovalState.paid} onCheckedChange={(c) => setHrApprovalState(s => ({...s, paid: !!c, unpaid: !!c ? false : s.paid}))} disabled={!isAdmin} />
                            <Label htmlFor="paid_leave">PAID LEAVE</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="unpaid_leave" checked={hrApprovalState.unpaid} onCheckedChange={(c) => setHrApprovalState(s => ({...s, unpaid: !!c, paid: !!c ? false : s.paid}))} disabled={!isAdmin} />
                            <Label htmlFor="unpaid_leave">UNPAID LEAVE</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between p-6 bg-gray-50 rounded-b-lg">
                <Button type="button" onClick={handleSave} variant="outline" ><Save className="mr-2 h-4 w-4" /> Save Record</Button>
                <div className="flex gap-2">
                    <Button type="button" onClick={handleDownloadPdf} variant="outline" ><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (recordId ? <Edit className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />) }
                        {recordId ? 'Update Request' : 'Send Request'}
                    </Button>
                </div>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
