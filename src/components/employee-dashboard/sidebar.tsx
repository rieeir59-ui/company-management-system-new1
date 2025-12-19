
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
  Folder,
  Briefcase,
  Book,
  File,
  ClipboardCheck,
  UserCheck,
  Building,
  FilePlus,
  Compass,
  FileSearch,
  BookUser,
  FileSignature,
  FileKey,
  Scroll,
  BarChart2,
  Calendar,
  Wallet,
  CheckSquare,
  FileX,
  FilePen,
  File as FileIcon,
  FileUp,
  CircleDollarSign,
  Clipboard,
  Presentation,
  Package,
  ListChecks,
  Palette,
  Clock,
  BookCopy,
  UserCog,
  Landmark,
  Building2,
  Home,
  Save,
  Eye,
  Archive,
  Search as SearchIcon,
  Settings,
  KeyRound,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/context/UserContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { allProjects, bankProjectsMap, type ProjectRow } from '@/lib/projects-data';

const topLevelItems = [
    { href: '/employee-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employee-dashboard/our-team', label: 'Our Team', icon: Users },
    { href: '/employee-dashboard/about-me', label: 'About Me', icon: User },
    { href: '/employee-dashboard/services', label: 'Services', icon: FileText },
    { href: '/employee-dashboard/daily-report', label: 'Daily Report', icon: ClipboardList },
    { href: '/employee-dashboard/site-visit', label: 'Site Visit', icon: Eye },
    { href: '/employee-dashboard/site-survey-report', label: 'Site Survey Report', icon: FileSearch },
    { href: '/employee-dashboard/site-survey', label: 'Site Survey', icon: Compass },
    { href: '/employee-dashboard/field-reports-meetings', label: 'Field Reports/Meetings', icon: Presentation },
    { href: '/employee-dashboard/upload-files', label: 'Upload Files', icon: FileUp },
    { href: '/employee-dashboard/saved-records', label: 'Saved Records', icon: Database },
];

const projectManualItems = [
    { href: '/employee-dashboard/project-checklist', label: 'Project Checklist', icon: ListChecks },
    { href: '/employee-dashboard/project-information', label: 'Project Information', icon: Folder },
    { href: '/employee-dashboard/predesign-assessment', label: 'Predesign Assessment', icon: FileSearch },
    { href: '/employee-dashboard/project-data', label: 'Project Data', icon: Database },
    { href: '/employee-dashboard/project-agreement', label: 'Project Agreement', icon: FileSignature },
    { href: '/employee-dashboard/list-of-services', label: 'List of Services', icon: Clipboard },
    { href: '/employee-dashboard/project-bylaws', label: 'Project Bylaws', icon: FileKey },
    { href: '/employee-dashboard/proposal-request', label: 'Proposal Request', icon: Briefcase },
    { href: '/employee-dashboard/drawings', label: 'Drawings', icon: Palette },
    { href: '/employee-dashboard/shop-drawings-record', label: 'Shop Drawings Record', icon: FileIcon },
    { href: '/employee-dashboard/project-chart-studio', label: 'Project Chart (Studio)', icon: BarChart2 },
    { href: '/employee-dashboard/list-of-sub-consultants', label: 'List Of Sub-consultants', icon: BookUser },
    { href: '/employee-dashboard/list-of-contractors', label: 'List of Contractors', icon: Building },
    { href: '/employee-dashboard/list-of-approved-vendors', label: 'List of Approved Vendors', icon: UserCheck },
    { href: '/employee-dashboard/time-line-schedule', label: 'Time line Schedule', icon: Clock },
    { href: '/employee-dashboard/project-application-summary', label: 'Project Application Summary', icon: CheckSquare },
    { href: '/employee-dashboard/continuation-sheet', label: 'Continuation Sheet', icon: FileX },
    { href: '/employee-dashboard/construction-schedule', label: 'Construction Schedule', icon: Calendar },
    { href: '/employee-dashboard/preliminary-project-budget', label: 'Preliminary Project Budget', icon: Scroll },
    { href: '/employee-dashboard/bill-of-quantity', label: 'Bill Of Quantity', icon: Wallet },
    { href: '/employee-dashboard/rate-analysis', label: 'Rate Analysis', icon: BarChart2 },
    { href: '/employee-dashboard/change-order', label: 'Change Order', icon: Book },
    { href: '/employee-dashboard/payment-certificates', label: 'Payment Certificates', icon: CircleDollarSign },
    { href: '/employee-dashboard/instruction-sheet', label: 'Instruction Sheet', icon: FileUp },
    { href: '/employee-dashboard/other-provisions', label: 'Other Provisions', icon: BookCopy },
    { href: '/employee-dashboard/consent-of-surety', label: 'Consent of Surety', icon: FilePen },
    { href: '/employee-dashboard/substantial-summary', label: 'Substantial Summary', icon: Clipboard },
    { href: '/employee-dashboard/total-project-package', label: 'Total Project Package', icon: Package },
    { href: '/employee-dashboard/architects-instructions', label: 'Architects Instructions', icon: User },
    { href: '/employee-dashboard/construction-change-director', label: 'Construction Change Director', icon: Users },
    { href: '/employee-dashboard/document-summarizer', label: 'Document Summarizer', icon: FileText },
    { href: '/employee-dashboard/employee-record', label: 'Employee Record', icon: UserCog },
];


const bankTimelineItems = [
    { href: '/employee-dashboard/timelines-of-bank/commercial', label: 'Commercial', icon: Building2 },
    { href: '/employee-dashboard/timelines-of-bank/residential', label: 'Residential', icon: Home },
    { href: '/employee-dashboard/timelines-of-bank/askari-bank', label: 'Askari Bank', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/bank-alfalah', label: 'Bank Alfalah', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/bank-al-habib', label: 'Bank Al Habib', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/cbd', label: 'CBD', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/dib', label: 'DIB', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/fbl', label: 'FBL', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/hbl', label: 'HBL', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/mcb', label: 'MCB', icon: Landmark },
    { href: '/employee-dashboard/timelines-of-bank/ubl', label: 'UBL', icon: Landmark },
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
const MemoizedSidebarMenu = memo(({ menuItems, bankTimelineItems }: { menuItems: any[], bankTimelineItems: any[] }) => {
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
                    tooltip="Timelines of Bank"
                  >
                    <Landmark className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Timelines of Bank</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
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
    if (!searchQuery) return { menuResults: [], projectResults: [] };

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const allMenuItems = [...topLevelItems, ...projectManualItems, ...bankTimelineItems];

    const menuResults = allMenuItems.filter(item =>
      item.label.toLowerCase().includes(lowerCaseQuery)
    );

    let projectResults: ProjectRow[] = [];

    const matchingBank = Object.keys(bankProjectsMap).find(bankKey =>
        bankKey.toLowerCase().includes(lowerCaseQuery)
    );

    if (matchingBank) {
      projectResults = bankProjectsMap[matchingBank];
    } else {
      projectResults = allProjects.filter(project =>
        project.projectName.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    const uniqueProjectResults = Array.from(new Map(projectResults.map(p => [p.id, p])).values());

    return { menuResults, projectResults: uniqueProjectResults };
  }, [searchQuery]);
  
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
                {searchResults.menuResults.length === 0 && searchResults.projectResults.length === 0 && (
                    <p className="text-xs text-center text-sidebar-foreground/70 py-4">No results found.</p>
                )}
             </SidebarMenu>
          ) : (
            <MemoizedSidebarMenu 
                menuItems={topLevelItems} 
                bankTimelineItems={bankTimelineItems}
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
