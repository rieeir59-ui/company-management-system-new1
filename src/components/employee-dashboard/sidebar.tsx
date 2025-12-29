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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  LogOut,
  User,
  FileText,
  Database,
  Users,
  LayoutDashboard,
  Briefcase,
  BookCopy,
  FileUp,
  Landmark,
  Search as SearchIcon,
  Clock,
  Building2,
  Home,
  List,
  Compass,
  FileSearch,
  Presentation,
  CalendarOff,
  ClipboardList,
  Eye,
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

const topLevelItems = [
    { href: '/employee-dashboard', label: 'My Projects', icon: LayoutDashboard },
    { href: '/employee-dashboard/our-team', label: 'Our Team', icon: Users },
    { href: '/employee-dashboard/about-me', label: 'About Me', icon: User },
    { href: '/employee-dashboard/services', label: 'Services', icon: FileText },
    { href: '/employee-dashboard/leave-application', label: 'Leave Application', icon: CalendarOff },
    { href: '/employee-dashboard/daily-report', label: 'Daily Report', icon: ClipboardList },
    { href: '/employee-dashboard/site-visit', label: 'Site Visit', icon: Eye },
    { href: '/employee-dashboard/site-survey-report', label: 'Site Survey Report', icon: FileSearch },
    { href: '/employee-dashboard/site-survey', label: 'Site Survey', icon: Compass },
    { href: '/employee-dashboard/field-reports-meetings', label: 'Field Reports/Meetings', icon: Presentation },
    { href: '/employee-dashboard/upload-files', label: 'Upload Files', icon: FileUp },
    { href: '/employee-dashboard/saved-records', label: 'My Saved Records', icon: Database },
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
const MemoizedSidebarMenu = memo(({ menuItems, projectManualItems }: { menuItems: any[], projectManualItems: any[] }) => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <SidebarMenu>
      {menuItems.map((item) => (
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

      {isClient && (
        <>
            <SidebarMenuItem>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="group-data-[collapsible=icon]:justify-center"
                    tooltip="Project Manual"
                  >
                    <BookCopy className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Project Manual</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <SidebarMenuSub>
                    {(projectManualItems || []).map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <Link href={item.href} passHref>
                          <SidebarMenuSubButton isActive={pathname === item.href}>
                            <item.icon className="size-4 mr-2" />
                            {item.label}
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="group-data-[collapsible=icon]:justify-center"
                    tooltip="Timeline of Projects"
                  >
                    <Clock className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Timeline of Projects</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/running-projects-summary" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/running-projects-summary')}>
                          <List className="size-4 mr-2" />
                          Running Projects Summary
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/askari-bank" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/askari-bank')}>
                          <Landmark className="size-4 mr-2" />
                          Askari Bank
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/bank-al-falah" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/bank-al-falah')}>
                          <Landmark className="size-4 mr-2" />
                          Bank Al-Falah
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/bank-al-habib" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/bank-al-habib')}>
                          <Landmark className="size-4 mr-2" />
                          Bank Al-Habib
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/cbd" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/cbd')}>
                          <Landmark className="size-4 mr-2" />
                          CBD
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/dib" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/dib')}>
                          <Landmark className="size-4 mr-2" />
                          DIB
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/faysal-bank" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/faysal-bank')}>
                          <Landmark className="size-4 mr-2" />
                          FBL
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/hbl" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/hbl')}>
                          <Landmark className="size-4 mr-2" />
                          HBL
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/mcb" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/mcb')}>
                          <Landmark className="size-4 mr-2" />
                          MCB
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/ubl" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/ubl')}>
                          <Landmark className="size-4 mr-2" />
                          UBL
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Link href="/employee-dashboard/timelines-of-bank/commercial" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/commercial')}>
                           <Building2 className="size-4 mr-2" />
                          Commercial
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                       <Link href="/employee-dashboard/timelines-of-bank/residential" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/residential')}>
                           <Home className="size-4 mr-2" />
                          Residential
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
        </>
      )}
    </SidebarMenu>
  );
});
MemoizedSidebarMenu.displayName = 'MemoizedSidebarMenu';

export default function EmployeeDashboardSidebar() {
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser, logout } = useCurrentUser();
  const { projectManualItems, records } = useRecords();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = React.useCallback(() => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/login');
  }, [logout, router, toast]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return { menuResults: [], projectResults: [], recordResults: [] };

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const allMenuItems = [...topLevelItems, ...projectManualItems];

    const menuResults = allMenuItems.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery)
    );

    const projectResults = allProjects.filter(project =>
      project.projectName.toLowerCase().includes(lowerCaseQuery)
    );

    const recordResults = records.filter(record => 
        record.projectName.toLowerCase().includes(lowerCaseQuery)
    );
    
    return { menuResults, projectResults: Array.from(new Map(projectResults.map(p => [p.id, p])).values()), recordResults };
  }, [searchQuery, projectManualItems, records]);
  
  return (
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="p-4">
            <Link href="/employee-dashboard" className="flex items-center gap-2 text-primary font-bold text-2xl font-headline">
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
                           <Link href={`/employee-dashboard/project/${encodeURIComponent(project.projectName)}`} key={project.id} passHref>
                                <SidebarMenuButton>
                                    <Briefcase className="size-5" />
                                    <span>{project.projectName}</span>
                                </SidebarMenuButton>
                            </Link>
                        ))}
                    </SidebarMenuItem>
                )}
                 {searchResults.recordResults.length > 0 && (
                    <SidebarMenuItem>
                        <span className="text-xs font-semibold text-sidebar-foreground/70 px-3">Saved Records</span>
                        {searchResults.recordResults.map((record) => {
                            const Icon = getIconForFile(record.fileName);
                            const url = getFormUrlFromFileName(record.fileName, 'employee-dashboard');
                            return (
                                <Link href={`${url}?id=${record.id}`} key={record.id} passHref>
                                    <SidebarMenuButton>
                                        <Icon className="size-5" />
                                        <span>{record.projectName} ({record.fileName})</span>
                                    </SidebarMenuButton>
                                </Link>
                            )
                        })}
                    </SidebarMenuItem>
                )}
                {searchResults.menuResults.length === 0 && searchResults.projectResults.length === 0 && searchResults.recordResults.length === 0 && (
                    <p className="text-xs text-center text-sidebar-foreground/70 py-4">No results found.</p>
                )}
             </SidebarMenu>
          ) : (
            <MemoizedSidebarMenu 
                menuItems={topLevelItems} 
                projectManualItems={projectManualItems || []}
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
