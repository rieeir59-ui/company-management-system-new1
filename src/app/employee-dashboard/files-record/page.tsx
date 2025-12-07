
'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Download, Trash2, Edit, Loader2, Landmark, Home, Building, Hotel, ExternalLink } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useFileRecords, type UploadedFile } from '@/context/FileContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const categories = [
    { name: "Banks", icon: Landmark },
    { name: "Residential", icon: Home },
    { name: "Commercial", icon: Building },
    { name: "Hotels", icon: Hotel }
];

export default function FilesRecordPage() {
  const image = PlaceHolderImages.find(p => p.id === 'files-record');
  const { toast } = useToast();
  const { user: currentUser, isUserLoading } = useCurrentUser();
  const { fileRecords: allFileRecords, isLoading, error, updateFileRecord, deleteFileRecord } = useFileRecords();

  const fileRecords = useMemo(() => {
    if (!currentUser) return [];
    return allFileRecords.filter(file => file.employeeId === currentUser.uid);
  }, [allFileRecords, currentUser]);

  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [fileToEdit, setFileToEdit] = useState<UploadedFile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const filesByCategory = useMemo(() => {
    const grouped: Record<string, UploadedFile[]> = {};
    categories.forEach(category => {
      grouped[category.name] = fileRecords.filter(file => file.category === category.name);
    });
    return grouped;
  }, [fileRecords]);
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const openDeleteDialog = (file: UploadedFile) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
        await deleteFileRecord(fileToDelete.id);
        toast({ title: 'Success', description: `File record for "${fileToDelete.customName}" deleted.` });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete file record.' });
    } finally {
        setIsDeleteDialogOpen(false);
    }
  };
  
  const openEditDialog = (file: UploadedFile) => {
    setFileToEdit(file);
    setNewFileName(file.customName);
    setIsEditDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!fileToEdit || !newFileName) return;
    try {
        await updateFileRecord(fileToEdit.id, { customName: newFileName });
        toast({ title: 'Success', description: 'File name updated.' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update file name.' });
    } finally {
        setIsEditDialogOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Your Files Record"
        description="View and manage your uploaded project files."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
      {isLoading || isUserLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : error ? (
        <Card className="text-center py-8"><CardContent><p className="text-destructive">{error}</p></CardContent></Card>
      ) : (
        <div className="space-y-8">
          {categories.map(({ name, icon: Icon }) => (
            filesByCategory[name] && filesByCategory[name].length > 0 && (
              <Card key={name}>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Icon className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>{name} Files</CardTitle>
                            <CardDescription>Documents you uploaded under the {name.toLowerCase()} category.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    {name === 'Banks' && <TableHead>Bank</TableHead>}
                                    <TableHead>Original Name</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filesByCategory[name].map(file => (
                                    <TableRow key={file.id}>
                                        <TableCell className="font-medium">
                                            <a href={file.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary flex items-center gap-1">
                                                {file.customName} <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </TableCell>
                                        {name === 'Banks' && <TableCell>{file.bankName || 'N/A'}</TableCell>}
                                        <TableCell className="text-muted-foreground">{file.originalName}</TableCell>
                                        <TableCell>{formatBytes(file.size)}</TableCell>
                                        <TableCell>{file.createdAt.toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-1 justify-end">
                                                <Button asChild variant="ghost" size="icon" title="Download">
                                                    <a href={file.fileUrl || '#'} target="_blank" rel="noopener noreferrer" download={file.originalName}>
                                                        <Download className="h-4 w-4"/>
                                                    </a>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(file)} title="Edit">
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(file)} title="Delete">
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
              </Card>
            )
          ))}
           {fileRecords.length === 0 && (
             <Card className="text-center py-12">
                <CardHeader>
                    <CardTitle>No Files Found</CardTitle>
                    <CardDescription>You have not uploaded any files yet.</CardDescription>
                </CardHeader>
            </Card>
          )}
        </div>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the file "{fileToDelete?.customName}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit File Name</DialogTitle>
                <DialogDescription>
                    Change the custom name for "{fileToEdit?.originalName}".
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
                <Label htmlFor="edit-name">Custom File Name</Label>
                <Input id="edit-name" value={newFileName} onChange={e => setNewFileName(e.target.value)} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={confirmEdit}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
