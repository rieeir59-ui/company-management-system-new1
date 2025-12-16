
'use client';

import { useState } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { useRecords } from '@/context/RecordContext';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const SectionTable = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-3 pb-2 border-b-2 border-primary">{title}</h2>
        <Table>
            <TableBody>
                {children}
            </TableBody>
        </Table>
    </section>
);

const FormRow = ({ label, children }: { label: React.ReactNode; children: React.ReactNode; }) => (
    <TableRow>
        <TableCell className="font-semibold w-1/3">{label}</TableCell>
        <TableCell>{children}</TableCell>
    </TableRow>
);

export default function ProjectDataPage() {
    const image = PlaceHolderImages.find(p => p.id === 'site-survey');
    const { toast } = useToast();
    const { addRecord } = useRecords();
    const [projectName, setProjectName] = useState('');
    const [formState, setFormState] = useState<Record<string, any>>({});

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCheckboxChange = (name: string, value: boolean) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleRadioLikeCheckboxChange = (groupName: string, value: string) => {
        setFormState(prev => {
            const newState = { ...prev };
            // For a radio-like group, we need to turn off other options
            const groupOptions = (form.elements.namedItem(groupName) as any)?.elements;
             if(groupOptions) {
                for (const option of groupOptions) {
                    if (option.id !== `${groupName}_${value}`) {
                        newState[option.id] = false;
                    }
                }
            }
            newState[`${groupName}_${value}`] = true; // Turn on the selected one
            return newState;
        });
    };

    const handleSave = () => {
        const dataToSave = {
            fileName: "Site Survey Report",
            projectName: projectName || 'Untitled Site Survey',
            data: [{
                category: 'Site Survey Data',
                items: Object.entries(formState).map(([key, value]) => ({ label: key, value: String(value) }))
            }]
        };

        addRecord(dataToSave as any);
    }

    const handleDownloadPdf = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        let yPos = 15;
        
        const primaryColor = [45, 95, 51];
        const headingFillColor = [240, 240, 240];
        
        const getInputValue = (id: string) => formState[id] || '';
        const getCheckboxValue = (id: string) => !!formState[id];

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ISBAH HASSAN & ASSOCIATES', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Premises Review for all Projects', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFontSize(8);
        doc.text('This questionnaire form provides preliminary information for determining the suitability of premises or property to be acquired', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SITE SURVEY', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        doc.text(`Date: ${getInputValue('location_date')}`, pageWidth - margin, yPos, { align: 'right'});
        yPos += 7;
        
        const addSectionTitle = (title: string) => {
            if (yPos > 260) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.5);
            doc.setFillColor(headingFillColor[0], headingFillColor[1], headingFillColor[2]);
            doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(title, margin + 2, yPos + 5.5);
            yPos += 10;
        };

        const drawField = (label: string, value: string) => {
          if (yPos > 275) { doc.addPage(); yPos = 20; }
          doc.setLineWidth(0.2);
          doc.rect(margin, yPos, pageWidth - margin * 2, 8);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(label, margin + 2, yPos + 5.5);
          doc.text(value, margin + 60, yPos + 5.5);
          yPos += 8;
        };
        
        const drawCheckboxField = (label: string, options: {id: string, label: string}[]) => {
            if (yPos > 275) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.2);
            doc.rect(margin, yPos, pageWidth - margin * 2, 8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(label, margin + 2, yPos + 5.5);
            let xOffset = 60;
            options.forEach(opt => {
                const labelWidth = doc.getTextWidth(opt.label) + 6;
                 if (margin + xOffset + labelWidth > pageWidth - margin) {
                    yPos += 8;
                    xOffset = 60;
                    doc.rect(margin, yPos, pageWidth - margin * 2, 8);
                }
                doc.rect(margin + xOffset, yPos + 2, 4, 4);
                if(getCheckboxValue(opt.id)) {
                  doc.setFont('ZapfDingbats');
                  doc.text('✓', margin + xOffset + 0.5, yPos + 5.5);
                  doc.setFont('helvetica');
                }
                doc.text(opt.label, margin + xOffset + 6, yPos + 5.5);
                xOffset += labelWidth + 10;
            });
            yPos += 8;
        };
        
        const drawRadioLikeCheckboxField = (label: string, name: string, options: string[]) => {
            if (yPos > 275) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.2);
            doc.rect(margin, yPos, pageWidth - margin * 2, 8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(label, margin + 2, yPos + 5.5);
            let xOffset = 60;
            options.forEach(opt => {
                const isChecked = getCheckboxValue(`${name}_${opt.toLowerCase().replace(/ /g, '_')}`);
                doc.rect(margin + xOffset, yPos + 2, 4, 4);
                if (isChecked) {
                    doc.setFont('ZapfDingbats');
                    doc.text('✓', margin + xOffset + 0.5, yPos + 5.5);
                    doc.setFont('helvetica');
                }
                doc.text(opt, margin + xOffset + 6, yPos + 5.5);
                xOffset += 40;
            });
             yPos += 8;
        }

        // --- SECTIONS ---
        addSectionTitle('Project Information');
        drawField('Project Name', getInputValue('project_name_header'));
        
        addSectionTitle('Location');
        drawCheckboxField('Purpose', [
          {id: 'purpose_house', label: 'House'},
          {id: 'purpose_office', label: 'Office'},
          {id: 'purpose_residential', label: 'Residential'},
          {id: 'purpose_others', label: 'Others'},
        ]);
        drawField('City', getInputValue('location_city'));
        drawField('Region', getInputValue('location_region'));
        drawField('Address', getInputValue('location_address'));

        addSectionTitle('Legal File');
        drawField('Name of Owner', getInputValue('legal_owner_name'));
        drawRadioLikeCheckboxField('Is Completion Certificate available', 'completion_cert', ['Yes', 'No']);
        drawRadioLikeCheckboxField('Is the property leased', 'is_leased', ['Yes', 'No']);

        addSectionTitle('Area');
        drawField('Maximum frontage:', getInputValue('area_frontage'));
        drawField('Maximum Depth:', getInputValue('area_depth'));
        drawField('Total Area in Sqft', getInputValue('area_total'));
        drawField('Minimum clear height (ft)', getInputValue('area_height'));
        drawField('Building plot size of which premises is a part independent land', getInputValue('area_plot_size'));
        drawField('Covered Area', getInputValue('area_covered'));
        drawField('No. of Stories / floors', getInputValue('area_stories'));
        
        addSectionTitle('Bounded As');
        drawField('Front', getInputValue('bounded_front'));
        drawField('Back', getInputValue('bounded_back'));
        drawField('Right', getInputValue('bounded_right'));
        drawField('Left', getInputValue('bounded_left'));
        
        doc.addPage();
        yPos = 20;

        addSectionTitle('Utilities');
        drawField('Sanctioned electrical load', getInputValue('sanctioned_load_text'));
        drawRadioLikeCheckboxField('Type of electrical load', 'electrical_load_type', ['Commercial', 'Industrial', 'Residential']);
        drawField('Electrical Meter', getInputValue('electrical_meter'));
        drawRadioLikeCheckboxField('Piped water available', 'piped_water', ['Yes', 'No']);
        drawRadioLikeCheckboxField('Underground tank', 'underground_tank', ['Yes', 'No']);
        drawRadioLikeCheckboxField('Overhead tank', 'overhead_tank', ['Yes', 'No']);
        drawField('Type of Overhead tank', getInputValue('overhead_tank_type'));
        drawField('Type of water', getInputValue('water_type'));
        drawRadioLikeCheckboxField('Gas Connection', 'gas_connection', ['Yes', 'No']);
        drawRadioLikeCheckboxField('Connected to Sewerage line', 'sewerage_connection', ['Yes', 'No']);

        addSectionTitle('Building overview');
        drawRadioLikeCheckboxField('Independent premises', 'independent_premises', ['Yes', 'No']);
        drawRadioLikeCheckboxField('Status', 'property_status', ['Commercial', 'Residential', 'Industrial']);
        drawField('Other Status', getInputValue('status_other_text'));
        drawRadioLikeCheckboxField('Type of Premises', 'premises_type', ['Residence', 'Offices', 'Godowns']);
        drawField('Other Premises Type', getInputValue('prem_other_text'));
        drawRadioLikeCheckboxField('Age of Premises', 'building_age', ['0-5', '5-10', '>10 years']);
        drawRadioLikeCheckboxField('Interior of Premises', 'interior_type', ['Single Hall', 'Rooms']);
        drawRadioLikeCheckboxField('Type of construction', 'construction_type', ['Beam-Column in RCC', 'Composite', 'Load Bearing']);

        doc.addPage();
        yPos = 20;

        addSectionTitle('Building Details');
        drawRadioLikeCheckboxField('Seepage', 'seepage', ['Yes', 'No']);
        drawField('Area of seepage', getInputValue('seepage_area'));
        drawField('Cause of Seepage', getInputValue('seepage_cause'));
        drawCheckboxField('Property Utilization', [
            { id: 'util_residential', label: 'Residential' },
            { id: 'util_commercial', label: 'Commercial' },
            { id: 'util_dual', label: 'Dual use' },
            { id: 'util_industrial', label: 'Industrial' },
        ]);
        drawField('Condition of roof waterproofing', getInputValue('roof_waterproofing'));
        drawCheckboxField('Parking available', [
            { id: 'parking_yes', label: 'Yes' },
            { id: 'parking_main_road', label: 'On Main Road' },
            { id: 'parking_no', label: 'No' },
        ]);
        drawRadioLikeCheckboxField('Approachable through Road', 'approachable', ['Yes', 'No']);
        drawField('Wall masonary material', getInputValue('wall_material'));
        drawCheckboxField('Major retainable building elements', [
            { id: 'retainable_water_tank', label: 'Water tank' },
            { id: 'retainable_subflooring', label: 'Subflooring' },
            { id: 'retainable_staircase', label: 'Staircase' },
        ]);
        drawField('Other retainable', getInputValue('retainable_other_text'));
        drawField('Plot level from road', getInputValue('plot_level'));
        drawRadioLikeCheckboxField('Building Control Violations', 'violations', ['Major', 'Minor', 'None']);
        
        addSectionTitle('Rental Detail');
        drawField('Acquisition', getInputValue('rental_acquisition'));
        drawField('Expected Rental /month', getInputValue('rental_expected_rent'));
        drawField('Expected Advance', getInputValue('rental_expected_advance'));
        drawField('Expected period of lease', getInputValue('rental_lease_period'));
        drawField('Annual increase in rental', getInputValue('rental_annual_increase'));
        
        addSectionTitle('Survey Conducted By');
        drawField('Name', getInputValue('survey_conducted_by_name'));
        drawField('Designation', getInputValue('survey_conducted_by_designation'));
        drawField('Contact', getInputValue('survey_conducted_by_contact'));
        drawField('Cell', getInputValue('survey_conducted_by_cell'));
        drawField('Landline', getInputValue('survey_conducted_by_landline'));
        drawField('Email', getInputValue('survey_conducted_by_email'));
        drawField('Date', getInputValue('survey_conducted_by_date'));
        
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }


        doc.save('site-survey.pdf');
        
        toast({
            title: "Download Started",
            description: "Your project data PDF is being generated.",
        });
    }
    
    return (
        <div className="space-y-8 project-data-page">
            <div className='no-print'>
                <DashboardPageHeader
                    title="Site Survey"
                    description="Conduct and record a detailed site survey."
                    imageUrl={image?.imageUrl || ''}
                    imageHint={image?.imageHint || ''}
                />
            </div>

            <Card>
                <CardHeader>
                    <div className="text-center">
                        <p className="text-sm font-bold text-muted-foreground">ISBAH HASSAN & ASSOCIATES</p>
                        <CardDescription>
                            Premises Review for all Projects
                        </CardDescription>
                        <p className="text-xs mt-2 max-w-2xl mx-auto">This questionnaire form provides preliminary information for determining the suitability of premises or property to be acquired</p>
                         <div className="flex justify-between items-center mt-4">
                            <CardTitle className="font-headline text-4xl text-primary">SITE SURVEY</CardTitle>
                             <div className="flex items-center gap-2">
                                <Label htmlFor="location_date">Date</Label>
                                <Input type="date" id="location_date" name="location_date" className="w-fit" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form id="site-survey-form" className="space-y-8">
                       <SectionTable title="Project Information">
                           <FormRow label="Project Name">
                                <Input id="project_name_header" name="project_name_header" className="text-lg" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                           </FormRow>
                        </SectionTable>

                        <SectionTable title="Location">
                           <FormRow label="Purpose">
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_house" id="purpose_house" /> <Label htmlFor="purpose_house">House</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_office" id="purpose_office" /> <Label htmlFor="purpose_office">Office</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_residential" id="purpose_residential" /> <Label htmlFor="purpose_residential">Residential</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_others" id="purpose_others" /> <Label htmlFor="purpose_others">Others</Label></div>
                               </div>
                            </FormRow>
                            <FormRow label="City"><Input name="location_city" /></FormRow>
                            <FormRow label="Region"><Input name="location_region" /></FormRow>
                            <FormRow label="Address"><Input name="location_address" /></FormRow>
                        </SectionTable>

                        <SectionTable title="Legal File">
                            <FormRow label="Name of Owner"><Input name="legal_owner_name" /></FormRow>
                            <FormRow label="Is Completion Certificate available">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2"><Checkbox id="completion_cert_yes" name="completion_cert_yes"/><Label htmlFor="completion_cert_yes">Yes</Label></div>
                                  <Label>As informed by Owner Representative</Label>
                                  <div className="flex items-center gap-2"><Checkbox id="completion_cert_no" name="completion_cert_no"/><Label htmlFor="completion_cert_no">No</Label></div>
                               </div>
                            </FormRow>
                            <FormRow label="Is the property leased">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2"><Checkbox id="is_leased_yes" name="is_leased_yes" /><Label htmlFor="is_leased_yes">Yes</Label></div>
                                  <Label>As informed by Owner Representative</Label>
                                  <div className="flex items-center gap-2"><Checkbox id="is_leased_no" name="is_leased_no" /><Label htmlFor="is_leased_no">No</Label></div>
                                </div>
                            </FormRow>
                        </SectionTable>
                        
                         <SectionTable title="Area">
                            <FormRow label="Dimension">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input placeholder="Maximum frontage:" name="area_frontage" />
                               <Input placeholder="Maximum Depth:" name="area_depth" />
                                </div>
                            </FormRow>
                            <FormRow label="Total Area in Sqft"><Input placeholder="Total Area in Sqft" name="area_total" /></FormRow>
                            <FormRow label="Minimum clear height (Floor to Roof) in ft"><Input placeholder="Minimum clear height (Floor to Roof) in ft" name="area_height" /></FormRow>
                             <FormRow label={
                                <div>
                                    Building plot size of which premises is a part
                                    <br />
                                    independent land
                                </div>
                            }>
                                <Input placeholder="Building plot size of which premises is a part" name="area_plot_size" />
                            </FormRow>
                            <FormRow label="Covered Area"><Input placeholder="Covered Area" name="area_covered" /></FormRow>
                            <FormRow label="No. of Stories / floors"><Input placeholder="(mention mezzanine, basement, roof parapet wall etc.) If any." name="area_stories" /></FormRow>
                        </SectionTable>

                        <SectionTable title="Bounded As">
                            <FormRow label="Front"><Input name="bounded_front"/></FormRow>
                            <FormRow label="Back"><Input name="bounded_back"/></FormRow>
                            <FormRow label="Right"><Input name="bounded_right" /></FormRow>
                            <FormRow label="Left"><Input name="bounded_left" /></FormRow>
                        </SectionTable>
                        
                        <SectionTable title="Utilities">
                            <FormRow label="Sanctioned electrical load">
                                <div className="flex items-center justify-between">
                                    <Input name="sanctioned_load_text" />
                                    <div className="flex items-center space-x-2"><Checkbox name="sanctioned_load_na" /><Label>N/A</Label></div>
                                </div>
                            </FormRow>
                            <FormRow label="Type of electrical load">
                               <div className="flex flex-wrap gap-4">
                                  <div className="flex items-center gap-2"><Checkbox id="elec_commercial" name="elec_commercial" /><Label htmlFor="elec_commercial">Commercial</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox id="elec_industrial" name="elec_industrial" /><Label htmlFor="elec_industrial">Industrial</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox id="elec_residential" name="elec_residential" /><Label htmlFor="elec_residential">Residential</Label></div>
                               </div>
                            </FormRow>
                            <FormRow label="Electrical Meter (single phase / 3 phase)"><Input name="electrical_meter" /></FormRow>
                            <FormRow label="Piped water available">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="water_yes" name="water_yes" /><Label htmlFor="water_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="water_no" name="water_no" /><Label htmlFor="water_no">No</Label></div></div>
                            </FormRow>
                            <FormRow label="Underground tank">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="ug_tank_yes" name="ug_tank_yes" /><Label htmlFor="ug_tank_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="ug_tank_no" name="ug_tank_no" /><Label htmlFor="ug_tank_no">No</Label></div></div>
                            </FormRow>
                            <FormRow label="Overhead tank">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="oh_tank_yes" name="oh_tank_yes" /><Label htmlFor="oh_tank_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="oh_tank_no" name="oh_tank_no" /><Label htmlFor="oh_tank_no">No</Label></div></div>
                            </FormRow>
                            <FormRow label="Type of Overhead tank (RCC, Fiber etc.)"><Input name="overhead_tank_type"/></FormRow>
                            <FormRow label="Type of water (boring or Line water)"><Input name="water_type" /></FormRow>
                            <FormRow label="Gas Connection">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="gas_yes" name="gas_yes" /><Label htmlFor="gas_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="gas_no" name="gas_no" /><Label htmlFor="gas_no">No</Label></div></div>
                            </FormRow>
                             <FormRow label="Connected to Sewerage line">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="sewer_yes" name="sewer_yes" /><Label htmlFor="sewer_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="sewer_no" name="sewer_no" /><Label htmlFor="sewer_no">No</Label></div></div>
                            </FormRow>
                        </SectionTable>

                        <SectionTable title="Building overview">
                            <FormRow label="Independent premises">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2"><Checkbox id="ind_yes" name="ind_yes" /><Label htmlFor="ind_yes">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="ind_no" name="ind_no" /><Label htmlFor="ind_no">No. a part of building</Label></div>
                                </div>
                            </FormRow>
                             <FormRow label="Status">
                                 <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><Checkbox id="status_comm" name="status_comm" /><Label htmlFor="status_comm">Commercial</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="status_res" name="status_res" /><Label htmlFor="status_res">Residential</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="status_ind" name="status_ind" /><Label htmlFor="status_ind">Industrial</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="status_other" name="status_other" /><Label htmlFor="status_other">Other:</Label> <Input name="status_other_text" className="h-7" /></div>
                                </div>
                            </FormRow>
                             <FormRow label="Type of Premises">
                                 <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><Checkbox id="prem_res" name="prem_res" /><Label htmlFor="prem_res">Residence</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="prem_off" name="prem_off" /><Label htmlFor="prem_off">Offices</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="prem_god" name="prem_god" /><Label htmlFor="prem_god">Godowns</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="prem_other" name="prem_other" /><Label htmlFor="prem_other">Other:</Label> <Input name="prem_other_text" className="h-7" /></div>
                                </div>
                            </FormRow>
                            <FormRow label="Age of Premises if any">
                                <div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><Checkbox id="age_0_5" name="age_0_5" /><Label htmlFor="age_0_5">0-5</Label></div><div className="flex items-center space-x-2"><Checkbox id="age_5_10" name="age_5_10" /><Label htmlFor="age_5_10">5-10</Label></div><div className="flex items-center space-x-2"><Checkbox id="age_gt_10" name="age_gt_10" /><Label htmlFor="age_gt_10">More than 10 years</Label></div></div>
                            </FormRow>
                             <FormRow label="Interior of Premises if any">
                                <div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><Checkbox id="it_single_hall" name="it_single_hall" /><Label htmlFor="it_single_hall">Single Hall</Label></div><div className="flex items-center space-x-2"><Checkbox id="it_rooms" name="it_rooms" /><Label htmlFor="it_rooms">Rooms</Label></div></div>
                            </FormRow>
                             <FormRow label="Type of construction">
                                <div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><Checkbox id="ct_rcc" name="ct_rcc" /><Label htmlFor="ct_rcc">Beam-Column in RCC</Label></div><div className="flex items-center space-x-2"><Checkbox id="ct_composite" name="ct_composite" /><Label htmlFor="ct_composite">Composit Structure</Label></div><div className="flex items-center space-x-2"><Checkbox id="ct_load_bearing" name="ct_load_bearing" /><Label htmlFor="ct_load_bearing">Load Bearing in walls</Label></div></div>
                            </FormRow>
                        </SectionTable>

                         <SectionTable title="Building Details">
                            <FormRow label="Seepage">
                                 <div className="flex items-center space-x-8">
                                    <div className="flex items-center space-x-2"><Checkbox id="seepage_yes" name="seepage_yes" /><Label htmlFor="seepage_yes">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="seepage_no" name="seepage_no" /><Label htmlFor="seepage_no">No</Label></div>
                                </div>
                            </FormRow>
                            <FormRow label="Area of seepage (Walls, slab etc.)"><Input name="seepage_area"/></FormRow>
                            <FormRow label="Cause of Seepage"><Input name="seepage_cause" /></FormRow>
                            <FormRow label="Property Utilization">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                    <div className="flex items-center space-x-2"><Checkbox id="util_residential" name="util_residential" /><Label htmlFor="util_residential">Fully residential</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="util_commercial" name="util_commercial"/><Label htmlFor="util_commercial">Fully Commercial</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="util_dual" name="util_dual" /><Label htmlFor="util_dual">Dual use residential & commercial</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="util_industrial" name="util_industrial" /><Label htmlFor="util_industrial">Industrial</Label></div>
                                </div>
                            </FormRow>
                             <FormRow label="Condition of roof waterproofing (if applicable)"><Input name="roof_waterproofing" /></FormRow>
                            <FormRow label="Parking available">
                                 <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><Checkbox id="parking_yes" name="parking_yes" /><Label htmlFor="parking_yes">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="parking_main_road" name="parking_main_road" /><Label htmlFor="parking_main_road">On Main Road</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="parking_no" name="parking_no" /><Label htmlFor="parking_no">No</Label></div>
                                </div>
                            </FormRow>
                            <FormRow label="Approachable through Road">
                                 <div className="flex items-center space-x-8">
                                    <div className="flex items-center space-x-2"><Checkbox id="approachable_yes" name="approachable_yes" /><Label htmlFor="approachable_yes">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="approachable_no" name="approachable_no" /><Label htmlFor="approachable_no">No</Label></div>
                                </div>
                            </FormRow>
                             <FormRow label="Wall masonary material as per region"><Input name="wall_material" /></FormRow>
                            <FormRow label="Major retainable building elements">
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><Checkbox id="retainable_water_tank" name="retainable_water_tank" /><Label htmlFor="retainable_water_tank">Water tank</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="retainable_subflooring" name="retainable_subflooring" /><Label htmlFor="retainable_subflooring">Subflooring</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="retainable_staircase" name="retainable_staircase" /><Label htmlFor="retainable_staircase">staircase</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="retainable_other_check" name="retainable_other_check" /><Label htmlFor="retainable_other_check">Others</Label><Input name="retainable_other_text" className="h-7" /></div>
                                </div>
                            </FormRow>
                            <FormRow label="Incase of Plot provide existing level from road & surrounding buildings"><Input name="plot_level" /></FormRow>
                            <FormRow label="Building Control Violations">
                                 <div className="flex flex-wrap items-center gap-4">
                                     <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center space-x-2"><Checkbox id="violation_major" name="violation_major" /><Label htmlFor="violation_major">Major</Label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="violation_minor" name="violation_minor" /><Label htmlFor="violation_minor">Minor</Label></div>
                                        <div className="flex items-center space-x-2"><Checkbox id="violation_none" name="violation_none" /><Label htmlFor="violation_none">No Deviation</Label></div>
                                    </div>
                                     <div className="flex items-center space-x-2"><Checkbox id="violation_informed" name="violation_informed" /><Label htmlFor="violation_informed">As Informed by Owner Representative</Label></div>
                                </div>
                            </FormRow>
                        </SectionTable>
                        
                        <SectionTable title="Rental Detail">
                            <FormRow label="Acquisition"><Input name="rental_acquisition" /></FormRow>
                            <FormRow label="Expected Rental /month"><Input name="rental_expected_rent" /></FormRow>
                            <FormRow label="Expected Advance (# of months)"><Input name="rental_expected_advance"/></FormRow>
                            <FormRow label="Expected period of lease"><Input name="rental_lease_period"/></FormRow>
                            <FormRow label="Annual increase in rental"><Input name="rental_annual_increase"/></FormRow>
                        </SectionTable>

                        <SectionTable title="Survey Conducted By">
                           <FormRow label="Name"><Input name="survey_conducted_by_name" /></FormRow>
                           <FormRow label="Designation"><Input name="survey_conducted_by_designation" /></FormRow>
                           <FormRow label="Contact"><Input name="survey_conducted_by_contact" /></FormRow>
                           <FormRow label="Cell"><Input name="survey_conducted_by_cell" /></FormRow>
                           <FormRow label="Landline"><Input name="survey_conducted_by_landline" /></FormRow>
                           <FormRow label="Email"><Input name="survey_conducted_by_email" type="email" /></FormRow>
                           <FormRow label="Date"><Input name="survey_conducted_by_date" type="date" /></FormRow>
                        </SectionTable>

                        <div className="flex justify-end gap-4 mt-12 no-print">
                            <Button type="button" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Record</Button>
                            <Button type="button" onClick={handleDownloadPdf} variant="outline"><Printer className="mr-2 h-4 w-4" /> Download PDF</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
