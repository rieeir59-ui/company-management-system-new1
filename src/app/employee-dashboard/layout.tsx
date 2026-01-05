'use client';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import EmployeeDashboardSidebar from "@/components/employee-dashboard/sidebar";
import { Header } from "@/components/employee-dashboard/header";
import { Suspense } from 'react';
import { Loader2 } from "lucide-react";

function DashboardFallback() {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-4">Loading Page...</span>
        </div>
    )
}

export default function EmployeeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <SidebarProvider>
          <EmployeeDashboardSidebar />
            <SidebarInset>
              <Suspense fallback={<DashboardFallback />}>
                <Header />
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
              </Suspense>
            </SidebarInset>
      </SidebarProvider>
  );
}
