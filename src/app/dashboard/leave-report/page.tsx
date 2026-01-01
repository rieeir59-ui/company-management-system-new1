
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useLeaveRequests, type LeaveRequest } from '@/hooks/use-leave-requests';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useCurrentUser } from '@/context/UserContext';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
}

export default function LeaveReportPage() {
    const { leaveRequests, isLoading } = useLeaveRequests();
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { user: currentUser } = useCurrentUser();
    const isAdmin = currentUser?.departments.some(d => ['admin', 'ceo', 'software-engineer', 'hr'].includes(d));

    const handleStatusChange = async (requestId: string, newStatus: 'approved' | 'denied') => {
        if (!firestore || !isAdmin) {
            toast({ variant: 'destructive', title: 'Permission Denied' });
            return;
        }

        const requestRef = doc(firestore, 'leaveRequests', requestId);
        const request = leaveRequests.find(r => r.id === requestId);

        try {
            await updateDoc(requestRef, { requestStatus: newStatus });

            // Send notification to the employee
            if (request) {
                 await addDoc(collection(firestore, 'notifications'), {
                    type: 'leave_status',
                    message: `Your leave request for ${request.leaveFrom} has been ${newStatus}.`,
                    relatedId: requestId,
                    recipientId: request.employeeId, // Target the specific employee
                    status: 'unread',
                    createdAt: serverTimestamp(),
                });
            }

            toast({
                title: `Request ${newStatus}`,
                description: `The leave request has been ${newStatus}.`,
            });
        } catch (error) {
            console.error("Error updating leave request:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `leaveRequests/${requestId}`,
                operation: 'update',
                requestResourceData: { requestStatus: newStatus }
            }));
        }
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        let yPos = 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ISBAH HASSAN & ASSOCIATES', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 10;
        doc.setFontSize(12);
        doc.text('Leave Application Report', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        const head = [['Employee Name', 'Department', 'Leave From', 'Leave To', 'Total Days', 'Leave Type', 'Status']];
        const body = leaveRequests.map(req => [
            req.employeeName,
            req.department,
            req.leaveFrom,
            req.leaveTo,
            req.totalDays.toString(),
            req.leaveType,
            req.requestStatus,
        ]);

        doc.autoTable({
            head: head,
            body: body,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [45, 95, 51] },
        });

        doc.save('leave-report.pdf');
        toast({ title: 'Download Started', description: 'Your Leave Report PDF is being generated.' });
    };

    const getStatusBadge = (status: LeaveRequest['requestStatus']) => {
        switch (status) {
            case 'approved':
                return <Badge variant="default" className="bg-green-500">Approved</Badge>;
            case 'denied':
                return <Badge variant="destructive">Denied</Badge>;
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline text-3xl text-primary">Leave Application Report</CardTitle>
                        <CardDescription>A summary of all employee leave requests.</CardDescription>
                    </div>
                    <Button onClick={handleDownloadPdf} disabled={isLoading || leaveRequests.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="ml-4">Loading leave records...</p>
                    </div>
                ) : leaveRequests.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No leave requests found.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead>Total Days</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaveRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                                    <TableCell>{request.department}</TableCell>
                                    <TableCell>{request.leaveFrom}</TableCell>
                                    <TableCell>{request.leaveTo}</TableCell>
                                    <TableCell>{request.totalDays}</TableCell>
                                    <TableCell>{request.leaveType}</TableCell>
                                    <TableCell>{getStatusBadge(request.requestStatus)}</TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-right">
                                            {request.requestStatus === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleStatusChange(request.id, 'approved')}>
                                                        <Check className="mr-1 h-4 w-4" /> Approve
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleStatusChange(request.id, 'denied')}>
                                                        <X className="mr-1 h-4 w-4" /> Deny
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
