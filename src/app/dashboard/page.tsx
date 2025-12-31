
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Crown } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import { type Employee } from '@/lib/employees';
import React from 'react';

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

const DepartmentCard = ({ name, count, slug }: { name: string, count: number, slug: string }) => (
    <Link href={`/dashboard/department/${slug}`} key={name}>
        <Card className="bg-black text-white border-2 border-primary shadow-lg h-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 cursor-pointer">
        <CardHeader>
            <CardTitle className="text-primary font-bold uppercase tracking-wider">{name}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center space-x-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="font-semibold">{count} Employees</span>
            </div>
        </CardContent>
        </Card>
    </Link>
);

const CeoCard = ({ ceo }: { ceo: Employee }) => (
    <Link href={`/dashboard/department/ceo`}>
        <Card className="bg-primary/10 border-2 border-primary shadow-lg h-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer">
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
);


export default function DashboardPage() {
    const { employeesByDepartment } = useCurrentUser();
    const ceo = employeesByDepartment['ceo']?.[0];

    return (
        <div className="animate-in fade-in-50 space-y-12">
            <div>
                <h1 className="text-4xl font-headline font-bold tracking-tight text-primary">Welcome to the Dashboard</h1>
                <p className="text-lg text-muted-foreground mt-2">Manage departments, employees, and projects from one central hub.</p>
            </div>
      
            {ceo && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Crown className="h-7 w-7 text-primary" />
                        <h2 className="text-2xl font-headline font-bold text-primary">OFFICE OF THE CEO</h2>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
                        <CeoCard ceo={ceo} />
                    </div>
                </div>
            )}
            
            <div className="border-t border-dashed mt-8 pt-8">
                <h2 className="text-2xl font-headline font-bold mb-6">DEPARTMENTS</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {departments.map((dept) => {
                        const count = employeesByDepartment[dept.slug]?.length || 0;
                        return (
                            <DepartmentCard 
                                key={dept.slug}
                                name={dept.name}
                                slug={dept.slug}
                                count={count}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
