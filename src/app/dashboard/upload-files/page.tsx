
'use client';

import { useState, useCallback, Suspense, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileUp, PlusCircle, Trash2, Building, Home, Hotel, Landmark, UploadCloud } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CreatableSelect } from '@/components/ui/creatable-select';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useFileRecords } from "@/context/FileContext";
import { useRecords } from "@/context/RecordContext";
import { useCurrentUser } from "@/context/UserContext";

type FileUpload = {
  id: number;
  file: File | null;
  customName: string;
  bankName?: string;
  isUploading?: boolean;
  progress?: number;
  isUploaded?: boolean;
  error?: string;
};

const categories = [
    { name: "Banks", icon: Landmark },
    { name: "Residential", icon: Home },
    { name: "Commercial", icon: Building },
    { name: "Hotels", icon: Hotel }
];
const initialBanks = ["MCB", "DIB", "FAYSAL", "UBL", "HBL", "Askari Bank", "Bank Alfalah", "Bank Al Habib", "CBD"];

const UploadForm = ({ category }: { category: string }) => {
    const [uploads, setUploads] = useState<FileUpload[]>([{ id: 1, file: null, customName: '', bankName: ''}]);
    const [banks, setBanks] = useState<string[]>(initialBanks);
    const { toast } = useToast();
    const { addFileRecord } = useFileRecords();
    const { addRecord } = useRecords();
    const { user: currentUser } = useCurrentUser();

    const handleUpload = useCallback(async (upload: FileUpload) => {
        if (!upload.file || !upload.customName || !currentUser) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a custom name and choose a file.' });
            return;
        }
        if (category === 'Banks' && !upload.bankName) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a bank name for the Banks category.' });
            return;
        }
        
        setUploads(prev => prev.map(up => up.id === upload.id ? { ...up, isUploading: true, progress: 0, error: undefined } : up));

        try {
            const fileRecordData = {
                category: category,
                bankName: upload.bankName,
                customName: upload.customName,
                originalName: upload.file.name,
                fileType: upload.file.type,
                size: upload.file.size,
            };

            const savedDocRef = await addFileRecord(fileRecordData, upload.file, (progress) => {
                setUploads(prev => prev.map(up => up.id === upload.id ? { ...up, progress } : up));
            });

            if (savedDocRef) {
                await addRecord({
                  fileName: 'Uploaded File',
                  projectName: upload.customName,
                  data: [{
                    category: 'File Upload Details',
                    items: [
                      { label: 'File ID', value: savedDocRef.id },
                      { label: 'Category', value: category },
                      ...(category === 'Banks' ? [{ label: 'Bank', value: upload.bankName }] : []),
                      { label: 'Custom Name', value: upload.customName },
                      { label: 'Original Name', value: upload.file.name },
                      { label: 'File Type', value: upload.file.type },
                      { label: 'Size (Bytes)', value: upload.file.size.toString() },
                    ]
                  }]
                } as any);
            }

            setUploads(prev => prev.map(up => up.id === upload.id ? { ...up, isUploading: false, isUploaded: true } : up));
            toast({ title: 'File Uploaded', description: `"${upload.customName}" has been successfully uploaded and recorded.` });

            setTimeout(() => {
                setUploads(prev => {
                    const remaining = prev.filter(up => up.id !== upload.id);
                    return remaining.length > 0 ? remaining : [{ id: Date.now(), file: null, customName: '', bankName: '' }];
                });
            }, 2000);
        } catch (error) {
             setUploads(prev => prev.map(up => up.id === upload.id ? { ...up, isUploading: false, error: 'Upload failed. Check console & permissions.' } : up));
        }
    }, [category, addFileRecord, addRecord, toast, currentUser]);


    const handleFileChange = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setUploads(prev => prev.map(up => up.id === id ? { ...up, file, customName: up.customName || file.name.split('.').slice(0, -1).join('.'), error: undefined } : up));
        }
    };

    const handleFieldChange = (id: number, field: keyof FileUpload, value: string) => {
        setUploads(prev => prev.map(up => (up.id === id ? { ...up, [field]: value } : up)));
    };

    const addFileUpload = () => {
        setUploads(prev => [...prev, { id: Date.now(), file: null, customName: '', bankName: '' }]);
    };

    const removeFileUpload = (id: number) => {
        setUploads(prev => prev.filter(up => up.id !== id));
    };

    const handleCreateBank = (newBank: string) => {
        if (!banks.find(b => b.toLowerCase() === newBank.toLowerCase())) {
            setBanks(prev => [...prev, newBank]);
        }
    };
    
    return (
        <div className="space-y-4 mt-4">
            {uploads.map((upload) => (
                <div key={upload.id} className="p-4 border rounded-lg relative bg-muted/50">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeFileUpload(upload.id)} disabled={upload.isUploading}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-4">
                        <div className="md:col-span-2 lg:col-span-4">
                            <Label htmlFor={`file-${upload.id}`} className={cn("flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted", { 'opacity-50 cursor-not-allowed': upload.isUploading })}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    {upload.file && <p className="text-xs text-gray-600 font-medium">{upload.file.name}</p>}
                                </div>
                                <Input id={`file-${upload.id}`} type="file" onChange={(e) => handleFileChange(upload.id, e)} disabled={upload.isUploading} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.dwg,.dxf,.skp,.bak" />
                            </Label>
                        </div>

                        {category === 'Banks' && (
                            <div className="space-y-2">
                                <Label htmlFor={`bank-${upload.id}`}>Bank Name</Label>
                                <CreatableSelect
                                    options={banks}
                                    value={upload.bankName}
                                    onChange={(value) => handleFieldChange(upload.id, 'bankName', value)}
                                    onCreate={handleCreateBank}
                                    placeholder="Select or create a bank"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor={`name-${upload.id}`}>File Name</Label>
                            <Input id={`name-${upload.id}`} placeholder="Enter a custom name" value={upload.customName} onChange={e => handleFieldChange(upload.id, 'customName', e.target.value)} disabled={upload.isUploading} />
                        </div>

                         <div className="space-y-2">
                            <Button onClick={() => handleUpload(upload)} disabled={!upload.file || !upload.customName || upload.isUploading || upload.isUploaded} className="w-full">
                                <FileUp className="mr-2 h-4 w-4" />
                                {upload.isUploading ? `Uploading...` : (upload.isUploaded ? 'Uploaded' : 'Upload')}
                            </Button>
                        </div>
                    </div>
                     {(upload.isUploading || upload.isUploaded) && (
                        <div className="mt-2">
                            <Progress value={upload.progress} className="w-full h-2" />
                            {upload.error && <p className="text-destructive text-sm mt-1">{upload.error}</p>}
                        </div>
                    )}
                </div>
            ))}
            <Button variant="outline" onClick={addFileUpload}>
                <PlusCircle className="mr-2 h-4 w-4" />Add Another File
            </Button>
        </div>
    );
};

function UploadFilesPageContent() {
    const image = PlaceHolderImages.find(p => p.id === 'upload-files');
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category');
    
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'Banks');

    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    return (
        <div className="space-y-8">
            <DashboardPageHeader
                title="Upload Files"
                description="Upload project documents, images, or other files."
                imageUrl={image?.imageUrl || ''}
                imageHint={image?.imageHint || ''}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Select a Category</CardTitle>
                    <CardDescription>Choose a category to upload files to.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {categories.map(({ name, icon: Icon }) => (
                             <Card
                                key={name}
                                className={cn(
                                    "p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent hover:border-primary transition-all",
                                    selectedCategory === name ? "bg-accent border-primary ring-2 ring-primary" : ""
                                )}
                                onClick={() => setSelectedCategory(name)}
                            >
                                <Icon className="w-12 h-12 text-primary" />
                                <p className="font-semibold text-lg">{name}</p>
                            </Card>
                        ))}
                    </div>

                    {selectedCategory && (
                        <div className="mt-8">
                             <h2 className="text-2xl font-bold mb-4">Upload to {selectedCategory}</h2>
                             <UploadForm category={selectedCategory} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function UploadFilesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadFilesPageContent />
    </Suspense>
  )
}
