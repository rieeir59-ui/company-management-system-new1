
'use client';

import { useState } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useFirebase } from '@/firebase/provider';
import { useCurrentUser } from '@/context/UserContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const Section = ({ title, children, className }: { title?: string; children: React.ReactNode, className?: string }) => (
  <div className={`mb-6 ${className}`}>
    {title && <h2 className="text-xl font-bold text-primary mb-3">{title}</h2>}
    <div className="space-y-3 text-sm">
      {children}
    </div>
  </div>
);

const initialAgreementText = {
    topSupervision: [
      'Please find attached the site visit schedule for the project please intimate the office one week in advance before the required visit for timely surveillance. Any Unscheduled visits would be charged as under.',
      'For out of station visits, the travelling by air and lodging in a five-star hotel will be paid by the client.',
      "Rs. 50,000 for Principal Architect's site visit per day.",
      "Rs. 30,000 for Associate Architect's site visit per day.",
      'For International visits, the travelling by air and lodging in a five-star hotel will be paid by the client.',
      "Rs. 150,000 for Principal Architect' s fee per day.",
      "Rs. 30,000 for Associate Architect' s fee per day."
    ],
    detailedSupervision: 'The fee for detailed supervision will be Rs. 300,000 /- per month, which will ensure daily progress at the site.',
    notes: [
        'The above quoted rates do not include any kind of tax.',
        'The contract value is lumpsum for the area between 90,000 to 120,000 Sft, if however, the area increases the above amount only the sub-consultants fee @ Rs. 70/Sft will be charged.',
        'The above consultancy charges quoted are valid for only two months.'
    ],
    extraServicesNote: 'The item number 9 & 10 is under the head of extra services if the client requests these services, the extra charges will be as mentioned above.',
    architectResponsibilities: [
        "The architect will produce a maximum of two proposals are revisions for the client for the said amount of consultancy every proposal or revision after this will be charged @ Rs. 500,000 /- per Proposal.",
        "The architect will require a minimum period of one month for the design development. 2 months will be required for work drawings.",
        "The architect will represent the owner and will advise and consult with the owner regarding construction.",
        "The architect will be responsible for checking the contractor's progress and giving the approval for payments due to the contractor.",
        "The architect is to prepare a maximum of 2 design proposals for the proposal stage for the client. If one proposal is developed, it can be revised two times, free of cost to the client. If, however, 2 design proposals are made, the second proposal can be revised three times, free of cost to the client. If the client wishes for another revision of the proposal, the architect will be paid Rs. 300,000 in advance for each drawing. If the client wishes to develop a third proposal, the architect will be paid Rs. 500,000 as advance payment for the task and Rs. 300,000 per revision of the third proposal.",
        "No revision will be made after the Issuance of Construction Drawings. If client wants the revision, he will have to pay for the amount ascertained in the contract.",
        "No revision will be made for working drawings. If client wants the revision, he will be required to pay the amount.",
        "Project supervision will include visits as mentioned in Construction Activity Schedule.",
        "The Architect will provide 3 Sets of working drawings to the client. For additional sets of working drawings Rs. 50,000 per set will be charged.",
        "The Architect will provide only two options/revisions of 3Ds for the Facade after which any option/revision wil be charged based on normal market rates. For Interior renderings Rs. 500,000/- will be charged."
    ],
    notResponsible: [
        "Continuous site supervision.",
        "Technical sequences and procedures of the contractors.",
        "Change of acts and omissions of the contractor. These are the contractor's responsibilities.",
        "Changes and omissions made on the owner's directions."
    ],
    termination: [
        "The agreement may be terminated by any of the parties on 7 days written notice. The other party will substantially perform in accordance with its items though no fault of the party initiating the termination.",
        "The owner at least on 7 days’ notice to the designer may terminate the agreement in the event that the project is permanently abandoned.",
        "In the event of termination not the fault of the design builder, the design builder will be compensated for services performed till termination date.",
        "No reimbursable then due and termination expenses. The termination expenses are the expenses directly attributable to the termination including a reasonable amount of overhead and profit for which the design/builder is not otherwise compensated under this agreement."
    ],
    compensation: [
        "The owner will compensate the design/builder in accordance with this agreement, payments, and the other provisions of this agreement as described below.",
        "Compensation for basic services",
        "Basic services will be as mentioned",
        "Subsequent payments will be as mentioned",
        "Compensation for additional services",
        "For additional services compensation will be as mentioned",
        "Travel expenses of Architect, Engineer, Sub-Engineer and Sub Consultant will be separately billed",
        "Computer Animation will be charged at the normal market rates",
        "The rate of interest past due payments will be 15 % per month"
    ],
};

const initialPaymentSchedule = [
    { id: 1, description: 'On mobilization (advance payment)', percentage: '20 %' },
    { id: 2, description: "On approval of schematic designs & 3D's", percentage: '15%' },
    { id: 3, description: 'On completion of submission drawings', percentage: '15%' },
    { id: 4, description: 'On start of construction drawings', percentage: '15%' },
    { id: 5, description: 'On completion of construction drawings', percentage: '10%' },
    { id: 6, description: 'On completion of interior drawings', percentage: '10%' },
    { id: 7, description: 'On preparation of detailed BOQ', percentage: '10%' },
];


export default function ProjectAgreementPage() {
    const image = PlaceHolderImages.find(p => p.id === 'project-agreement');
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { user: currentUser } = useCurrentUser();
    
    const [day, setDay] = useState('');
    const [owner, setOwner] = useState('');
    const [designOf, setDesignOf] = useState('');
    const [address, setAddress] = useState('');
    const [coveredArea, setCoveredArea] = useState('');
    const [consultancyCharges, setConsultancyCharges] = useState('');
    const [salesTax, setSalesTax] = useState('');
    const [withholdingTax, setWithholdingTax] = useState('');
    const [finalCharges, setFinalCharges] = useState('');

    const [agreementText, setAgreementText] = useState(initialAgreementText);
    const [paymentSchedule, setPaymentSchedule] = useState(initialPaymentSchedule);

    const handlePaymentScheduleChange = (id: number, field: 'description' | 'percentage', value: string) => {
        setPaymentSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
    const handleTextChange = (section: keyof typeof agreementText, index: number, value: string) => {
        const newText = { ...agreementText };
        if (Array.isArray(newText[section])) {
            (newText[section] as string[])[index] = value;
        } else {
            (newText[section] as string) = value;
        }
        setAgreementText(newText);
    };

    const handleSingleTextChange = (section: 'detailedSupervision' | 'extraServicesNote', value: string) => {
        setAgreementText(prev => ({ ...prev, [section]: value }));
    };

    const handleSave = async () => {
        if (!firestore || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save a record.' });
            return;
        }

        const recordData = [
            { category: "Agreement Details", items: [`Made as of the day: ${day}`, `Between the Owner: ${owner}`, `For the Design of: ${designOf}`, `Address: ${address}`] },
            { category: "Cost Breakdown", items: [`Covered Area of Project: ${coveredArea}`, `Consultancy Charges: ${consultancyCharges}`, `Sales Tax @ 16%: ${salesTax}`, `Withholding Tax @ 10%: ${withholdingTax}`, `Final Consultancy Charges: ${finalCharges}`] },
            { category: "Payment Schedule", items: paymentSchedule.map(p => `${p.description}: ${p.percentage}`) },
            { category: "Top Supervision", items: agreementText.topSupervision },
            { category: "Detailed Supervision", items: [agreementText.detailedSupervision] },
            { category: "Notes", items: agreementText.notes },
            { category: "Extra Services Note", items: [agreementText.extraServicesNote] },
            { category: "Architect's Responsibilities", items: agreementText.architectResponsibilities },
            { category: "Not Responsible For", items: agreementText.notResponsible },
            { category: "Termination", items: agreementText.termination },
            { category: "Compensation", items: agreementText.compensation },
        ];
        
        const dataToSave = {
            employeeId: currentUser.record, 
            employeeName: currentUser.name, 
            fileName: 'Project Agreement',
            projectName: designOf || 'Untitled Project', 
            data: recordData, 
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(firestore, 'savedRecords'), dataToSave);
            toast({ title: "Record Saved", description: "The project agreement has been successfully saved." });
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: `savedRecords`,
                operation: 'create',
                requestResourceData: dataToSave,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        let yPos = 20;

        const addText = (text: string, isBold = false, indent = 0, size = 10, spaceAfter = 7) => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setFontSize(size);
            const splitText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 28 - indent);
            doc.text(splitText, 14 + indent, yPos);
            yPos += (splitText.length * 4) + spaceAfter;
        };
        
        const addList = (items: string[]) => {
            items.forEach(item => {
                addText(`• ${item}`, false, 5, 10, 5);
            });
        };

        addText('COMMERCIAL AGREEMENT', true, 0, 14, 10);
        addText(`Made as of the day ${day || '________________'}`);
        addText(`Between the Owner: ${owner || '________________'}`);
        addText(`For the Design of: ${designOf || '________________'}`);
        addText(`Address: ${address || '________________'}`);
        
        (doc as any).autoTable({
            startY: yPos, theme: 'plain', styles: { fontSize: 10 },
            body: [
                ['Covered Area of Project:', coveredArea], 
                ['Consultancy Charges:', consultancyCharges], 
                ['Sales Tax @ 16%:', salesTax], 
                ['Withholding Tax @ 10%:', withholdingTax], 
                ['Final Consultancy Charges:', finalCharges]
            ],
        });
        yPos = (doc as any).autoTable.previous.finalY + 10;
        
        addText('PAYMENT SCHEDULE:', true, 0, 12, 8);
        const paymentBody = paymentSchedule.map(item => [item.description, item.percentage]);
        (doc as any).autoTable({
            startY: yPos,
            body: paymentBody,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1 }
        });
        yPos = (doc as any).autoTable.previous.finalY + 10;

        addText('Project Management', true, 0, 12, 8);
        addText('Top Supervision:', true, 2, 10, 5);
        addList(agreementText.topSupervision);

        addText('Detailed Supervision:', true, 2, 10, 5);
        addText(agreementText.detailedSupervision, false, 5);

        addText('Please Note:', true, 0, 12, 8);
        addList(agreementText.notes);
        addText(agreementText.extraServicesNote, true, 2);
        
        addText("Architect's Responsibilities", true, 0, 12, 8);
        addList(agreementText.architectResponsibilities);

        addText("The Architect will not be responsible for the following things:", true, 0, 12, 8);
        addList(agreementText.notResponsible);

        addText("ARTICLE-1: Termination of the Agreement", true, 0, 12, 8);
        addList(agreementText.termination);

        addText("ARTICLE-2: Bases of Compensation", true, 0, 12, 8);
        addList(agreementText.compensation);

        yPos += 10;
        addText('____________________', false, 0, 10, 2);
        addText('Architect', false, 0, 10, 15);
        addText('____________________', false, 0, 10, 2);
        addText('Client', false, 0, 10, 5);


        doc.save('Project-Agreement.pdf');
        toast({ title: "Download Started", description: "The project agreement PDF is being generated." });
    }

    return (
        <div className="space-y-8">
            <DashboardPageHeader title="Project Agreement" description="Manage project agreements." imageUrl={image?.imageUrl || ''} imageHint={image?.imageHint || ''} />
            <Card>
                <CardHeader><CardTitle className="text-center font-headline text-3xl text-primary">COMMERCIAL AGREEMENT</CardTitle></CardHeader>
                <CardContent className="p-6 md:p-8">
                    <div id="agreement-content">
                        <Section>
                            <div className="flex items-center gap-2">Made as of the day <Input value={day} onChange={e => setDay(e.target.value)} className="w-48" /></div>
                            <div className="flex items-center gap-2">Between the Owner: <Input value={owner} onChange={e => setOwner(e.target.value)} className="flex-1" /></div>
                            <p>And the Firm: Isbah Hassan & Associates</p>
                            <div className="flex items-center gap-2">For the Design of: <Input value={designOf} onChange={e => setDesignOf(e.target.value)} className="flex-1" /></div>
                            <div className="flex items-center gap-2">Address: <Input value={address} onChange={e => setAddress(e.target.value)} className="flex-1" /></div>
                        </Section>

                        <Section title="Cost Breakdown">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <p>Covered Area of Project:</p> <Input value={coveredArea} onChange={e => setCoveredArea(e.target.value)} />
                                <p>Consultancy Charges @ Rs ___/Sft:</p> <Input value={consultancyCharges} onChange={e => setConsultancyCharges(e.target.value)} />
                                <p>Sales Tax @ 16%:</p> <Input value={salesTax} onChange={e => setSalesTax(e.target.value)} />
                                <p>Withholding Tax @ 10%:</p> <Input value={withholdingTax} onChange={e => setWithholdingTax(e.target.value)} />
                                <p className="font-bold">Final Consultancy Charges:</p> <Input className="font-bold" value={finalCharges} onChange={e => setFinalCharges(e.target.value)} />
                            </div>
                        </Section>

                        <Section title="PAYMENT SCHEDULE:">
                             <div className="space-y-2">
                                {paymentSchedule.map(item => (
                                    <div key={item.id} className="grid grid-cols-2 gap-x-8 gap-y-2 items-center">
                                        <Input value={item.description} onChange={e => handlePaymentScheduleChange(item.id, 'description', e.target.value)} />
                                        <Input value={item.percentage} onChange={e => handlePaymentScheduleChange(item.id, 'percentage', e.target.value)} className="w-24" />
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section title="Project Management">
                            <h3 className="font-semibold text-md mb-2">Top Supervision:</h3>
                            <div className="space-y-2 pl-2">
                                {agreementText.topSupervision.map((text, index) => (
                                    <Textarea key={index} value={text} onChange={(e) => handleTextChange('topSupervision', index, e.target.value)} rows={2} />
                                ))}
                            </div>
                            <h3 className="font-semibold text-md mt-4 mb-2">Detailed Supervision:</h3>
                            <div className="pl-2">
                                <Textarea value={agreementText.detailedSupervision} onChange={(e) => handleSingleTextChange('detailedSupervision', e.target.value)} rows={2} />
                            </div>
                        </Section>
                        
                        <Section title="Please Note:">
                             <div className="space-y-2 pl-2">
                                {agreementText.notes.map((text, index) => (
                                    <Textarea key={index} value={text} onChange={(e) => handleTextChange('notes', index, e.target.value)} rows={2} />
                                ))}
                            </div>
                        </Section>
                        
                        <Section title="Architect's Responsibilities">
                            <div className="space-y-2 pl-2">
                                {agreementText.architectResponsibilities.map((text, index) => (
                                    <Textarea key={index} value={text} onChange={(e) => handleTextChange('architectResponsibilities', index, e.target.value)} rows={3} />
                                ))}
                            </div>
                        </Section>
                         <Section title="The Architect will not be responsible for the following things:">
                            <div className="space-y-2 pl-2">
                                {agreementText.notResponsible.map((text, index) => (
                                    <Textarea key={index} value={text} onChange={(e) => handleTextChange('notResponsible', index, e.target.value)} rows={2} />
                                ))}
                            </div>
                        </Section>

                        <Section title="ARTICLE-1: Termination of the Agreement">
                            <div className="space-y-2 pl-2">
                                {agreementText.termination.map((text, index) => (
                                    <Textarea key={index} value={text} onChange={(e) => handleTextChange('termination', index, e.target.value)} rows={3} />
                                ))}
                            </div>
                        </Section>

                        <Section title="ARTICLE-2: Bases of Compensation">
                           <div className="space-y-2 pl-2">
                                {agreementText.compensation.map((text, index) => (
                                    <Textarea key={index} value={text} onChange={(e) => handleTextChange('compensation', index, e.target.value)} rows={2} />
                                ))}
                            </div>
                        </Section>

                        <div className="flex justify-between mt-16">
                            <div><p className="border-b-2 border-foreground w-48 mb-2"></p><p>Architect</p></div>
                            <div><p className="border-b-2 border-foreground w-48 mb-2"></p><p>Client</p></div>
                        </div>

                    </div>
                    <div className="flex justify-end gap-4 mt-12">
                        <Button type="button" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Record</Button>
                        <Button type="button" onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

