
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
  Settings,
  KeyRound,
  List,
  Clock,
  Building2,
  Home,
  Archive,
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
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/assign-task', label: 'Assign Task', icon: Briefcase },
    { href: '/dashboard/employee', label: 'Employees', icon: Users, roles: ['software-engineer', 'admin', 'ceo'] },
    { href: '/dashboard/team', label: 'Our Team', icon: Users },
    { href: '/dashboard/about-me', label: 'About Me', icon: User },
    { href: '/dashboard/services', label: 'Services', icon: FileText },
    { href: '/dashboard/upload-files', label: 'Upload Files', icon: FileUp },
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
const MemoizedSidebarMenu = memo(({ visibleTopLevelItems, projectManualItems }: { visibleTopLevelItems: typeof topLevelItems, projectManualItems: any[] }) => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
                    {projectManualItems.map((item) => (
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
                      <Link href="/dashboard/timelines-of-bank/running-projects-summary" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/running-projects-summary')}>
                          <List className="size-4 mr-2" />
                          Running Projects Summary
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/askari-bank" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/askari-bank')}>
                          <Landmark className="size-4 mr-2" />
                          Askari Bank
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/bank-al-falah" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/bank-al-falah')}>
                          <Landmark className="size-4 mr-2" />
                          Bank Al-Falah
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/bank-al-habib" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/bank-al-habib')}>
                          <Landmark className="size-4 mr-2" />
                          Bank Al-Habib
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/cbd" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/cbd')}>
                          <Landmark className="size-4 mr-2" />
                          CBD
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/dib" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/dib')}>
                          <Landmark className="size-4 mr-2" />
                          DIB
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/faysal-bank" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/faysal-bank')}>
                          <Landmark className="size-4 mr-2" />
                          FBL
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/hbl" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/hbl')}>
                          <Landmark className="size-4 mr-2" />
                          HBL
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/mcb" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/mcb')}>
                          <Landmark className="size-4 mr-2" />
                          MCB
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/ubl" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/ubl')}>
                          <Landmark className="size-4 mr-2" />
                          UBL
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Link href="/dashboard/timelines-of-bank/commercial" passHref>
                        <SidebarMenuSubButton isActive={pathname.includes('/timelines-of-bank/commercial')}>
                           <Building2 className="size-4 mr-2" />
                          Commercial
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                       <Link href="/dashboard/timelines-of-bank/residential" passHref>
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

export default function DashboardSidebar() {
  const { user: currentUser, logout } = useCurrentUser();
  const { projectManualItems, records } = useRecords();
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
    if (!searchQuery) return { menuResults: [], projectResults: [], recordResults: {} };

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const allMenuItems = [...visibleTopLevelItems, ...projectManualItems];
    const menuResults = allMenuItems.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery)
    );

    const projectResults = allProjects.filter(project =>
      project.projectName.toLowerCase().includes(lowerCaseQuery)
    );

    const recordResults = records.filter(record => 
        record.projectName.toLowerCase().includes(lowerCaseQuery) ||
        record.fileName.toLowerCase().includes(lowerCaseQuery)
    ).reduce((acc, record) => {
        const key = record.fileName;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(record);
        return acc;
    }, {} as Record<string, typeof records>);
    
    return { 
        menuResults, 
        projectResults: Array.from(new Map(projectResults.map(p => [p.id, p])).values()), 
        recordResults 
    };
  }, [searchQuery, visibleTopLevelItems, projectManualItems, records]);
  
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
                placeholder="Search menu or projects..."
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
                 {Object.entries(searchResults.recordResults).map(([fileName, fileRecords]) => {
                    const Icon = getIconForFile(fileName);
                    return (
                        <SidebarMenuItem key={fileName}>
                            <span className="text-xs font-semibold text-sidebar-foreground/70 px-3">{fileName}</span>
                            {fileRecords.map(record => {
                                const url = getFormUrlFromFileName(record.fileName, 'dashboard');
                                return (
                                    <Link href={`${url}?id=${record.id}`} key={record.id} passHref>
                                        <SidebarMenuButton>
                                            <Icon className="size-5" />
                                            <span>{record.projectName}</span>
                                        </SidebarMenuButton>
                                    </Link>
                                )
                            })}
                        </SidebarMenuItem>
                    )
                 })}
                {searchResults.menuResults.length === 0 && searchResults.projectResults.length === 0 && Object.keys(searchResults.recordResults).length === 0 && (
                    <p className="text-xs text-center text-sidebar-foreground/70 py-4">No results found.</p>
                )}
             </SidebarMenu>
          ) : (
            <MemoizedSidebarMenu 
                visibleTopLevelItems={visibleTopLevelItems} 
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
