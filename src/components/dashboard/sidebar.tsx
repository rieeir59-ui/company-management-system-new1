
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { memo, useState, useEffect, useId, useMemo } from 'react';
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
  LayoutDashboard,
  Users,
  Settings,
  User,
  LogOut,
  KeyRound,
  FileText,
  Database,
  FileUp,
  ClipboardCheck,
  Calendar,
  Search as SearchIcon,
  Landmark,
  Building2,
  Home,
  Briefcase,
  Archive,
  Eye,
  FileSearch,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/context/UserContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { allProjects, type ProjectRow } from '@/lib/projects-data';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/assign-task', label: 'Assign Task', icon: Briefcase },
    { href: '/dashboard/employee', label: 'Employees', icon: Users },
    { href: '/dashboard/team', label: 'Our Team', icon: User },
    { href: '/dashboard/about-me', label: 'About Me', icon: User },
    { href: '/dashboard/services', label: 'Services', icon: FileText },
    { href: '/dashboard/upload-files', label: 'Upload Files', icon: FileUp },
    { href: '/dashboard/files-record', label: 'Files Record', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['software-engineer', 'admin'] },
    { href: '/dashboard/credentials', label: 'Credentials', icon: KeyRound, roles: ['software-engineer', 'admin', 'ceo'] },
];

const bankTimelineItems = [
    { href: '/dashboard/timelines-of-bank/commercial', label: 'Commercial', icon: Building2 },
    { href: '/dashboard/timelines-of-bank/residential', label: 'Residential', icon: Home },
    { href: '/dashboard/timelines-of-bank/askari-bank', label: 'Askari Bank', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/bank-alfalah', label: 'Bank Alfalah', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/bank-al-habib', label: 'Bank Al Habib', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/cbd', label: 'CBD', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/dib', label: 'DIB', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/fbl', label: 'FBL', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/hbl', label: 'HBL', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/mcb', label: 'MCB', icon: Landmark },
    { href: '/dashboard/timelines-of-bank/ubl', label: 'UBL', icon: Landmark },
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
const MemoizedSidebarMenu = memo(({ visibleMenuItems }: { visibleMenuItems: typeof menuItems }) => {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {visibleMenuItems.map((item) => (
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
      <SidebarMenuItem>
        <Link href="/dashboard/saved-records" passHref>
            <SidebarMenuButton
                isActive={pathname === '/dashboard/saved-records'}
                className={cn(pathname === '/dashboard/saved-records' && 'bg-sidebar-accent text-sidebar-accent-foreground', 'group-data-[collapsible=icon]:justify-center')}
                tooltip="Saved Records"
            >
                <Database className="size-5" />
                <span className="group-data-[collapsible=icon]:hidden">Saved Records</span>
            </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
MemoizedSidebarMenu.displayName = 'MemoizedSidebarMenu';

export default function DashboardSidebar() {
  const { user: currentUser, logout } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const bankTimelineId = useId();

  const handleLogout = React.useCallback(() => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/login');
  }, [logout, router, toast]);

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return currentUser && item.roles.includes(currentUser.department);
  });
  
  const searchResults = useMemo(() => {
    if (!searchQuery) return { menuResults: [], projectResults: [] };
    
    const menuResults = visibleMenuItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const projectResults = allProjects.filter(project =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return { menuResults, projectResults };
  }, [searchQuery, visibleMenuItems]);
  
  return (
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary font-bold text-2xl font-headline">
                <Users className="w-8 h-8" />
                <span className="group-data-[collapsible=icon]:hidden">RI-HUB</span>
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
                {searchResults.menuResults.length === 0 && searchResults.projectResults.length === 0 && (
                    <p className="text-xs text-center text-sidebar-foreground/70 py-4">No results found.</p>
                )}
             </SidebarMenu>
          ) : (
            <>
              <MemoizedSidebarMenu visibleMenuItems={visibleMenuItems} />
              <SidebarMenu>
                <SidebarMenuItem>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className="group-data-[collapsible=icon]:justify-center"
                        tooltip="Timelines of Bank"
                      >
                        <Landmark className="size-5" />
                        <span className="group-data-[collapsible=icon]:hidden">Timelines of Bank</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild id={bankTimelineId}>
                      <SidebarMenuSub>
                        {bankTimelineItems.map((item) => (
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
              </SidebarMenu>
            </>
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
