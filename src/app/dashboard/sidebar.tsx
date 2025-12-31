'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { memo, useState, useEffect, useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LogOut,
  User,
  FileText,
  Database,
  Users,
  LayoutDashboard,
  Briefcase,
  FileUp,
  Search as SearchIcon,
  Settings,
  KeyRound,
  CalendarOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/context/UserContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { allProjects } from '@/lib/projects-data';
import { useRecords } from '@/context/RecordContext';
import { getFormUrlFromFileName } from '@/lib/utils';
import { getIconForFile } from '@/lib/icons';
import { useTasks } from '@/hooks/use-tasks';

const topLevelItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/assign-task', label: 'Assign Task', icon: Briefcase },
    { href: '/dashboard/leave-application', label: 'Leave Application', icon: CalendarOff },
    { href: '/dashboard/employee', label: 'Employees', icon: Users, roles: ['software-engineer', 'admin', 'ceo'] },
    { href: '/dashboard/team', label: 'Our Team', icon: Users },
    { href: '/dashboard/about-me', label: 'About Me', icon: User },
    { href: '/dashboard/services', label: 'Services', icon: FileText },
    { href: '/dashboard/saved-records', label: 'Saved Records', icon: Database },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['software-engineer', 'admin'] },
    { href: '/dashboard/credentials', label: 'Credentials', icon: KeyRound, roles: ['software-engineer', 'admin', 'ceo'] },
];

const getInitials = (name: string) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[nameParts.length - 1]) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name[0] ? name[0].toUpperCase() : '';
}

// Memoized Menu to prevent re-renders on path changes
const MemoizedSidebarMenu = memo(({ visibleTopLevelItems }: { visibleTopLevelItems: typeof topLevelItems }) => {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {visibleTopLevelItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref>
              <SidebarMenuButton
                  isActive={pathname === item.href}
                  className={cn(pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground', 'group-data-[collapsible=icon]:justify-center')}
                  tooltip={item.label}
              >
                  <item.icon className="size-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
});
MemoizedSidebarMenu.displayName = 'MemoizedSidebarMenu';

export default function DashboardSidebar() {
  const { user: currentUser, logout, employees } = useCurrentUser();
  const { tasks } = useTasks(undefined, true);
  const { records } = useRecords();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleLogout = React.useCallback(() => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/login');
  }, [logout, router, toast]);

  const visibleTopLevelItems = useMemo(() => {
    return topLevelItems.filter(item => {
      if (!item.roles) return true;
      return currentUser && item.roles.some(role => currentUser.departments.includes(role));
    });
  }, [currentUser]);
  
  const searchResults = useMemo(() => {
    if (!searchQuery) return { menuResults: [], projectResults: [], recordResults: {}, taskResults: {} };

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const menuResults = visibleTopLevelItems.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery)
    );

    const projectResults = allProjects.filter(project =>
      project.projectName.toLowerCase().includes(lowerCaseQuery)
    );

    const recordResults = (records || []).filter(record => 
        record.projectName.toLowerCase().includes(lowerCaseQuery) ||
        record.fileName.toLowerCase().includes(lowerCaseQuery)
    ).reduce((acc, record) => {
        const key = record.fileName;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(record);
        return acc;
    }, {} as Record<string, ReturnType<typeof useRecords>['records']>);
    
    const taskResults = tasks.filter(task => {
        const employee = employees.find(e => e.uid === task.assignedTo);
        return employee?.name.toLowerCase().includes(lowerCaseQuery);
    }).reduce((acc, task) => {
        const employeeName = employees.find(e => e.uid === task.assignedTo)?.name || 'Unknown Employee';
        if (!acc[employeeName]) {
            acc[employeeName] = [];
        }
        acc[employeeName].push(task);
        return acc;
    }, {} as Record<string, typeof tasks>);
    
    return { 
        menuResults, 
        projectResults: Array.from(new Map(projectResults.map(p => [p.id, p])).values()), 
        recordResults,
        taskResults,
    };
  }, [searchQuery, visibleTopLevelItems, records, tasks, employees]);
  
  return (
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary font-bold text-2xl font-headline">
                <Users className="w-8 h-8" />
                <span className="group-data-[collapsible=icon]:hidden">IHA STUDIO</span>
            </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
           {currentUser && (
            <>
              <div className="flex flex-col items-center text-center p-4 group-data-[collapsible=icon]:hidden">
                <Avatar className="h-16 w-16 mb-2 border-2 border-primary">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-2xl">
                    {getInitials(currentUser.name)}
                    </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sidebar-foreground">{currentUser.name}</p>
              </div>
            </>
          )}
          <div className="relative px-2 mb-2 group-data-[collapsible=icon]:hidden">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
            <Input 
                placeholder="Search..."
                className="pl-8 bg-sidebar-accent border-sidebar-border h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <SidebarSeparator />
          {searchQuery ? (
             <SidebarMenu>
                {searchResults.menuResults.length > 0 && (
                     <SidebarMenuItem>
                        <span className="text-xs font-semibold text-sidebar-foreground/70 px-3">Menu Items</span>
                        {searchResults.menuResults.map((item) => (
                           <Link href={item.href} key={item.href} passHref>
                                <SidebarMenuButton>
                                    <item.icon className="size-5" />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        ))}
                    </SidebarMenuItem>
                )}
                {searchResults.projectResults.length > 0 && (
                     <SidebarMenuItem>
                        <span className="text-xs font-semibold text-sidebar-foreground/70 px-3">Projects</span>
                         {searchResults.projectResults.map((project) => (
                           <Link href={`/dashboard/project/${encodeURIComponent(project.projectName)}`} key={project.id} passHref>
                                <SidebarMenuButton>
                                    <Briefcase className="size-5" />
                                    <span>{project.projectName}</span>
                                </SidebarMenuButton>
                            </Link>
                        ))}
                    </SidebarMenuItem>
                )}
                 {Object.keys(searchResults.recordResults).length > 0 && (
                     <SidebarMenuItem>
                        <span className="text-xs font-semibold text-sidebar-foreground/70 px-3">Saved Records</span>
                        {Object.entries(searchResults.recordResults).map(([fileName, fileRecords]) => {
                            const Icon = getIconForFile(fileName);
                            return (
                                <div key={fileName} className="pl-3 mt-1">
                                    <span className="text-xs font-medium text-sidebar-foreground/60">{fileName}</span>
                                    {fileRecords.map(record => {
                                        const url = getFormUrlFromFileName(record.fileName, 'dashboard');
                                        if (!url) return null;
                                        return (
                                            <Link href={`${url}?id=${record.id}`} key={record.id} passHref>
                                                <SidebarMenuButton>
                                                    <Icon className="size-4" />
                                                    <span>{record.projectName}</span>
                                                </SidebarMenuButton>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )
                        })}
                     </SidebarMenuItem>
                 )}
                 {Object.keys(searchResults.taskResults).length > 0 && (
                    <SidebarMenuItem>
                        <span className="text-xs font-semibold text-sidebar-foreground/70 px-3">Assigned Tasks by Employee</span>
                         {Object.entries(searchResults.taskResults).map(([employeeName, employeeTasks]) => {
                             const employee = employees.find(e => e.name === employeeName);
                             return (
                                <div key={employeeName} className="pl-3 mt-1">
                                    <span className="text-xs font-medium text-sidebar-foreground/60">{employeeName}</span>
                                    {employeeTasks.map(task => (
                                        <Link href={`/dashboard/my-projects?employeeId=${employee?.record}`} key={task.id} passHref>
                                            <SidebarMenuButton>
                                                <Briefcase className="size-4" />
                                                <span>{task.taskName}</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    ))}
                                </div>
                            )
                         })}
                    </SidebarMenuItem>
                 )}
                {searchResults.menuResults.length === 0 && searchResults.projectResults.length === 0 && Object.keys(searchResults.recordResults).length === 0 && Object.keys(searchResults.taskResults).length === 0 && (
                    <p className="text-xs text-center text-sidebar-foreground/70 py-4">No results found.</p>
                )}
             </SidebarMenu>
          ) : (
            <MemoizedSidebarMenu 
                visibleTopLevelItems={visibleTopLevelItems}
            />
          )}
        </SidebarContent>
        <SidebarFooter className="p-2">
            <SidebarSeparator />
            <SidebarMenu>
                <SidebarMenuItem>
                     <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center">
                        <LogOut className="size-5" />
                        <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                    </Button>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}
