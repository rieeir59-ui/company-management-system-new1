
'use client';

import { MoreHorizontal, PlusCircle, Download, FileText as FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Employee } from '@/lib/employees';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DashboardPageHeader from '@/components/dashboard/PageHeader';
import { PlaceHolderImages } from '@/lib/placeholder-images';


const departments = [
    { name: 'CEO', slug: 'ceo' },
    { name: 'ADMIN', slug: 'admin' },
    { name: 'HR', slug: 'hr' },
    { name: 'SOFTWARE ENGINEER', slug: 'software-engineer' },
    { name: 'DRAFTPERSONS', slug: 'draftpersons' },
    { name: '3D VISULIZER', slug: '3d-visualizer' },
    { name: 'ARCHITECTS', slug: 'architects' },
    { name: 'FINANCE', slug: 'finance' },
    { name: 'QUANTITY MANAGEMENT', slug: 'quantity-management' },
];

function getFirstLetter(name: string) {
    return name ? name.charAt(0).toUpperCase() : '';
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export default function EmployeePage() {
  const { user: currentUser, employees, updateEmployee } = useCurrentUser();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const image = PlaceHolderImages.find(p => p.id === 'employee-record');
  
  const { toast } = useToast();

  const canManageEmployees = currentUser && Array.isArray(currentUser.departments) && ['software-engineer', 'admin', 'ceo'].some(role => currentUser.departments.includes(role));

  const handleAddEmployee = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageEmployees) return;
    
    toast({ title: "Action Not Implemented", description: "Adding employees is currently disabled."})
    setIsAddDialogOpen(false);
  };

  const handleEditEmployee = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployee || !canManageEmployees) return;

    const formData = new FormData(event.currentTarget);
    const updatedData: Partial<Employee> = {};

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const contact = formData.get('contact') as string;
    const departments = formData.getAll('departments') as string[];
    const password = formData.get('password') as string;

    if (name && name !== selectedEmployee.name) updatedData.name = name;
    if (email && email !== selectedEmployee.email) updatedData.email = email;
    if (contact && contact !== selectedEmployee.contact) updatedData.contact = contact;
    
    // Check if departments array is different
    if (departments.length > 0 && (departments.length !== selectedEmployee.departments.length || departments.some(d => !selectedEmployee.departments.includes(d)))) {
        updatedData.departments = departments;
    }

    if (password && password !== selectedEmployee.password) updatedData.password = password;
    
    if (Object.keys(updatedData).length > 0) {
      updateEmployee(selectedEmployee.uid, updatedData);
      toast({ title: "Success", description: `${updatedData.name || selectedEmployee.name}'s details have been updated.`})
    } else {
      toast({ title: "No Changes", description: "No details were changed."})
    }
    
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = () => {
    if (!selectedEmployee || !canManageEmployees) return;

    toast({ title: "Action Not Implemented", description: "Deleting employees is currently disabled."})
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const footerText = "Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522 , info@isbahhassan.com , www.isbahhassan.com";

    doc.autoTable({
      head: [['Name', 'Email', 'Departments']],
      body: employees.map(emp => [
        emp.name,
        emp.email,
        emp.departments.map(d => departments.find(dept => dept.slug === d)?.name || d).join(', ')
      ]),
      didDrawPage: function (data) {
        // Add footer to all pages
        doc.setFontSize(8);
        doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
      }
    });

    doc.save('employee-list.pdf');
  }

  const handleDownloadCsv = () => {
    const csvHeader = ['Name', 'Email', 'Departments'];
    const csvRows = employees.map(emp => [
      `"${emp.name}"`,
      `"${emp.email}"`,
      `"${emp.departments.map(d => departments.find(dept => dept.slug === d)?.name || d).join(', ')}"`
    ]);

    const csvContent = [
      csvHeader.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee-list.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <DashboardPageHeader
        title="Employees"
        description="Manage your company's employee records."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>Manage your company's employee records.</CardDescription>
            </div>
            {canManageEmployees && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Add Employee
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new employee below.
                    </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddEmployee}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" name="name" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" name="email" type="email" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right">Contact</Label>
                        <Input id="contact" name="contact" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="departments" className="text-right pt-2">Departments</Label>
                          <select id="departments" name="departments" multiple required className="col-span-3 border border-input rounded-md p-2 text-sm h-32">
                            {departments.map(dept => (
                              <option key={dept.slug} value={dept.slug}>{dept.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input id="password" name="password" type="password" className="col-span-3" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit">Save Employee</Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
                </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departments</TableHead>
                {canManageEmployees && (
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                  <TableRow key={employee.record}>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-secondary-foreground font-bold text-2xl">
                        {getFirstLetter(employee.name)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="font-bold">{employee.name}</div>
                      <div className="text-sm text-muted-foreground md:hidden">{employee.email}</div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.departments.map(d => departments.find(dept => dept.slug === d)?.name || d).join(', ')}</TableCell>
                    {canManageEmployees && (
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(employee)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(employee)} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    )}
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{employees.length}</strong> of <strong>{employees.length}</strong> employees
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1" onClick={handleDownloadCsv}>
              <FileDown className="h-4 w-4" />
              Download CSV
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update the details for {selectedEmployee?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployee}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedEmployee?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={selectedEmployee?.email} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contact" className="text-right">Contact</Label>
                <Input id="edit-contact" name="contact" defaultValue={selectedEmployee?.contact} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-departments" className="text-right pt-2">Departments</Label>
                  <select id="edit-departments" name="departments" multiple defaultValue={selectedEmployee?.departments} required className="col-span-3 border border-input rounded-md p-2 text-sm h-32">
                    {departments.map(dept => (
                      <option key={dept.slug} value={dept.slug}>{dept.name}</option>
                    ))}
                  </select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-password" className="text-right">Password</Label>
                  <Input id="edit-password" name="password" type="password" defaultValue={selectedEmployee?.password} className="col-span-3" required />
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee record for {selectedEmployee?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
