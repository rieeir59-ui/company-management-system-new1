
'use client';

import { useParams } from 'next/navigation';
import { allProjects } from '@/lib/projects-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Download } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { differenceInDays, parse, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value || 'N/A'}</p>
    </div>
);

const TimelineRow = ({ label, start, end }: { label: string; start?: string | null; end?: string | null }) => {
    let duration = 'N/A';
    if (start && end) {
        const startDate = parse(start, 'dd-MMM-yy', new Date());
        const endDate = parse(end, 'dd-MMM-yy', new Date());
        if (isValid(startDate) && isValid(endDate)) {
            const diff = differenceInDays(endDate, startDate);
            duration = `${diff} day${diff === 1 ? '' : 's'}`;
        }
    }

    return (
        <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell>{start || 'N/A'}</TableCell>
            <TableCell>{end || 'N/A'}</TableCell>
            <TableCell className="text-right">{duration}</TableCell>
        </TableRow>
    );
};

const TimelineRowSingle = ({ label, value }: { label: string; value?: string | null }) => (
    <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        <TableCell colSpan={3}>{value || 'N/A'}</TableCell>
    </TableRow>
);


export default function ProjectDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const projectName = Array.isArray(params.projectName)
    ? params.projectName[0]
    : params.projectName;

  const project = allProjects.find(
    (p) => encodeURIComponent(p.projectName) === projectName
  );
  
  const singleMilestones = project ? [
    { label: 'Tender Status', value: project.tenderStatus },
    { label: 'Comparative', value: project.comparative },
    { label: 'Final Bill', value: project.finalBill },
    { label: 'Project Closure', value: project.projectClosure },
  ].filter(item => item.value) : [];
  
  const handleDownload = () => {
    if (!project) return;
    
    const doc = new jsPDF() as jsPDFWithAutoTable;
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(project.projectName, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    doc.autoTable({
        startY: yPos,
        theme: 'plain',
        body: [
            ['Serial No.', project.srNo],
            ['Area', project.area ? `${project.area} sft` : 'N/A'],
            ['Project Holder', project.projectHolder || 'N/A'],
            ['Allocation Date', project.allocationDate || 'N/A'],
        ],
        columnStyles: { 0: { fontStyle: 'bold' } },
    });
    yPos = doc.autoTable.previous.finalY + 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Project Timeline", 14, yPos);
    yPos += 8;

    const timelineBody = [
        ["Site Survey", project.siteSurveyStart || 'N/A', project.siteSurveyEnd || 'N/A'],
        ["Contract", project.contract || 'N/A'],
        ["Head Count / Requirement", project.headCount || 'N/A'],
        ["Proposal / Design Development", project.proposalStart || 'N/A', project.proposalEnd || 'N/A'],
        ["3D's", project.threedStart || 'N/A', project.threedEnd || 'N/A'],
        ["Tender Package Architectural", project.tenderArchStart || 'N/A', project.tenderArchEnd || 'N/A'],
        ["Tender Package MEP", project.tenderMepStart || 'N/A', project.tenderMepEnd || 'N/A'],
        ["BOQ", project.boqStart || 'N/A', project.boqEnd || 'N/A'],
        ["Working Drawings", project.workingDrawingsStart || 'N/A', project.workingDrawingsEnd || 'N/A'],
        ["Site Visit", project.siteVisitStart || 'N/A', project.siteVisitEnd || 'N/A'],
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Activity', 'Start Date', 'End Date']],
        body: timelineBody,
        theme: 'grid',
        headStyles: { fillColor: [45, 95, 51] },
    });
    yPos = doc.autoTable.previous.finalY + 15;

    if (singleMilestones.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Other Milestones", 14, yPos);
        yPos += 8;
        doc.autoTable({
            startY: yPos,
            head: [['Milestone', 'Date/Status']],
            body: singleMilestones.map(m => [m.label, m.value]),
            theme: 'grid',
            headStyles: { fillColor: [45, 95, 51] },
        });
    }

    doc.save(`${project.projectName.replace(/ /g, '_')}_Details.pdf`);
    toast({ title: 'Download Started', description: 'Your project details PDF is being generated.' });
  }

  if (!project) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground">The project you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-headline text-primary">
            {project.projectName}
          </h1>
        </div>
        <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailItem label="Serial No." value={project.srNo} />
            <DetailItem label="Area" value={project.area ? `${project.area} sft` : 'N/A'} />
            <DetailItem label="Project Holder" value={project.projectHolder} />
            <DetailItem label="Allocation Date" value={project.allocationDate} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TimelineRow label="Site Survey" start={project.siteSurveyStart} end={project.siteSurveyEnd} />
                    <TimelineRowSingle label="Contract" value={project.contract} />
                    <TimelineRowSingle label="Head Count / Requirement" value={project.headCount} />
                    <TimelineRow label="Proposal / Design Development" start={project.proposalStart} end={project.proposalEnd} />
                    <TimelineRow label="3D's" start={project.threedStart} end={project.threedEnd} />
                    <TimelineRow label="Tender Package Architectural" start={project.tenderArchStart} end={project.tenderArchEnd} />
                    <TimelineRow label="Tender Package MEP" start={project.tenderMepStart} end={project.tenderMepEnd} />
                    <TimelineRow label="BOQ" start={project.boqStart} end={project.boqEnd} />
                    <TimelineRow label="Working Drawings" start={project.workingDrawingsStart} end={project.workingDrawingsEnd} />
                    <TimelineRow label="Site Visit" start={project.siteVisitStart} end={project.siteVisitEnd} />
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {singleMilestones.length > 0 && (
        <Card>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Other Milestones</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {singleMilestones.map(item => (
                     <DetailItem key={item.label} label={item.label} value={item.value} />
                ))}
            </CardContent>
        </Card>
      )}

    </div>
  );
}
