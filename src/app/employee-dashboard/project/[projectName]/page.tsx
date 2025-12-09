
'use client';

import { useParams } from 'next/navigation';
import { allProjects } from '@/lib/projects-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
          <Link href="/employee-dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const projectDetails = Object.entries(project).filter(([key]) => key !== 'id');

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/employee-dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline text-primary">
          {project.projectName}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {projectDetails.map(([key, value]) => {
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());
              
              return (
                <div key={key} className="p-2 border-b">
                  <dt className="text-sm font-medium text-muted-foreground">{formattedKey}</dt>
                  <dd className="text-base font-semibold">{value || 'N/A'}</dd>
                </div>
              );
            })}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
