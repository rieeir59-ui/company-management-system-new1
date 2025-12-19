
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
  Edit,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/context/UserContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { allProjects, type ProjectRow } from '@/lib/projects-data';
import { useRecords } from '@/context/RecordContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const topLevelItems = [
    { href: '/employee-dashboard', label: 'My Projects', icon: LayoutDashboard },
    { href: '/employee-dashboard/our-team', label: 'Our Team', icon: Users },
    { href: '/employee-dashboard/about-me', label: 'About Me', icon: User },
    { href: '/employee-dashboard/services', label: 'Services', icon: FileText },
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
const MemoizedSidebarMenu = memo(({ menuItems, projectManualItems, bankTimelineItems }: { menuItems: any[], projectManualItems: any[], bankTimelineItems: any[] }) => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const { addBank, updateBank, deleteBank } = useRecords();
  const [newBankName, setNewBankName] = useState('');
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [bankToEdit, setBankToEdit] = useState<string | null>(null);
  const [bankToDelete, setBankToDelete] = useState<string | null>(null);

  const canManageBanks = useMemo(() => {
    return currentUser && ['software-engineer', 'admin', 'ceo'].some(role => currentUser.departments.includes(role));
  }, [currentUser]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddBank = () => {
    if (newBankName) {
      addBank(newBankName);
      setIsAddBankOpen(false);
      setNewBankName('');
    }
  };

  const handleUpdateBank = () => {
    if (bankToEdit && newBankName) {
      updateBank(bankToEdit, newBankName);
      setBankToEdit(null);
      setNewBankName('');
    }
  };

  const confirmDeleteBank = () => {
    if (bankToDelete) {
      deleteBank(bankToDelete);
      setBankToDelete(null);
    }
  };


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
                    tooltip="Timelines of Bank"
                  >
                    <Landmark className="size-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Timelines of Bank</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                   <SidebarMenuSub>
                    {(bankTimelineItems || []).map((item) => (
                      <SidebarMenuSubItem key={item.href} className="group/sub-item">
                        <Link href={item.href} passHref className="flex-grow">
                          <SidebarMenuSubButton isActive={pathname === item.href}>
                            <item.icon className="size-4 mr-2" />
                            {item.label}
                          </SidebarMenuSubButton>
                        </Link>
                         {canManageBanks && (
                          <div className="flex items-center opacity-0 group-hover/sub-item:opacity-100 transition-opacity">
                            <Dialog onOpenChange={(open) => { if(!open) setBankToEdit(null)}}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {setBankToEdit(item.label); setNewBankName(item.label);}}><Edit className="h-3 w-3"/></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Bank Name</DialogTitle>
                                        <DialogDescription>Rename '{bankToEdit}'.</DialogDescription>
                                    </DialogHeader>
                                    <Input value={newBankName} onChange={(e) => setNewBankName(e.target.value)} />
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button onClick={handleUpdateBank}>Save</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBankToDelete(item.label)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>This will delete the '{bankToDelete}' timeline and all its records. This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setBankToDelete(null)}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={confirmDeleteBank} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                     {canManageBanks && (
                        <Dialog open={isAddBankOpen} onOpenChange={setIsAddBankOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start h-8 mt-1 text-xs">
                                    <PlusCircle className="h-4 w-4 mr-2" /> Add Bank
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Bank</DialogTitle>
                                </DialogHeader>
                                <Input value={newBankName} onChange={(e) => setNewBankName(e.target.value)} placeholder="Enter bank name" />
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <Button onClick={handleAddBank}>Save</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                     )}
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
  const { bankTimelineItems, projectManualItems } = useRecords();
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

    const projectResults = allProjects.filter(project =>
      project.projectName.toLowerCase().includes(lowerCaseQuery)
    );
    
    return { menuResults, projectResults: Array.from(new Map(projectResults.map(p => [p.id, p])).values()) };
  }, [searchQuery, projectManualItems, bankTimelineItems]);
  
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
                projectManualItems={projectManualItems || []}
                bankTimelineItems={bankTimelineItems || []}
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
