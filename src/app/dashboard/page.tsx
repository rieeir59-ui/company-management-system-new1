
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Crown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/context/UserContext';
import { type Employee } from '@/lib/employees';


const departments = [
    { name: 'ADMIN', slug: 'admin' },
    { name: 'HR', slug: 'hr' },
    { name: 'SOFTWARE ENGINEER', slug: 'software-engineer' },
    { name: 'DRAFTPERSONS', slug: 'draftpersons' },
    { name: '3D VISULIZER', slug: '3d-visualizer' },
    { name: 'ARCHITECTS', slug: 'architects' },
    { name: 'FINANCE', slug: 'finance' },
    { name: 'QUANTITY MANAGEMENT', slug: 'quantity-management' },
];

export default function DashboardPage() {
    const { employeesByDepartment } = useCurrentUser();
    const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});
    const [ceo, setCeo] = useState<Employee | null>(null);

    useEffect(() => {
        const counts: Record<string, number> = {};
        for (const dept of departments) {
            counts[dept.slug] = employeesByDepartment[dept.slug as keyof typeof employeesByDepartment]?.length || 0;
        }
        setDepartmentCounts(counts);

        const ceoData = employeesByDepartment['ceo']?.[0];
        if (ceoData) {
            setCeo(ceoData);
        }
    }, [employeesByDepartment]);


  return (
    <div className="animate-in fade-in-50 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Dashboard</h1>
        <p className="text-muted-foreground">You can manage departments from here.</p>
      </div>

       {ceo && (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-headline font-bold text-primary">CEO</h2>
                </div>
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     <Link href={`/dashboard/department/ceo`}>
                        <Card className="bg-primary/20 border-2 border-primary shadow-lg h-full transition-transform hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer">
                            <CardHeader>
                                <CardTitle className="text-primary font-bold">{ceo.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2 text-muted-foreground">
                                    <Users className="h-5 w-5" />
                                    <span className="font-semibold">Chief Executive Officer</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        )}
      
      <div>
        <h2 className="text-2xl font-headline font-bold mb-4 mt-8">DEPARTMENTS</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((dept) => (
            <Link href={`/dashboard/department/${dept.slug}`} key={dept.name}>
                <Card className="bg-sidebar text-sidebar-foreground border-2 border-primary/80 shadow-lg h-full transition-transform hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer">
                <CardHeader>
                    <CardTitle className="text-primary font-bold uppercase">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 text-sidebar-foreground/80">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">{departmentCounts[dept.slug] || 0} Employees</span>
                    </div>
                </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
