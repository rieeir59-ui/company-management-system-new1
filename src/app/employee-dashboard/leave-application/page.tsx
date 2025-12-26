'use client';

import { useState, useMemo } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Download, CalendarOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useFirebase } from '@/firebase/provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function LeaveApplicationPage() {
  const image = PlaceHolderImages.find(p => p.id === 'site-visit');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { firestore } = useFirebase();

  const [formState, setFormState] = useState({
    leaveType: 'Casual',
    leaveFrom: '',
    leaveTo: '',
    reason: '',
    contactDuringLeave: '',
    workCoveredBy: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (value: string) => {
    setFormState(prev => ({ ...prev, leaveType: value }));
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit a request." });
      return;
    }
    if (!formState.leaveFrom || !formState.leaveTo || !formState.reason) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields." });
        return;
    }

    setIsLoading(true);

    const leaveRequestData = {
        employeeId: currentUser.uid,
        employeeName: currentUser.name,
        employeeRecord: currentUser.record,
        department: currentUser.departments.join(', '),
        ...formState,
        totalDays,
        status: 'pending',
        requestedAt: serverTimestamp()
    };
    
    try {
        const leaveDocRef = await addDoc(collection(firestore, 'leaveRequests'), leaveRequestData);
        
        // Create notification for admin
        await addDoc(collection(firestore, 'notifications'), {
            type: 'leave_request',
            message: `${currentUser.name} has requested for ${totalDays} day(s) of ${formState.leaveType.toLowerCase()} leave.`,
            relatedId: leaveDocRef.id,
            recipientRole: 'admin', // Targeting all admins
            status: 'unread',
            createdAt: serverTimestamp(),
        });
        
        toast({
            title: "Request Sent",
            description: "Your leave request has been sent for approval.",
        });
        // Reset form
        setFormState({
            leaveType: 'Casual', leaveFrom: '', leaveTo: '', reason: '', contactDuringLeave: '', workCoveredBy: ''
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
  
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LEAVE REQUEST FORM', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    const tableBody = [
        ["Employee Name:", currentUser?.name || ''],
        ["Employee Number:", currentUser?.record || ''],
        ["Department:", currentUser?.departments.join(', ') || ''],
        ["Today's Date:", format(new Date(), 'yyyy-MM-dd')],
    ];
    
    (doc as any).autoTable({
        startY: y, theme: 'grid', head: [['Employee Information', '']], body: tableBody
    });
    y = (doc as any).lastAutoTable.finalY + 10;
    
     (doc as any).autoTable({
        startY: y, theme: 'grid', head: [['Leave Details', '']], 
        body: [
            ['Type of Leave:', formState.leaveType],
            ['From:', formState.leaveFrom],
            ['To:', formState.leaveTo],
            ['Total Days:', `${totalDays} Day(s)`],
            ['Reason for Leave:', formState.reason],
            ['Contact during Leave:', formState.contactDuringLeave],
            ['Work will be Covered by:', formState.workCoveredBy],
        ]
    });
    y = (doc as any).lastAutoTable.finalY + 20;
    
    doc.text('______________________', 14, y);
    doc.text('______________________', 120, y);
    y += 5;
    doc.text('Employee Signature', 14, y);
    doc.text('HOD Signature & Date', 120, y);
    y += 20;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FOR HR DEPARTMENT USE ONLY', 14, y);
    y += 10;
    doc.autoTable({ startY: y, theme: 'grid', body: [
        ['Approved / Not Approved', ''],
        ['HR Department', ''],
        ['CEO Signature & Date', ''],
    ]});

    doc.save('leave-request.pdf');
    toast({ title: 'Download Started', description: 'Your leave request PDF is being generated.' });
  };


  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Leave Application"
        description="Apply for leave by filling out the form below."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center text-primary">Leave Request Form</CardTitle>
        </CardHeader>
        <form onSubmit={handleSendRequest}>
            <CardContent className="space-y-8">
                <div className="p-4 border rounded-lg space-y-4">
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
                            <Label>Today's Date</Label>
                            <Input value={format(new Date(), 'yyyy-MM-dd')} readOnly />
                        </div>
                    </div>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                    <div className="space-y-2">
                        <Label>Type of Leave:</Label>
                        <RadioGroup value={formState.leaveType} onValueChange={handleRadioChange} className="flex gap-6">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Annual" id="annual" /><Label htmlFor="annual">Annual</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Casual" id="casual" /><Label htmlFor="casual">Casual</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Sick" id="sick" /><Label htmlFor="sick">Sick</Label></div>
                        </RadioGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="leaveFrom">Leave From</Label>
                            <Input id="leaveFrom" name="leaveFrom" type="date" value={formState.leaveFrom} onChange={handleChange} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="leaveTo">Leave To</Label>
                            <Input id="leaveTo" name="leaveTo" type="date" value={formState.leaveTo} onChange={handleChange} required />
                        </div>
                         <div className="space-y-2">
                            <Label>Total Days</Label>
                            <Input value={`${totalDays} Day(s)`} readOnly />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Leave</Label>
                        <Textarea id="reason" name="reason" placeholder="Please provide a reason for your absence" value={formState.reason} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactDuringLeave">Address/Contact No during leave</Label>
                        <Input id="contactDuringLeave" name="contactDuringLeave" value={formState.contactDuringLeave} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="workCoveredBy">Work will be covered by</Label>
                        <Input id="workCoveredBy" name="workCoveredBy" value={formState.workCoveredBy} onChange={handleChange} />
                    </div>
                </div>
                <div className="text-center p-4 border-t">
                    <p className="font-semibold">____________________</p>
                    <p>Employee Signature</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between p-6">
                <Button type="button" onClick={handleDownloadPdf} variant="outline" ><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                <Button type="submit" disabled={isLoading}>
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? 'Sending...' : 'Send Request'}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
