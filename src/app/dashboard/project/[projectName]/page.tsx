
'use client';

import { useParams } from 'next/navigation';
import { allProjects } from '@/lib/projects-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { differenceInDays, parse, isValid } from 'date-fns';

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

export default function ProjectDetailPage() {
  const params = useParams();
  const projectName = Array.isArray(params.projectName)
    ? params.projectName[0]
    : params.projectName;

  const project = allProjects.find(
    (p) => encodeURIComponent(p.projectName) === projectName
  );

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

  const singleMilestones = [
    { label: 'Tender Status', value: project.tenderStatus },
    { label: 'Comparative', value: project.comparative },
    { label: 'Working Drawings', value: project.workingDrawings },
    { label: 'Site Visit', value: project.siteVisit },
    { label: 'Final Bill', value: project.finalBill },
    { label: 'Project Closure', value: project.projectClosure },
  ].filter(item => item.value);

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
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
                        <TableHead>Phase</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TimelineRow label="Site Survey" start={project.siteSurveyStart} end={project.siteSurveyEnd} />
                    <TimelineRow label="Contact" start={project.contactStart} end={project.contactEnd} />
                    <TimelineRow label="Head Count / Requirement" start={project.headCountStart} end={project.headCountEnd} />
                    <TimelineRow label="Proposal / Design Development" start={project.proposalStart} end={project.proposalEnd} />
                    <TimelineRow label="3D's" start={project.threedStart} end={project.threedEnd} />
                    <TimelineRow label="Tender Package Architectural" start={project.tenderArchStart} end={project.tenderArchEnd} />
                    <TimelineRow label="Tender Package MEP" start={project.tenderMepStart} end={project.tenderMepEnd} />
                    <TimelineRow label="BOQ" start={project.boqStart} end={project.boqEnd} />
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
