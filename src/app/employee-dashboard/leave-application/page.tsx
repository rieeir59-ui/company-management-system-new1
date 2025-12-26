
'use client';

import { useState } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { useFirebase } from '@/firebase/provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function LeaveApplicationPage() {
  const image = PlaceHolderImages.find(p => p.id === 'site-visit');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const { firestore } = useFirebase();

  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit a request." });
      return;
    }
    if (!leaveFrom || !leaveTo || !reason) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields." });
        return;
    }

    setIsLoading(true);

    const leaveRequestData = {
        employeeId: currentUser.uid,
        employeeName: currentUser.name,
        department: currentUser.departments.join(', '),
        leaveFrom,
        leaveTo,
        reason,
        status: 'pending',
        requestedAt: serverTimestamp()
    };
    
    try {
        await addDoc(collection(firestore, 'leaveRequests'), leaveRequestData);
        toast({
            title: "Request Sent",
            description: "Your leave request has been sent for approval.",
        });
        // Reset form
        setLeaveFrom('');
        setLeaveTo('');
        setReason('');
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


  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Leave Application"
        description="Apply for leave by filling out the form below."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center text-primary">Leave Request Form</CardTitle>
        </CardHeader>
        <form onSubmit={handleSendRequest}>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Employee Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label>Employee Name</Label>
                        <Input value={currentUser?.name || ''} readOnly />
                        </div>
                        <div className="space-y-2">
                        <Label>Employee Number</Label>
                        <Input value={currentUser?.record || ''} readOnly />
                        </div>
                    </div>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Leave Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="leaveFrom">Leave From</Label>
                            <Input id="leaveFrom" type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="leaveTo">Leave To</Label>
                            <Input id="leaveTo" type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Leave</Label>
                        <Textarea id="reason" placeholder="Please provide a reason for your absence" value={reason} onChange={(e) => setReason(e.target.value)} required />
                    </div>
                </div>
            
            </CardContent>
            <CardFooter className="flex justify-end p-6">
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
