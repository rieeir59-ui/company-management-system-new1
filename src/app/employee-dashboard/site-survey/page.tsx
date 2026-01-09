
'use client';

import { Suspense } from 'react';
import SiteSurveyComponent from '@/components/dashboard/SiteSurveyComponent';
import { Loader2 } from 'lucide-react';

<<<<<<< HEAD
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
    const [formState, setFormState] = useState<Record<string, any>>({
        'survey_conducted_by_email': 'Admin@isbahhassan.com'
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCheckboxChange = (name: string, value: boolean) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = () => {
       const dataToSave = {
          fileName: "Site Survey",
          projectName: formState['project_name_header'] || 'Untitled Site Survey',
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

            const drawTick = (x: number, y: number) => {
              doc.setLineWidth(0.5);
              doc.line(x + 0.5, y + 2, x + 1.5, y + 3.5);
              doc.line(x + 1.5, y + 3.5, x + 3.5, y + 1);
            };

            options.forEach(opt => {
                const isChecked = getCheckboxValue(opt.id);
                const labelWidth = doc.getTextWidth(opt.label) + 6;
                 if (margin + xOffset + labelWidth > pageWidth - margin) {
                    yPos += 8;
                    xOffset = 60;
                    doc.rect(margin, yPos, pageWidth - margin * 2, 8);
                }
                doc.rect(margin + xOffset, yPos + 2, 4, 4);
                if(isChecked) {
                  drawTick(margin + xOffset, yPos + 2);
                }
                doc.text(opt.label, margin + xOffset + 6, yPos + 5.5);
                xOffset += labelWidth + 10;
            });
            yPos += 8;
        };
        
        // --- SECTIONS ---
        addSectionTitle('Project Information');
        drawField('Project Name', getInputValue('project_name_header'));
        
        addSectionTitle('Location');
        drawCheckboxField('Purpose', [
          {id: 'purpose_commercial', label: 'Commercial'},
          {id: 'purpose_office', label: 'Office'},
          {id: 'purpose_residential', label: 'Residential'},
          {id: 'purpose_others', label: 'Others'},
        ]);
        drawField('City', getInputValue('location_city'));
        drawField('Region', getInputValue('location_region'));
        drawField('Address', getInputValue('location_address'));

        addSectionTitle('Legal File');
        drawField('Name of Owner', getInputValue('legal_owner_name'));
        drawCheckboxField('Is Completion Certificate available', [{id: 'completion_cert_yes', label: 'Yes'}, {id: 'completion_cert_no', label: 'No'}]);
        drawCheckboxField('Is the property leased', [{id: 'is_leased_yes', label: 'Yes'}, {id: 'is_leased_no', label: 'No'}]);

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
        drawCheckboxField('Type of electrical load', [
            {id: 'electrical_load_type_commercial', label: 'Commercial'}, 
            {id: 'electrical_load_type_industrial', label: 'Industrial'}, 
            {id: 'electrical_load_type_residential', label: 'Residential'}
        ]);
        drawField('Electrical Meter', getInputValue('electrical_meter'));
        drawCheckboxField('Piped water available', [{id: 'piped_water_yes', label: 'Yes'}, {id: 'piped_water_no', label: 'No'}]);
        drawCheckboxField('Underground tank', [{id: 'underground_tank_yes', label: 'Yes'}, {id: 'underground_tank_no', label: 'No'}]);
        drawCheckboxField('Overhead tank', [{id: 'overhead_tank_yes', label: 'Yes'}, {id: 'overhead_tank_no', label: 'No'}]);
        drawField('Type of Overhead tank', getInputValue('overhead_tank_type'));
        drawField('Type of water', getInputValue('water_type'));
        drawCheckboxField('Gas Connection', [{id: 'gas_connection_yes', label: 'Yes'}, {id: 'gas_connection_no', label: 'No'}]);
        drawCheckboxField('Connected to Sewerage line', [{id: 'sewerage_connection_yes', label: 'Yes'}, {id: 'sewerage_connection_no', label: 'No'}]);

        addSectionTitle('Building overview');
        drawField('Condition of Premises with reference to structural stability', getInputValue('structural_stability'));
        drawCheckboxField('Is entrance independence', [{id: 'entrance_independence_yes', label: 'Yes'}, {id: 'entrance_independence_no', label: 'No'}]);
        drawCheckboxField('Staircase for staff use available with its assessment', [{id: 'staff_staircase_yes', label: 'Yes'}, {id: 'staff_staircase_no', label: 'No'}, {id: 'staff_staircase_na', label: 'N/A'}]);
        drawCheckboxField('Emergency Exit available', [{id: 'emergency_exit_yes', label: 'Yes'}, {id: 'emergency_exit_no', label: 'No'}]);
        drawCheckboxField('Emergency Exit if not available can be provided or not', [{id: 'emergency_exit_provision_yes', label: 'Yes'}, {id: 'emergency_exit_provision_no', label: 'No'}]);
        drawCheckboxField('Ramp available', [{id: 'ramp_available_yes', label: 'Yes'}, {id: 'ramp_available_no', label: 'No'}]);
        drawCheckboxField('Ramp if not available can be provided or not', [{id: 'ramp_provision_yes', label: 'Yes'}, {id: 'ramp_provision_no', label: 'No'}]);
        drawCheckboxField('Seepage', [{id: 'seepage_yes', label: 'Yes'}, {id: 'seepage_no', label: 'No'}]);
        drawField('Area of seepage (Walls, slab etc.)', getInputValue('seepage_area'));
        drawField('Cause of Seepage', getInputValue('seepage_cause'));
        drawCheckboxField('Generator installation space', [{id: 'generator_space_yes', label: 'Yes at back or left side'}, {id: 'generator_space_no', label: 'No'}]);
        drawCheckboxField('Property Utilization', [
          {id: 'util_residential', label: 'Fully residential'}, 
          {id: 'util_commercial', label: 'Fully Commercial'}, 
          {id: 'util_dual', label: 'Dual use residential & commercial'}, 
          {id: 'util_industrial', label: 'Industrial'}
        ]);
        drawField('Building plinth level from the road', getInputValue('plinth_level'));
        drawCheckboxField('Is area susceptible to flooding during rain fall', [{id: 'flooding_yes', label: 'Yes'}, {id: 'flooding_no', label: 'No'}]);
        drawCheckboxField('Disable access available or can be provided', [{id: 'disable_access_yes', label: 'Yes'}, {id: 'disable_access_no', label: 'No'}]);
        drawField('Condition of roof waterproofing (if applicable)', getInputValue('roof_waterproofing'));
        drawCheckboxField('Parking available', [{id: 'parking_yes', label: 'Yes'}, {id: 'parking_no', label: 'No'}]);
        drawField('Set Back Available at front', getInputValue('set_back_front'));
        drawCheckboxField('Approachable through Road', [{id: 'approachable_yes', label: 'Yes'}, {id: 'approachable_no', label: 'No'}]);
        drawCheckboxField('Any hazard like Petrol Pump / CNG Station / in vicinity available', [{id: 'hazard_yes', label: 'Yes'}, {id: 'hazard_no', label: 'No'}]);
        drawField('Wall masonary material as per region', getInputValue('wall_material'));
        drawCheckboxField('Space for Signage available', [{id: 'signage_space_yes', label: 'Yes'}, {id: 'signage_space_no', label: 'No'}]);
        drawCheckboxField('Major retainable building elements', [
          {id: 'retainable_water_tank', label: 'Water tank'},
          {id: 'retainable_vault', label: 'Vault'},
          {id: 'retainable_subflooring', label: 'Subflooring'},
          {id: 'retainable_staircase', label: 'Staircase'},
          {id: 'retainable_others', label: 'Others'},
        ]);
        drawField('Incase of Plot provide existing level from road & surrounding buildings', getInputValue('plot_level_surroundings'));
        drawCheckboxField('Building Control Violations', [{id: 'violations_major', label: 'Major'}, {id: 'violations_minor', label: 'Minor'}, {id: 'violations_none', label: 'No Deviation'}]);
        
        doc.addPage();
        yPos = 20;

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
                        <CardDescription>Premises Review for all Projects</CardDescription>
                        <p className="text-xs mt-2 max-w-2xl mx-auto">This questionnaire form provides preliminary information for determining the suitability of premises or property to be acquired</p>
                         <div className="flex justify-between items-center mt-4">
                            <CardTitle className="font-headline text-4xl text-primary">SITE SURVEY</CardTitle>
                             <div className="flex items-center gap-2">
                                <Label htmlFor="location_date">Date</Label>
                                <Input type="date" id="location_date" name="location_date" className="w-fit" value={formState['location_date'] || ''} onChange={handleFormChange} />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form id="site-survey-form" className="space-y-8">
                        <SectionTable title="Project Information">
                           <FormRow label="Project Name">
                                <Input id="project_name_header" name="project_name_header" className="text-lg" value={formState['project_name_header'] || ''} onChange={handleFormChange} />
                           </FormRow>
                        </SectionTable>

                        <SectionTable title="Location">
                           <FormRow label="Purpose">
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_commercial" id="purpose_commercial" checked={!!formState['purpose_commercial']} onCheckedChange={(c) => handleCheckboxChange('purpose_commercial', !!c)} /> <Label htmlFor="purpose_commercial">Commercial</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_office" id="purpose_office" checked={!!formState['purpose_office']} onCheckedChange={(c) => handleCheckboxChange('purpose_office', !!c)} /> <Label htmlFor="purpose_office">Office</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_residential" id="purpose_residential" checked={!!formState['purpose_residential']} onCheckedChange={(c) => handleCheckboxChange('purpose_residential', !!c)} /> <Label htmlFor="purpose_residential">Residential</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox name="purpose_others" id="purpose_others" checked={!!formState['purpose_others']} onCheckedChange={(c) => handleCheckboxChange('purpose_others', !!c)} /> <Label htmlFor="purpose_others">Others</Label></div>
                               </div>
                            </FormRow>
                            <FormRow label="City"><Input name="location_city" value={formState['location_city'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Region"><Input name="location_region" value={formState['location_region'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Address"><Input name="location_address" value={formState['location_address'] || ''} onChange={handleFormChange} /></FormRow>
                        </SectionTable>

                        <SectionTable title="Legal File">
                            <FormRow label="Name of Owner"><Input name="legal_owner_name" value={formState['legal_owner_name'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Is Completion Certificate available">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2"><Checkbox id="completion_cert_yes" name="completion_cert_yes" checked={!!formState['completion_cert_yes']} onCheckedChange={(c) => handleCheckboxChange('completion_cert_yes', !!c)} /><Label htmlFor="completion_cert_yes">Yes</Label></div>
                                  <Label>As informed by Owner Representative</Label>
                                  <div className="flex items-center gap-2"><Checkbox id="completion_cert_no" name="completion_cert_no" checked={!!formState['completion_cert_no']} onCheckedChange={(c) => handleCheckboxChange('completion_cert_no', !!c)} /><Label htmlFor="completion_cert_no">No</Label></div>
                               </div>
                            </FormRow>
                            <FormRow label="Is the property leased">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2"><Checkbox id="is_leased_yes" name="is_leased_yes" checked={!!formState['is_leased_yes']} onCheckedChange={(c) => handleCheckboxChange('is_leased_yes', !!c)} /><Label htmlFor="is_leased_yes">Yes</Label></div>
                                  <Label>As informed by Owner Representative</Label>
                                  <div className="flex items-center gap-2"><Checkbox id="is_leased_no" name="is_leased_no" checked={!!formState['is_leased_no']} onCheckedChange={(c) => handleCheckboxChange('is_leased_no', !!c)} /><Label htmlFor="is_leased_no">No</Label></div>
                                </div>
                            </FormRow>
                        </SectionTable>
                        
                         <SectionTable title="Area">
                            <FormRow label="Dimension">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input placeholder="Maximum frontage:" name="area_frontage" value={formState['area_frontage'] || ''} onChange={handleFormChange} />
                               <Input placeholder="Maximum Depth:" name="area_depth" value={formState['area_depth'] || ''} onChange={handleFormChange} />
                                </div>
                            </FormRow>
                            <FormRow label="Total Area in Sqft"><Input placeholder="Total Area in Sqft" name="area_total" value={formState['area_total'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Minimum clear height (Floor to Roof) in ft"><Input placeholder="Minimum clear height (Floor to Roof) in ft" name="area_height" value={formState['area_height'] || ''} onChange={handleFormChange} /></FormRow>
                             <FormRow label={
                                <div>
                                    Building plot size of which premises is a part
                                    <br />
                                    independent land
                                </div>
                            }>
                                <Input placeholder="Building plot size of which premises is a part" name="area_plot_size" value={formState['area_plot_size'] || ''} onChange={handleFormChange} />
                            </FormRow>
                            <FormRow label="Covered Area"><Input placeholder="Covered Area" name="area_covered" value={formState['area_covered'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="No. of Stories / floors"><Input placeholder="(mention mezzanine, basement, roof parapet wall etc.) If any." name="area_stories" value={formState['area_stories'] || ''} onChange={handleFormChange} /></FormRow>
                        </SectionTable>

                        <SectionTable title="Bounded As">
                            <FormRow label="Front"><Input name="bounded_front" value={formState['bounded_front'] || ''} onChange={handleFormChange}/></FormRow>
                            <FormRow label="Back"><Input name="bounded_back" value={formState['bounded_back'] || ''} onChange={handleFormChange}/></FormRow>
                            <FormRow label="Right"><Input name="bounded_right" value={formState['bounded_right'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Left"><Input name="bounded_left" value={formState['bounded_left'] || ''} onChange={handleFormChange} /></FormRow>
                        </SectionTable>
                        
                        <SectionTable title="Utilities">
                            <FormRow label="Sanctioned electrical load">
                                <div className="flex items-center justify-between">
                                    <Input name="sanctioned_load_text" value={formState['sanctioned_load_text'] || ''} onChange={handleFormChange} />
                                    <div className="flex items-center space-x-2"><Checkbox name="sanctioned_load_na" checked={!!formState['sanctioned_load_na']} onCheckedChange={(c) => handleCheckboxChange('sanctioned_load_na', !!c)} /><Label>N/A</Label></div>
                                </div>
                            </FormRow>
                            <FormRow label="Type of electrical load">
                               <div className="flex flex-wrap gap-4">
                                  <div className="flex items-center gap-2"><Checkbox id="electrical_load_type_commercial" name="electrical_load_type_commercial" checked={!!formState['electrical_load_type_commercial']} onCheckedChange={(c) => handleCheckboxChange('electrical_load_type_commercial', !!c)} /><Label htmlFor="elec_commercial">Commercial</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox id="electrical_load_type_industrial" name="electrical_load_type_industrial" checked={!!formState['electrical_load_type_industrial']} onCheckedChange={(c) => handleCheckboxChange('electrical_load_type_industrial', !!c)} /><Label htmlFor="elec_industrial">Industrial</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox id="electrical_load_type_residential" name="electrical_load_type_residential" checked={!!formState['electrical_load_type_residential']} onCheckedChange={(c) => handleCheckboxChange('electrical_load_type_residential', !!c)} /><Label htmlFor="elec_residential">Residential</Label></div>
                               </div>
                            </FormRow>
                            <FormRow label="Electrical Meter (single phase / 3 phase)"><Input name="electrical_meter" value={formState['electrical_meter'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Piped water available">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="piped_water_yes" name="piped_water_yes" checked={!!formState['piped_water_yes']} onCheckedChange={(c) => handleCheckboxChange('piped_water_yes', !!c)} /><Label htmlFor="water_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="piped_water_no" name="piped_water_no" checked={!!formState['piped_water_no']} onCheckedChange={(c) => handleCheckboxChange('piped_water_no', !!c)} /><Label htmlFor="water_no">No</Label></div></div>
                            </FormRow>
                            <FormRow label="Underground tank">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="underground_tank_yes" name="underground_tank_yes" checked={!!formState['underground_tank_yes']} onCheckedChange={(c) => handleCheckboxChange('underground_tank_yes', !!c)} /><Label htmlFor="ug_tank_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="underground_tank_no" name="underground_tank_no" checked={!!formState['underground_tank_no']} onCheckedChange={(c) => handleCheckboxChange('underground_tank_no', !!c)} /><Label htmlFor="ug_tank_no">No</Label></div></div>
                            </FormRow>
                            <FormRow label="Overhead tank">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="overhead_tank_yes" name="overhead_tank_yes" checked={!!formState['overhead_tank_yes']} onCheckedChange={(c) => handleCheckboxChange('overhead_tank_yes', !!c)} /><Label htmlFor="oh_tank_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="overhead_tank_no" name="overhead_tank_no" checked={!!formState['overhead_tank_no']} onCheckedChange={(c) => handleCheckboxChange('overhead_tank_no', !!c)} /><Label htmlFor="oh_tank_no">No</Label></div></div>
                            </FormRow>
                            <FormRow label="Type of Overhead tank (RCC, Fiber etc.)"><Input name="overhead_tank_type" value={formState['overhead_tank_type'] || ''} onChange={handleFormChange}/></FormRow>
                            <FormRow label="Type of water (boring or Line water)"><Input name="water_type" value={formState['water_type'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Gas Connection">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="gas_connection_yes" name="gas_connection_yes" checked={!!formState['gas_connection_yes']} onCheckedChange={(c) => handleCheckboxChange('gas_connection_yes', !!c)} /><Label htmlFor="gas_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="gas_connection_no" name="gas_connection_no" checked={!!formState['gas_connection_no']} onCheckedChange={(c) => handleCheckboxChange('gas_connection_no', !!c)} /><Label htmlFor="gas_no">No</Label></div></div>
                            </FormRow>
                             <FormRow label="Connected to Sewerage line">
                                <div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="sewerage_connection_yes" name="sewerage_connection_yes" checked={!!formState['sewerage_connection_yes']} onCheckedChange={(c) => handleCheckboxChange('sewerage_connection_yes', !!c)} /><Label htmlFor="sewer_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="sewerage_connection_no" name="sewerage_connection_no" checked={!!formState['sewerage_connection_no']} onCheckedChange={(c) => handleCheckboxChange('sewerage_connection_no', !!c)} /><Label htmlFor="sewer_no">No</Label></div></div>
                            </FormRow>
                        </SectionTable>

                        <SectionTable title="Building overview">
                           <FormRow label="Condition of Premises with reference to structural stability"><Input name="structural_stability" value={formState['structural_stability'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Is entrance independence"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="entrance_independence_yes" name="entrance_independence_yes" checked={!!formState['entrance_independence_yes']} onCheckedChange={(c) => handleCheckboxChange('entrance_independence_yes', !!c)} /><Label htmlFor="entrance_independence_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="entrance_independence_no" name="entrance_independence_no" checked={!!formState['entrance_independence_no']} onCheckedChange={(c) => handleCheckboxChange('entrance_independence_no', !!c)} /><Label htmlFor="entrance_independence_no">No</Label></div></div></FormRow>
                           <FormRow label="Staircase for staff use available with its assessment"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="staff_staircase_yes" name="staff_staircase_yes" checked={!!formState['staff_staircase_yes']} onCheckedChange={(c) => handleCheckboxChange('staff_staircase_yes', !!c)} /><Label htmlFor="staff_staircase_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="staff_staircase_no" name="staff_staircase_no" checked={!!formState['staff_staircase_no']} onCheckedChange={(c) => handleCheckboxChange('staff_staircase_no', !!c)} /><Label htmlFor="staff_staircase_no">No</Label></div><div className="flex items-center space-x-2"><Checkbox id="staff_staircase_na" name="staff_staircase_na" checked={!!formState['staff_staircase_na']} onCheckedChange={(c) => handleCheckboxChange('staff_staircase_na', !!c)} /><Label htmlFor="staff_staircase_na">N/A</Label></div></div></FormRow>
                           <FormRow label="Emergency Exit available"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="emergency_exit_yes" name="emergency_exit_yes" checked={!!formState['emergency_exit_yes']} onCheckedChange={(c) => handleCheckboxChange('emergency_exit_yes', !!c)} /><Label htmlFor="emergency_exit_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="emergency_exit_no" name="emergency_exit_no" checked={!!formState['emergency_exit_no']} onCheckedChange={(c) => handleCheckboxChange('emergency_exit_no', !!c)} /><Label htmlFor="emergency_exit_no">No</Label></div></div></FormRow>
                           <FormRow label="Emergency Exit if not available can be provided or not"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="emergency_exit_provision_yes" name="emergency_exit_provision_yes" checked={!!formState['emergency_exit_provision_yes']} onCheckedChange={(c) => handleCheckboxChange('emergency_exit_provision_yes', !!c)} /><Label htmlFor="emergency_exit_provision_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="emergency_exit_provision_no" name="emergency_exit_provision_no" checked={!!formState['emergency_exit_provision_no']} onCheckedChange={(c) => handleCheckboxChange('emergency_exit_provision_no', !!c)} /><Label htmlFor="emergency_exit_provision_no">No</Label></div></div></FormRow>
                           <FormRow label="Ramp available"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="ramp_available_yes" name="ramp_available_yes" checked={!!formState['ramp_available_yes']} onCheckedChange={(c) => handleCheckboxChange('ramp_available_yes', !!c)} /><Label htmlFor="ramp_available_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="ramp_available_no" name="ramp_available_no" checked={!!formState['ramp_available_no']} onCheckedChange={(c) => handleCheckboxChange('ramp_available_no', !!c)} /><Label htmlFor="ramp_available_no">No</Label></div></div></FormRow>
                           <FormRow label="Ramp if not available can be provided or not"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="ramp_provision_yes" name="ramp_provision_yes" checked={!!formState['ramp_provision_yes']} onCheckedChange={(c) => handleCheckboxChange('ramp_provision_yes', !!c)} /><Label htmlFor="ramp_provision_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="ramp_provision_no" name="ramp_provision_no" checked={!!formState['ramp_provision_no']} onCheckedChange={(c) => handleCheckboxChange('ramp_provision_no', !!c)} /><Label htmlFor="ramp_provision_no">No</Label></div></div></FormRow>
                           <FormRow label="Seepage"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="seepage_yes" name="seepage_yes" checked={!!formState['seepage_yes']} onCheckedChange={(c) => handleCheckboxChange('seepage_yes', !!c)} /><Label htmlFor="seepage_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="seepage_no" name="seepage_no" checked={!!formState['seepage_no']} onCheckedChange={(c) => handleCheckboxChange('seepage_no', !!c)} /><Label htmlFor="seepage_no">No</Label></div></div></FormRow>
                           <FormRow label="Area of seepage (Walls, slab etc.)"><Input name="seepage_area" value={formState['seepage_area'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Cause of Seepage"><Input name="seepage_cause" value={formState['seepage_cause'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Generator installation space"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="generator_space_yes" name="generator_space_yes" checked={!!formState['generator_space_yes']} onCheckedChange={(c) => handleCheckboxChange('generator_space_yes', !!c)} /><Label htmlFor="generator_space_yes">Yes at back or left side</Label></div><div className="flex items-center space-x-2"><Checkbox id="generator_space_no" name="generator_space_no" checked={!!formState['generator_space_no']} onCheckedChange={(c) => handleCheckboxChange('generator_space_no', !!c)} /><Label htmlFor="generator_space_no">No</Label></div></div></FormRow>
                           <FormRow label="Property Utilization"><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><Checkbox id="util_residential" name="util_residential" checked={!!formState['util_residential']} onCheckedChange={(c) => handleCheckboxChange('util_residential', !!c)} /><Label htmlFor="util_residential">Fully residential</Label></div><div className="flex items-center space-x-2"><Checkbox id="util_commercial" name="util_commercial" checked={!!formState['util_commercial']} onCheckedChange={(c) => handleCheckboxChange('util_commercial', !!c)} /><Label htmlFor="util_commercial">Fully Commercial</Label></div><div className="flex items-center space-x-2"><Checkbox id="util_dual" name="util_dual" checked={!!formState['util_dual']} onCheckedChange={(c) => handleCheckboxChange('util_dual', !!c)} /><Label htmlFor="util_dual">Dual use residential & commercial</Label></div><div className="flex items-center space-x-2"><Checkbox id="util_industrial" name="util_industrial" checked={!!formState['util_industrial']} onCheckedChange={(c) => handleCheckboxChange('util_industrial', !!c)} /><Label htmlFor="util_industrial">Industrial</Label></div></div></FormRow>
                           <FormRow label="Building plinth level from the road"><Input name="plinth_level" value={formState['plinth_level'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Is area susceptible to flooding during rain fall"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="flooding_yes" name="flooding_yes" checked={!!formState['flooding_yes']} onCheckedChange={(c) => handleCheckboxChange('flooding_yes', !!c)} /><Label htmlFor="flooding_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="flooding_no" name="flooding_no" checked={!!formState['flooding_no']} onCheckedChange={(c) => handleCheckboxChange('flooding_no', !!c)} /><Label htmlFor="flooding_no">No</Label></div></div></FormRow>
                           <FormRow label="Disable access available or can be provided"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="disable_access_yes" name="disable_access_yes" checked={!!formState['disable_access_yes']} onCheckedChange={(c) => handleCheckboxChange('disable_access_yes', !!c)} /><Label htmlFor="disable_access_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="disable_access_no" name="disable_access_no" checked={!!formState['disable_access_no']} onCheckedChange={(c) => handleCheckboxChange('disable_access_no', !!c)} /><Label htmlFor="disable_access_no">No</Label></div></div></FormRow>
                           <FormRow label="Condition of roof waterproofing (if applicable)"><Input name="roof_waterproofing" value={formState['roof_waterproofing'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Parking available"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="parking_yes" name="parking_yes" checked={!!formState['parking_yes']} onCheckedChange={(c) => handleCheckboxChange('parking_yes', !!c)} /><Label htmlFor="parking_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="parking_no" name="parking_no" checked={!!formState['parking_no']} onCheckedChange={(c) => handleCheckboxChange('parking_no', !!c)} /><Label htmlFor="parking_no">No</Label></div></div></FormRow>
                           <FormRow label="Set Back Available at front"><Input name="set_back_front" value={formState['set_back_front'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Approachable through Road"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="approachable_yes" name="approachable_yes" checked={!!formState['approachable_yes']} onCheckedChange={(c) => handleCheckboxChange('approachable_yes', !!c)} /><Label htmlFor="approachable_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="approachable_no" name="approachable_no" checked={!!formState['approachable_no']} onCheckedChange={(c) => handleCheckboxChange('approachable_no', !!c)} /><Label htmlFor="approachable_no">No</Label></div></div></FormRow>
                           <FormRow label="Any hazard like Petrol Pump / CNG Station / in vicinity available"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="hazard_yes" name="hazard_yes" checked={!!formState['hazard_yes']} onCheckedChange={(c) => handleCheckboxChange('hazard_yes', !!c)} /><Label htmlFor="hazard_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="hazard_no" name="hazard_no" checked={!!formState['hazard_no']} onCheckedChange={(c) => handleCheckboxChange('hazard_no', !!c)} /><Label htmlFor="hazard_no">No</Label></div></div></FormRow>
                           <FormRow label="Wall masonary material as per region"><Input name="wall_material" value={formState['wall_material'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Space for Signage available"><div className="flex items-center space-x-8"><div className="flex items-center space-x-2"><Checkbox id="signage_space_yes" name="signage_space_yes" checked={!!formState['signage_space_yes']} onCheckedChange={(c) => handleCheckboxChange('signage_space_yes', !!c)} /><Label htmlFor="signage_space_yes">Yes</Label></div><div className="flex items-center space-x-2"><Checkbox id="signage_space_no" name="signage_space_no" checked={!!formState['signage_space_no']} onCheckedChange={(c) => handleCheckboxChange('signage_space_no', !!c)} /><Label htmlFor="signage_space_no">No</Label></div></div></FormRow>
                           <FormRow label="Major retainable building elements"><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><Checkbox id="retainable_water_tank" name="retainable_water_tank" checked={!!formState['retainable_water_tank']} onCheckedChange={(c) => handleCheckboxChange('retainable_water_tank', !!c)} /><Label htmlFor="retainable_water_tank">Water tank</Label></div><div className="flex items-center space-x-2"><Checkbox id="retainable_vault" name="retainable_vault" checked={!!formState['retainable_vault']} onCheckedChange={(c) => handleCheckboxChange('retainable_vault', !!c)} /><Label htmlFor="retainable_vault">Vault</Label></div><div className="flex items-center space-x-2"><Checkbox id="retainable_subflooring" name="retainable_subflooring" checked={!!formState['retainable_subflooring']} onCheckedChange={(c) => handleCheckboxChange('retainable_subflooring', !!c)} /><Label htmlFor="retainable_subflooring">Subflooring</Label></div><div className="flex items-center space-x-2"><Checkbox id="retainable_staircase" name="retainable_staircase" checked={!!formState['retainable_staircase']} onCheckedChange={(c) => handleCheckboxChange('retainable_staircase', !!c)} /><Label htmlFor="retainable_staircase">Staircase</Label></div><div className="flex items-center space-x-2"><Checkbox id="retainable_others" name="retainable_others" checked={!!formState['retainable_others']} onCheckedChange={(c) => handleCheckboxChange('retainable_others', !!c)} /><Label htmlFor="retainable_others">Others</Label></div></div></FormRow>
                           <FormRow label="Incase of Plot provide existing level from road & surrounding buildings"><Input name="plot_level_surroundings" value={formState['plot_level_surroundings'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Building Control Violations"><div className="flex flex-wrap items-center gap-4"><div className="flex items-center space-x-2"><Checkbox id="violations_major" name="violations_major" checked={!!formState['violations_major']} onCheckedChange={(c) => handleCheckboxChange('violations_major', !!c)} /><Label htmlFor="violations_major">Major</Label></div><div className="flex items-center space-x-2"><Checkbox id="violations_minor" name="violations_minor" checked={!!formState['violations_minor']} onCheckedChange={(c) => handleCheckboxChange('violations_minor', !!c)} /><Label htmlFor="violations_minor">Minor</Label></div><div className="flex items-center space-x-2"><Checkbox id="violations_none" name="violations_none" checked={!!formState['violations_none']} onCheckedChange={(c) => handleCheckboxChange('violations_none', !!c)} /><Label htmlFor="violations_none">No Deviation</Label></div></div></FormRow>
                        </SectionTable>

                        <SectionTable title="Rental Detail">
                            <FormRow label="Acquisition"><Input name="rental_acquisition" value={formState['rental_acquisition'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Expected Rental /month"><Input name="rental_expected_rent" value={formState['rental_expected_rent'] || ''} onChange={handleFormChange} /></FormRow>
                            <FormRow label="Expected Advance (# of months)"><Input name="rental_expected_advance" value={formState['rental_expected_advance'] || ''} onChange={handleFormChange}/></FormRow>
                            <FormRow label="Expected period of lease"><Input name="rental_lease_period" value={formState['rental_lease_period'] || ''} onChange={handleFormChange}/></FormRow>
                            <FormRow label="Annual increase in rental"><Input name="rental_annual_increase" value={formState['rental_annual_increase'] || ''} onChange={handleFormChange}/></FormRow>
                        </SectionTable>

                        <SectionTable title="Survey Conducted By">
                           <FormRow label="Name"><Input name="survey_conducted_by_name" value={formState['survey_conducted_by_name'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Designation"><Input name="survey_conducted_by_designation" value={formState['survey_conducted_by_designation'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Contact"><Input name="survey_conducted_by_contact" value={formState['survey_conducted_by_contact'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Cell"><Input name="survey_conducted_by_cell" value={formState['survey_conducted_by_cell'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Landline"><Input name="survey_conducted_by_landline" value={formState['survey_conducted_by_landline'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Email"><Input name="survey_conducted_by_email" type="email" value={formState['survey_conducted_by_email'] || ''} onChange={handleFormChange} /></FormRow>
                           <FormRow label="Date"><Input name="survey_conducted_by_date" type="date" value={formState['survey_conducted_by_date'] || ''} onChange={handleFormChange} /></FormRow>
                        </SectionTable>

                        <div className="flex justify-end gap-4 mt-12 no-print">
                            <Button type="button" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Record</Button>
                            <Button type="button" onClick={handleDownloadPdf} variant="outline"><Printer className="mr-2 h-4 w-4" /> Download PDF</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
=======
function SiteSurveyFallback() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span>Loading Form...</span>
>>>>>>> origin/main
        </div>
    );
}

<<<<<<< HEAD
=======
export default function Page() {
  return (
    <Suspense fallback={<SiteSurveyFallback />}>
      <SiteSurveyComponent />
    </Suspense>
  );
}

    

    
>>>>>>> origin/main
