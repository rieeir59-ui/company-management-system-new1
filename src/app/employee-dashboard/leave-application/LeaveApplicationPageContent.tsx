
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
import { generatePdfForRecord } from '@/lib/pdf-generator';

export default function LeaveApplicationPageContent() {
  const image = PlaceHolderImages.find(p => p.id === 'site-visit');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { firestore } = useFirebase();
  const { addRecord, getRecordById, updateRecord } = useRecords();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');

  const [formState, setFormState] = useState({
    status: 'Full-time',
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRecordLoading, setIsRecordLoading] = useState(!!recordId);

  useEffect(() => {
    if (recordId) {
        const record = getRecordById(recordId);
        setRecordData(record);
        if (record) {
            const leaveDetails = record.data?.find((d:any) => d.category === 'Leave Details')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
            const hrInfo = record.data?.find((d:any) => d.category === 'HR Approval')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};

            setFormState(prev => ({
                ...prev,
                status: record.data?.find((d:any) => d.category === 'Employee Information')?.items.find((i:any) => i.label === 'Status')?.value || 'Full-time',
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
  
  const handleStatusCheckboxChange = (status: 'Full-time' | 'Part-time') => {
    setFormState(prev => ({ ...prev, status }));
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
        position: currentUser.role,
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
            status: 'Full-time', leaveFrom: '', leaveTo: '', returnDate: '', reasonForRequested: [], reason: ''
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
      projectName: `Leave Request - ${currentUser.name} - ${formState.leaveFrom}`,
      data: [
        {
          category: 'Employee Information',
          items: [
            { label: 'Employee Name', value: currentUser.name },
            { label: 'Employee Number', value: currentUser.record },
            { label: 'Department', value: currentUser.departments.join(', ') },
            { label: 'Position', value: currentUser.role },
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
                        <div><Label>Employee Name</Label><p className="font-semibold">{currentUser?.name}</p></div>
                        <div><Label>Employee Number</Label><p className="font-semibold">{currentUser?.record}</p></div>
                        <div><Label>Department</Label><p className="font-semibold">{currentUser?.departments.join(', ')}</p></div>
                        <div><Label>Position</Label><p className="font-semibold">{currentUser?.role}</p></div>
                    </div>
                     <div className="space-y-2">
                        <Label>Status (select one)</Label>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                               <Checkbox id="status_full" checked={formState.status === 'Full-time'} onCheckedChange={(checked) => checked && handleStatusCheckboxChange('Full-time')} />
                                <Label htmlFor="status_full">Full-time</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="status_part" checked={formState.status === 'Part-time'} onCheckedChange={(checked) => checked && handleStatusCheckboxChange('Part-time')} />
                                <Label htmlFor="status_part">Part-time</Label>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Leave Details</h3>
                     <p className="pt-4">I hereby request a leave of absence effective from:</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="leaveFrom" name="leaveFrom" type="date" value={formState.leaveFrom} onChange={(e) => setFormState(s=>({...s, leaveFrom: e.target.value}))} required />
                        <div className="flex items-center gap-2"> to <Input id="leaveTo" name="leaveTo" type="date" value={formState.leaveTo} onChange={(e) => setFormState(s=>({...s, leaveTo: e.target.value}))} required /></div>
                    </div>
                    <div>
                        <p className="font-semibold">Total Days: {totalDays}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="returnDate">I expect to return to work on Date:</Label>
                        <Input id="returnDate" name="returnDate" type="date" value={formState.returnDate} onChange={(e) => setFormState(s=>({...s, returnDate: e.target.value}))} required className="w-fit"/>
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
                        <Textarea id="reason" name="reason" value={formState.reason} onChange={(e) => setFormState(s=>({...s, reason: e.target.value}))} required />
                    </div>
                </div>
                 <div className="mt-8 p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary">HR Department Approval:</h3>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="leave_approved" checked={hrApprovalState.approved} onCheckedChange={(c) => setHrApprovalState(s => ({...s, approved: !!c, denied: !!c ? false: s.denied}))} disabled />
                        <Label htmlFor="leave_approved">LEAVE APPROVED</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="leave_denied" checked={hrApprovalState.denied} onCheckedChange={(c) => setHrApprovalState(s => ({...s, denied: !!c, approved: !!c ? false : s.approved}))} disabled />
                        <Label htmlFor="leave_denied">LEAVE DENIED</Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hr_reason">REASON:</Label>
                        <Textarea id="hr_reason" value={hrApprovalState.reason} onChange={e => setHrApprovalState(s => ({...s, reason: e.target.value}))} disabled/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="hr_approval_date">Date:</Label>
                        <Input id="hr_approval_date" type="date" disabled/>
                    </div>
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="paid_leave" checked={hrApprovalState.paid} onCheckedChange={(c) => setHrApprovalState(s => ({...s, paid: !!c, unpaid: !!c ? false : s.paid}))} disabled />
                            <Label htmlFor="paid_leave">PAID LEAVE</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="unpaid_leave" checked={hrApprovalState.unpaid} onCheckedChange={(c) => setHrApprovalState(s => ({...s, unpaid: !!c, paid: !!c ? false : s.paid}))} disabled />
                            <Label htmlFor="unpaid_leave">UNPAID LEAVE</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between p-6 bg-gray-50 rounded-b-lg">
                <Button type="button" onClick={handleSave} variant="outline" ><Save className="mr-2 h-4 w-4" /> Save Record</Button>
                <div className="flex gap-2">
                    <Button type="button" onClick={() => recordData && generatePdfForRecord(recordData)} variant="outline" ><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
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


    