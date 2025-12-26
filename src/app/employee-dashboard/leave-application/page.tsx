
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
import { Checkbox } from '@/components/ui/checkbox';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function LeaveApplicationPage() {
  const image = PlaceHolderImages.find(p => p.id === 'site-visit');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { firestore } = useFirebase();

  const [formState, setFormState] = useState({
    position: '',
    status: 'Full-time',
    leaveFrom: '',
    leaveTo: '',
    returnDate: '',
    reasonForRequested: [] as string[],
    reason: '',
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
        employeeName: currentUser.name,
        employeeRecord: currentUser.record,
        department: currentUser.departments.join(', '),
        position: formState.position,
        status: formState.status,
        leaveFrom: formState.leaveFrom,
        leaveTo: formState.leaveTo,
        returnDate: formState.returnDate,
        reasonForRequested: formState.reasonForRequested.join(', '),
        reason: formState.reason,
        totalDays,
        requestStatus: 'pending', // 'pending', 'approved', 'denied'
        requestedAt: serverTimestamp()
    };
    
    try {
        const leaveDocRef = await addDoc(collection(firestore, 'leaveRequests'), leaveRequestData);
        
        await addDoc(collection(firestore, 'notifications'), {
            type: 'leave_request',
            message: `${currentUser.name} has requested for ${totalDays} day(s) of leave.`,
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
            position: '', status: 'Full-time', leaveFrom: '', leaveTo: '', returnDate: '', reasonForRequested: [], reason: ''
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LEAVE REQUEST FORM', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    
    const addSectionHeader = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(text, 14, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
    };
    
    addSectionHeader('Employee to Complete');
    doc.autoTable({
        startY: y, theme: 'grid', showHead: false,
        body: [
            [`Employee Name: ${currentUser?.name || ''}`, `Employee Number: ${currentUser?.record || ''}`],
            [`Department: ${currentUser?.departments.join(', ') || ''}`, `Position: ${formState.position}`],
        ]
    });
    y = (doc as any).autoTable.previous.finalY + 5;
    
    doc.text(`Status (select one):`, 14, y);
    doc.rect(50, y-3.5, 4, 4);
    if(formState.status === 'Full-time') doc.text('X', 51, y);
    doc.text('Full-time', 55, y);
    doc.rect(80, y-3.5, 4, 4);
    if(formState.status === 'Part-time') doc.text('X', 81, y);
    doc.text('Part-time', 85, y);
    y += 10;
    
    doc.text(`I hereby request a leave of absence effective from (${formState.leaveFrom}) to (${formState.leaveTo})`, 14, y);
    y += 7;
    doc.text(`I expect to return to work on Date: (${formState.returnDate})`, 14, y);
    y += 10;
    
    addSectionHeader('Reason for Requested:');
    doc.rect(14, y-3.5, 4, 4);
    if(formState.reasonForRequested.includes('Sick Leave')) doc.text('X', 15, y);
    doc.text('SICK LEAVE', 20, y);
    y += 7;
    doc.rect(14, y-3.5, 4, 4);
    if(formState.reasonForRequested.includes('Casual Leave')) doc.text('X', 15, y);
    doc.text('CASUAL LEAVE', 20, y);
    y += 7;
    doc.rect(14, y-3.5, 4, 4);
    if(formState.reasonForRequested.includes('Annual Leave')) doc.text('X', 15, y);
    doc.text('ANNUAL LEAVE', 20, y);
    y += 10;
    
    doc.text('REASON:', 14, y);
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    doc.text(formState.reason, 16, y-1);
    y += 15;
    
    addSectionHeader('HR Department Approval:');
    doc.rect(14, y-3.5, 4, 4);
    doc.text('LEAVE APPROVED', 20, y);
    y += 7;
    doc.rect(14, y-3.5, 4, 4);
    doc.text('LEAVE DENIED', 20, y);
    y += 10;
    
    doc.text('REASON:', 14, y);
    y += 5;
    doc.line(14, y, 196, y);
    y += 15;

    doc.rect(14, y-3.5, 4, 4);
    doc.text('PAID LEAVE', 20, y);
    doc.rect(60, y-3.5, 4, 4);
    doc.text('UNPAID LEAVE', 66, y);
    y += 20;

    doc.text('COMPANY CEO: SIGNATURE', 14, y);
    doc.text('DATE:', 150, y);
    y += 5;
    doc.line(14, y, 90, y);
    doc.line(160, y, 196, y);

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
        <CardHeader className="text-center">
            <p className="font-bold">ISBAH HASSAN & ASSOCIATES</p>
            <p className="text-sm text-muted-foreground">architecture | interiors</p>
            <CardTitle className="font-headline text-2xl text-primary pt-4">LEAVE REQUEST FORM</CardTitle>
        </CardHeader>
        <form onSubmit={handleSendRequest}>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Employee to Complete</h3>
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
                            <Label htmlFor="position">Position</Label>
                            <Input id="position" name="position" value={formState.position} onChange={handleChange} required/>
                        </div>
                         <div className="space-y-2 md:col-span-2">
                            <Label>Status (select one):</Label>
                            <RadioGroup value={formState.status} onValueChange={(v) => setFormState(p => ({...p, status: v}))} className="flex gap-6 pt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Full-time" id="full-time" /><Label htmlFor="full-time">Full-time</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Part-time" id="part-time" /><Label htmlFor="part-time">Part-time</Label></div>
                            </RadioGroup>
                        </div>
                    </div>
                     <p className="pt-4">I hereby request a leave of absence effective from:</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="leaveFrom" name="leaveFrom" type="date" value={formState.leaveFrom} onChange={handleChange} required />
                        <div className="flex items-center gap-2"> to <Input id="leaveTo" name="leaveTo" type="date" value={formState.leaveTo} onChange={handleChange} required /></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="returnDate">I expect to return to work on Date:</Label>
                        <Input id="returnDate" name="returnDate" type="date" value={formState.returnDate} onChange={handleChange} required className="w-fit"/>
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
                        <Textarea id="reason" name="reason" value={formState.reason} onChange={handleChange} required />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between p-6 bg-gray-50 rounded-b-lg">
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
