
'use client';

import { useState } from 'react';
import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { useFirebase } from '@/firebase/provider';
import { useCurrentUser } from '@/context/UserContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <section className="mb-6">
    {title && <h2 className="text-lg font-bold text-primary mb-3 pb-1 border-b border-primary section-title">{title}</h2>}
    <div className="space-y-4">
      {children}
    </div>
  </section>
);

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

const FormRow = ({ label, children }: { label: string; children: React.ReactNode; }) => (
    <TableRow>
        <TableCell className="font-semibold w-1/3">{label}</TableCell>
        <TableCell>{children}</TableCell>
    </TableRow>
);


const checklistItems = [
    { no: 1, title: 'Existing Plan' },
    { no: 2, title: 'Site Plan' },
    { no: 3, title: 'Basement Plan' },
    { no: 4, title: 'Ground Floor Plan' },
    { no: 5, title: 'First Floor Plan' },
    { no: 6, title: 'Second Floor Plan' },
    { no: 7, title: 'Elevation 1 - Material Structure' },
    { no: 8, title: 'Elevation 2 - Material Structure' },
    { no: 9, title: 'Elevation 3 - Material Structure' },
    { no: 10, title: 'Elevation 4 - Material Structure' },
    { no: 11, title: 'Window Details Existing' },
    { no: 12, title: 'Door Heights Existing' },
    { no: 13, title: 'Interior Finishes' },
    { no: 14, title: 'HVAC' },
];

const structureDrawingItems = [
    { no: 1, title: 'Ground Floor Slab' },
    { no: 2, title: 'First Floor Plan' },
    { no: 3, title: 'Second floor Plan' },
    { no: 4, title: 'Wall Elevation & Slab Sec' },
    { no: 5, title: 'Wall Sections & Details' },
    { no: 6, title: 'Staircase' },
    { no: 7, title: 'Column Sizes / Locations' },
    { no: 8, title: 'Beams sizes / Locations' },
];

const plumbingDrawingItems = [
    { no: 1, title: 'Sewage System' },
    { no: 2, title: 'Water Supply & Gas Systems' },
    { no: 3, title: 'Location of underground water tank' },
    { no: 4, title: 'Location of underground septic tank' },
    { no: 5, title: 'Main Water Supply Source' },
];

const electrificationDrawingItems = [
    { no: 1, title: 'Illumination Layout Plan' },
    { no: 2, title: 'Power Layout Plan' },
    { no: 3, title: 'Legend & General Notes' },
    { no: 4, title: 'Camera Dvr' },
    { no: 5, title: 'Smoke Detector / fire fighting' },
    { no: 6, title: 'PTCL Junction Box' },
    { no: 7, title: 'Main DB Location' },
    { no: 8, title: 'Sub DBs Location' },
];

export default function ProjectDataPage() {
    const image = PlaceHolderImages.find(p => p.id === 'site-survey');
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { user: currentUser } = useCurrentUser();

    const [formData, setFormData] = useState({
        project_name: '', project_address: '', project_owner: '', architect_project_no: '',
        project_date: '', project_tel: '', business_address: '', home_address: '',
        business_tel: '', home_tel: '', proposed_improvements: '', building_classification: '',
        setback_n: '', setback_e: '', setback_s: '', setback_w: '', setback_coverage: '',
        project_cost: '', project_stories: '', fire_zone: '', agency_approvals: '',
        site_legal_description: '', deed_vol: '', deed_page: '', deed_at: '', deed_to: '',
        deed_date: '', restrictions: '', easements: '', liens_leases: '', lot_dimensions: '',
        lot_facing: '', lot_value: '', adjacent_property_use: '', owner_name_contact: '',
        rep_name_contact: '', contact_address: '', contact_tel: '', attorney: '',
        insurance_advisor: '', consultant_on: '', survey_property: '', survey_property_date: '',
        survey_topo: '', survey_topo_date: '', soils_tests: '', soils_date: '',
        aerial_photos: '', aerial_date: '', maps_source: '', gas_company: '', gas_rep: '',
        gas_tel: '', electric_company: '', electric_rep: '', electric_tel: '',
        tel_company: '', tel_rep: '', tel_tel: '', sewers: '', water: '',
        loan_amount: '', loan_type: '', loan_rate: '', loan_by: '', loan_rep: '',
        loan_tel: '', bonds_liens: '', grant_amount: '', grant_limitations: '',
        grant_from: '', grant_rep: '', grant_tel: '', contract_type: 'single', negotiated: '',
        bid: '', stipulated_sum: '', cost_plus_fee: '', force_amount: '',
        equipment_fixed: '', equipment_movable: '', equipment_interiors: '',
        landscaping: '', sketch_notes: '',
        survey_conducted_by_name: '',
        survey_conducted_by_designation: '',
        survey_conducted_by_contact: '',
        survey_conducted_by_cell: '',
        survey_conducted_by_landline: '',
        survey_conducted_by_email: '',
        survey_conducted_by_date: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        toast({
            title: "Record Saved",
            description: "The project data has been successfully saved.",
        });
    }

    const handleDownloadPdf = () => {
        const form = document.getElementById('site-survey-form') as HTMLFormElement;
        if (!form) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find form data.' });
            return;
        }

        const doc = new jsPDF() as jsPDFWithAutoTable;
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        let yPos = 15;
        
        const primaryColor = [45, 95, 51];
        const headingFillColor = [240, 240, 240];

        // --- MAIN HEADING ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ISBAH HASSAN & ASSOCIATES', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFontSize(14);
        doc.text('IHA PROJECT MANAGEMENT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Premises Review for Residential Project', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.setFontSize(8);
        doc.text('This questionnaire form provides preliminary information for determining the suitability of premises or property to be acquired', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SITE SURVEY', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        doc.setTextColor(0,0,0);


        const getInputValue = (id: string) => (form.elements.namedItem(id) as HTMLInputElement)?.value || '';
        const getRadioValue = (name: string) => (form.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value || 'N/A';
        const getCheckboxValue = (id: string) => (form.elements.namedItem(id) as HTMLInputElement)?.checked;
        
        const addSectionTitle = (title: string) => {
            if (yPos > 260) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.5);
            doc.setFillColor(headingFillColor[0], headingFillColor[1], headingFillColor[2]);
            doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(title, margin + 2, yPos + 5.5);
            yPos += 8;
        };

        const drawField = (label: string, value: string) => {
          if (yPos > 275) { doc.addPage(); yPos = 20; }
          doc.setLineWidth(0.2);
          doc.rect(margin, yPos, pageWidth - margin * 2, 10);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(label, margin + 2, yPos + 6);
          doc.text(value, margin + 60, yPos + 6);
          yPos += 10;
        };
        
        const drawCheckboxField = (label: string, options: {id: string, label: string}[]) => {
            if (yPos > 275) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.2);
            doc.rect(margin, yPos, pageWidth - margin * 2, 10);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(label, margin + 2, yPos + 6);
            let xOffset = 60;
            options.forEach(opt => {
                doc.rect(margin + xOffset, yPos + 2.5, 5, 5);
                if(getCheckboxValue(opt.id)) doc.text('X', margin + xOffset + 1, yPos + 6);
                doc.text(opt.label, margin + xOffset + 7, yPos + 6);
                xOffset += 40;
            });
            yPos += 10;
        };
        
        const drawRadioField = (label: string, name: string, options: string[]) => {
            if (yPos > 275) { doc.addPage(); yPos = 20; }
            doc.setLineWidth(0.2);
            doc.rect(margin, yPos, pageWidth - margin * 2, 10);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(label, margin + 2, yPos + 6);
            let xOffset = 60;
            const selectedValue = getRadioValue(name);
            options.forEach(opt => {
                doc.circle(margin + xOffset + 2.5, yPos + 5, 2.5);
                if (selectedValue === opt.toLowerCase()) doc.circle(margin + xOffset + 2.5, yPos + 5, 1.5, 'F');
                doc.text(opt, margin + xOffset + 7, yPos + 6);
                xOffset += 40;
            });
             yPos += 10;
        }

        // --- SECTIONS ---
        addSectionTitle('Location');
        drawField('Purpose', `House: ${getCheckboxValue('purpose_house') ? 'Yes' : 'No'}, Other: ${getInputValue('purpose_other_text')}`);
        drawField('Date', getInputValue('location_date'));
        drawField('City', getInputValue('location_city'));
        drawField('Region', getInputValue('location_region'));
        drawField('Address', getInputValue('location_address'));
        yPos += 5;

        addSectionTitle('Legal File');
        drawField('Name of Owner', getInputValue('legal_owner_name'));
        drawRadioField('Is Completion Certificate available', 'completion_cert', ['Yes', 'No']);
        drawRadioField('Is the property leased', 'is_leased', ['Yes', 'No']);
        yPos += 5;

        addSectionTitle('Area');
        drawField('Maximum frontage:', getInputValue('area_frontage'));
        drawField('Maximum Depth:', getInputValue('area_depth'));
        drawField('Total Area in Sqft', getInputValue('area_total'));
        drawField('Minimum clear height (ft)', getInputValue('area_height'));
        drawField('Building plot size', getInputValue('area_plot_size'));
        drawField('Covered Area', getInputValue('area_covered'));
        drawField('No. of Stories / floors', getInputValue('area_stories'));
        yPos += 5;
        
        addSectionTitle('Bounded As');
        drawField('Front', getInputValue('bounded_front'));
        drawField('Back', getInputValue('bounded_back'));
        drawField('Right', getInputValue('bounded_right'));
        drawField('Left', getInputValue('bounded_left'));
        yPos += 5;

        addSectionTitle('Utilities');
        drawField('Sanctioned electrical load', getInputValue('sanctioned_load_text'));
        drawRadioField('Type of electrical load', 'electrical_load_type', ['Commercial', 'Industrial', 'Residential']);
        drawField('Electrical Meter', getInputValue('electrical_meter'));
        drawRadioField('Piped water available', 'piped_water', ['Yes', 'No']);
        drawRadioField('Underground tank', 'underground_tank', ['Yes', 'No']);
        drawRadioField('Overhead tank', 'overhead_tank', ['Yes', 'No']);
        drawField('Type of Overhead tank', getInputValue('overhead_tank_type'));
        drawField('Type of water', getInputValue('water_type'));
        drawRadioField('Gas Connection', 'gas_connection', ['Yes', 'No']);
        drawRadioField('Connected to Sewerage line', 'sewerage_connection', ['Yes', 'No']);
        yPos += 5;
        
        doc.addPage();
        yPos = 20;

        addSectionTitle('Building overview');
        drawRadioField('Independent premises', 'independent_premises', ['Yes', 'No']);
        drawRadioField('Status', 'property_status', ['Commercial', 'Residential', 'Industrial']);
        drawField('Other Status', getInputValue('status_other_text'));
        drawRadioField('Type of Premises', 'premises_type', ['Residence', 'Offices', 'Godowns']);
        drawField('Other Premises Type', getInputValue('prem_other_text'));
        drawRadioField('Age of Premises', 'building_age', ['0-5', '5-10', '>10 years']);
        drawRadioField('Interior of Premises', 'interior_type', ['Single Hall', 'Rooms']);
        drawRadioField('Type of construction', 'construction_type', ['Beam-Column in RCC', 'Composite', 'Load Bearing']);
        yPos += 5;

        addSectionTitle('Building Details');
        drawRadioField('Seepage', 'seepage', ['Yes', 'No']);
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
        drawRadioField('Approachable through Road', 'approachable', ['Yes', 'No']);
        drawField('Wall masonary material', getInputValue('wall_material'));
        drawCheckboxField('Major retainable elements', [
            { id: 'retainable_water_tank', label: 'Water tank' },
            { id: 'retainable_subflooring', label: 'Subflooring' },
            { id: 'retainable_staircase', label: 'Staircase' },
        ]);
        drawField('Other retainable', getInputValue('retainable_other_text'));
        drawField('Plot level from road', getInputValue('plot_level'));
        drawRadioField('Building Control Violations', 'violations', ['Major', 'Minor', 'None']);
        yPos += 5;

        addSectionTitle('Rental Detail');
        drawField('Acquisition', getInputValue('rental_acquisition'));
        drawField('Expected Rental /month', getInputValue('rental_expected_rent'));
        drawField('Expected Advance', getInputValue('rental_expected_advance'));
        drawField('Expected period of lease', getInputValue('rental_lease_period'));
        drawField('Annual increase in rental', getInputValue('rental_annual_increase'));
        yPos += 5;
        
        doc.addPage();
        yPos = 20;
        
        addSectionTitle('Survey Conducted By');
        drawField('Name', getInputValue('survey_conducted_by_name'));
        drawField('Designation', getInputValue('survey_conducted_by_designation'));
        drawField('Contact', getInputValue('survey_conducted_by_contact'));
        drawField('Cell', getInputValue('survey_conducted_by_cell'));
        drawField('Landline', getInputValue('survey_conducted_by_landline'));
        drawField('Email', getInputValue('survey_conducted_by_email'));
        drawField('Date', getInputValue('survey_conducted_by_date'));
        yPos += 5;


        addSectionTitle('Survey Checklist');
        drawField('Project', getInputValue('survey_project'));
        drawField('Location', getInputValue('survey_location'));
        drawField('Contract Date', getInputValue('survey_contract_date'));
        drawField('Project Number', getInputValue('survey_project_number'));
        drawField('Start Date', getInputValue('survey_start_date'));
        drawField('Project Incharge', getInputValue('survey_project_incharge'));
        yPos += 5;

        const generateChecklistTable = (title: string, items: {no: number, title: string}[], prefix: string) => {
            if (yPos > 250) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(title, margin, yPos);
            yPos += 8;
            doc.setTextColor(0, 0, 0);
            doc.autoTable({
                startY: yPos,
                head: [['Sr.No', 'Drawing Title', 'Remarks']],
                body: items.map(item => [item.no.toString(), item.title, getInputValue(`${prefix}_remarks_${item.no}`)]),
                theme: 'grid',
                headStyles: { fillColor: headingFillColor, textColor: 0 }
            });
            yPos = (doc as any).autoTable.previous.finalY + 10;
        }

        generateChecklistTable('Architectural Drawings', checklistItems, 'checklist');
        generateChecklistTable('Structure Drawings', structureDrawingItems, 'structure');
        generateChecklistTable('Plumbing Drawings', plumbingDrawingItems, 'plumbing');
        generateChecklistTable('Electrification Drawings', electrificationDrawingItems, 'electrification');
        
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
                    title="Project Data"
                    description="A comprehensive data sheet for the project."
                    imageUrl={image?.imageUrl || ''}
                    imageHint={image?.imageHint || ''}
                />
            </div>

            <Card>
                <CardHeader>
                    <div className="text-center">
                        <p className="text-sm font-bold text-muted-foreground">ISBAH HASSAN & ASSOCIATES</p>
                        <CardTitle className="text-3xl font-headline text-primary">IHA PROJECT MANAGEMENT</CardTitle>
                        <p className="font-semibold mt-2">Premises Review</p>
                        <p className="text-sm text-muted-foreground">For Residential Project</p>
                        <p className="text-xs mt-2 max-w-2xl mx-auto">This questionnaire form provides preliminary information for determining the suitability of premises or property to be acquired</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <form id="site-survey-form" className="space-y-8">
                        <SectionTable title="Location">
                           <FormRow label="Purpose">
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2"><Checkbox id="purpose_house" name="purpose_house" /> <Label htmlFor="purpose_house">House</Label></div>
                                  <div className="flex items-center gap-2"><Checkbox id="purpose_other_check" name="purpose_other_check" /> <Label htmlFor="purpose_other_check">Other:</Label> <Input id="purpose_other_text" name="purpose_other_text" /></div>
                               </div>
                            </FormRow>
                            <FormRow label="Date"><Input type="date" id="location_date" name="location_date" className="w-fit" /></FormRow>
                            <FormRow label="City"><Input id="location_city" name="location_city" /></FormRow>
                            <FormRow label="Region"><Input id="location_region" name="location_region" /></FormRow>
                            <FormRow label="Address"><Input id="location_address" name="location_address" /></FormRow>
                        </SectionTable>

                        <SectionTable title="Legal File">
                            <FormRow label="Name of Owner"><Input id="legal_owner_name" name="legal_owner_name" /></FormRow>
                            <FormRow label="Is Completion Certificate available">
                                <RadioGroup name="completion_cert" className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="cc_yes" /><Label htmlFor="cc_yes">Yes</Label></div>
                                    <Label>As informed by Owner Representative</Label>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="cc_no" /><Label htmlFor="cc_no">No</Label></div>
                                </RadioGroup>
                            </FormRow>
                            <FormRow label="Is the property leased">
                                <RadioGroup name="is_leased" className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="leased_yes" /><Label htmlFor="leased_yes">Yes</Label></div>
                                    <Label>As informed by Owner Representative</Label>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="leased_no" /><Label htmlFor="leased_no">No</Label></div>
                                </RadioGroup>
                            </FormRow>
                        </SectionTable>
                        
                         <SectionTable title="Area">
                            <FormRow label="Dimension">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input placeholder="Maximum frontage:" id="area_frontage" name="area_frontage" />
                                <Input placeholder="Maximum Depth:" id="area_depth" name="area_depth" />
                                </div>
                            </FormRow>
                            <FormRow label="Total Area in Sqft"><Input placeholder="Total Area in Sqft" id="area_total" name="area_total" /></FormRow>
                            <FormRow label="Minimum clear height (Floor to Roof) in ft"><Input placeholder="Minimum clear height (Floor to Roof) in ft" id="area_height" name="area_height" /></FormRow>
                            <FormRow label="Building plot size of which premises is a part"><Input placeholder="Building plot size of which premises is a part" id="area_plot_size" name="area_plot_size" /></FormRow>
                            <FormRow label="Covered Area"><Input placeholder="Covered Area" id="area_covered" name="area_covered" /></FormRow>
                            <FormRow label="No. of Stories / floors"><Input placeholder="(mention mezzanine, basement, roof parapet wall etc.) If any." id="area_stories" name="area_stories" /></FormRow>
                        </SectionTable>

                        <SectionTable title="Bounded As">
                            <FormRow label="Front"><Input id="bounded_front" name="bounded_front"/></FormRow>
                            <FormRow label="Back"><Input id="bounded_back" name="bounded_back"/></FormRow>
                            <FormRow label="Right"><Input id="bounded_right" name="bounded_right" /></FormRow>
                            <FormRow label="Left"><Input id="bounded_left" name="bounded_left" /></FormRow>
                        </SectionTable>
                        
                        <SectionTable title="Utilities">
                            <FormRow label="Sanctioned electrical load">
                                <div className="flex items-center justify-between">
                                    <Input id="sanctioned_load_text" name="sanctioned_load_text" />
                                    <div className="flex items-center space-x-2"><Checkbox id="sanctioned_load_na" name="sanctioned_load_na" /><Label htmlFor="sanctioned_load_na">N/A</Label></div>
                                </div>
                            </FormRow>
                            <FormRow label="Type of electrical load">
                                <RadioGroup name="electrical_load_type" className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="commercial" id="elec_commercial" /><Label htmlFor="elec_commercial">Commercial</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="industrial" id="elec_industrial" /><Label htmlFor="elec_industrial">Industrial</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="residential" id="elec_residential" /><Label htmlFor="elec_residential">Residential</Label></div>
                                </RadioGroup>
                            </FormRow>
                            <FormRow label="Electrical Meter (single phase / 3 phase)"><Input id="electrical_meter" name="electrical_meter" /></FormRow>
                            <FormRow label="Piped water available">
                                <RadioGroup name="piped_water" className="flex items-center space-x-8"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="water_yes" /><Label htmlFor="water_yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="water_no" /><Label htmlFor="water_no">No</Label></div></RadioGroup>
                            </FormRow>
                            <FormRow label="Underground tank">
                                <RadioGroup name="underground_tank" className="flex items-center space-x-8"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="ug_tank_yes" /><Label htmlFor="ug_tank_yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="ug_tank_no" /><Label htmlFor="ug_tank_no">No</Label></div></RadioGroup>
                            </FormRow>
                            <FormRow label="Overhead tank">
                                <RadioGroup name="overhead_tank" className="flex items-center space-x-8"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="oh_tank_yes" /><Label htmlFor="oh_tank_yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="oh_tank_no" /><Label htmlFor="oh_tank_no">No</Label></div></RadioGroup>
                            </FormRow>
                            <FormRow label="Type of Overhead tank (RCC, Fiber etc.)"><Input id="overhead_tank_type" name="overhead_tank_type"/></FormRow>
                            <FormRow label="Type of water (boring or Line water)"><Input id="water_type" name="water_type" /></FormRow>
                            <FormRow label="Gas Connection">
                                <RadioGroup name="gas_connection" className="flex items-center space-x-8"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="gas_yes" /><Label htmlFor="gas_yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="gas_no" /><Label htmlFor="gas_no">No</Label></div></RadioGroup>
                            </FormRow>
                            <FormRow label="Connected to Sewerage line">
                                <RadioGroup name="sewerage_connection" className="flex items-center space-x-8"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="sewer_yes" /><Label htmlFor="sewer_yes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="sewer_no" /><Label htmlFor="sewer_no">No</Label></div></RadioGroup>
                            </FormRow>
                        </SectionTable>

                        <SectionTable title="Building overview">
                            <FormRow label="Independent premises">
                                <RadioGroup name="independent_premises" className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="ind_yes" /><Label htmlFor="ind_yes">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="ind_no" /><Label htmlFor="ind_no">No. a part of building</Label></div>
                                </RadioGroup>
                            </FormRow>
                             <FormRow label="Status">
                                <RadioGroup name="property_status" className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="commercial" id="status_comm" /><Label htmlFor="status_comm">Commercial</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="residential" id="status_res" /><Label htmlFor="status_res">Residential</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="industrial" id="status_ind" /><Label htmlFor="status_ind">Industrial</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="status_other" /><Label htmlFor="status_other">Other:</Label> <Input name="status_other_text" className="h-7" /></div>
                                </RadioGroup>
                            </FormRow>
                             <FormRow label="Type of Premises">
                                <RadioGroup name="premises_type" className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="residence" id="prem_res" /><Label htmlFor="prem_res">Residence</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="offices" id="prem_off" /><Label htmlFor="prem_off">Offices</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="godowns" id="prem_god" /><Label htmlFor="prem_god">Godowns</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="prem_other" /><Label htmlFor="prem_other">Other:</Label> <Input name="prem_other_text" className="h-7" /></div>
                                </RadioGroup>
                            </FormRow>
                            <FormRow label="Age of Premises if any">
                                <RadioGroup name="building_age" className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="0-5" id="age_0_5" /><Label htmlFor="age_0_5">0-5</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="5-10" id="age_5_10" /><Label htmlFor="age_5_10">5-10</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value=">10" id="age_gt_10" /><Label htmlFor="age_gt_10">More than 10 years</Label></div></RadioGroup>
                            </FormRow>
                             <FormRow label="Interior of Premises if any">
                                <RadioGroup name="interior_type" className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="single_hall" id="it_single_hall" /><Label htmlFor="it_single_hall">Single Hall</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="rooms" id="it_rooms" /><Label htmlFor="it_rooms">Rooms</Label></div></RadioGroup>
                            </FormRow>
                             <FormRow label="Type of construction">
                                <RadioGroup name="construction_type" className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="rcc" id="ct_rcc" /><Label htmlFor="ct_rcc">Beam-Column in RCC</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="composite" id="ct_composite" /><Label htmlFor="ct_composite">Composit Structure</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="load_bearing" id="ct_load_bearing" /><Label htmlFor="ct_load_bearing">Load Bearing in walls</Label></div></RadioGroup>
                            </FormRow>
                        </SectionTable>

                        <div className="flex justify-end gap-4 mt-12">
                            <Button type="button" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Record</Button>
                            <Button type="button" onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

```
- src/app/employee-dashboard/substantial-summary/page.tsx:
```tsx

import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Page() {
  const image = PlaceHolderImages.find(p => p.id === 'substantial-summary');

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Substantial Summary"
        description="Review substantial project summaries."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
    </div>
  );
}

```
- src/app/employee-dashboard/total-project-package/page.tsx:
```tsx

import DashboardPageHeader from "@/components/dashboard/PageHeader";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Page() {
  const image = PlaceHolderImages.find(p => p.id === 'total-project-package');

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Total Project Package"
        description="Manage the total project package."
        imageUrl={image?.imageUrl || ''}
        imageHint={image?.imageHint || ''}
      />
    </div>
  );
}

```
- src/firebase/index.ts:
```ts
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; storage: FirebaseStorage; } {
  if (getApps().length === 0) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}

export * from './provider';
export * from './client';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

```
- src/app/layout.tsx:
```tsx
'use client'
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/context/UserContext';
import { EmployeeProvider } from '@/context/EmployeeContext';
import { FileProvider } from '@/context/FileContext';
import { RecordProvider } from '@/context/RecordContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <UserProvider>
            <EmployeeProvider>
              <FileProvider>
                <RecordProvider>
                  {children}
                </RecordProvider>
              </FileProvider>
            </EmployeeProvider>
          </UserProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

```
- src/app/page.tsx:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/context/UserContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function Hero() {
  const image = PlaceHolderImages.find(p => p.id === 'hero-architecture');
  return (
    <section className="relative h-[60vh] flex items-center justify-center text-white">
      <Image 
        src={image?.imageUrl || ''}
        alt={image?.description || 'Architectural building'}
        fill
        className="object-cover"
        priority
        data-ai-hint={image?.imageHint}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center p-4">
        <h1 className="text-4xl md:text-6xl font-headline animate-in fade-in-0 slide-in-from-top-10 duration-1000">ISBAH HASSAN & ASSOCIATES</h1>
        <Button asChild size="lg" className="mt-8 animate-in fade-in-0 slide-in-from-bottom-10 duration-1000 delay-500">
          <Link href="/login">Start Now</Link>
        </Button>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { user, isUserLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      if (['ceo', 'admin', 'software-engineer'].includes(user.department)) {
          router.push('/dashboard');
      } else {
          router.push('/employee-dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        {/* Add other sections for the homepage here */}
      </main>
    </div>
  );
}

```
- src/app/login/page.tsx:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import Header from '@/components/layout/header';
import { employees } from '@/lib/employees';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { login, user, isUserLoading } = useCurrentUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      toast({
        title: 'Already Logged In',
        description: `Redirecting you to your dashboard, ${user.name}.`,
      });
      if (['ceo', 'admin', 'software-engineer'].includes(user.department)) {
          router.push('/dashboard');
      } else {
          router.push('/employee-dashboard');
      }
    }
  }, [user, isUserLoading, router, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const employee = employees.find(emp => emp.email === email && emp.password === password);
    
    if (employee) {
        login({ ...employee, uid: employee.record });
        toast({
            title: 'Login Successful',
            description: `Welcome back, ${employee.name}!`,
        });
        if (['ceo', 'admin', 'software-engineer'].includes(employee.department)) {
            router.push('/dashboard');
        } else {
            router.push('/employee-dashboard');
        }
    } else {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid email or password.',
        });
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">Login</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

```
- src/app/dashboard/layout.tsx:
```tsx
'use client';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { UserProvider } from "@/context/UserContext";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { EmployeeProvider } from "@/context/EmployeeContext";
import { FileProvider } from "@/context/FileContext";
import { RecordProvider } from "@/context/RecordContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <Header />
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}

```
- src/context/UserContext.tsx:
```tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Employee, employees } from '@/lib/employees';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { User } from 'firebase/auth';

// Simulate onAuthStateChanged
const onAuthStateChanged = (auth: any, callback: (user: User | null) => void) => {
    if (typeof window === 'undefined') {
        callback(null);
        return () => {};
    }
    const userJson = localStorage.getItem('currentUser');
    const user = userJson ? JSON.parse(userJson) : null;
    callback(user);
    // No actual listener, just a one-time check
    return () => {};
};

// Simulate signOut
const signOut = (auth: any) => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
    }
    return Promise.resolve();
}

interface UserContextType {
  user: (Employee & { uid: string }) | null;
  isUserLoading: boolean;
  login: (user: Employee & { uid: string }) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(Employee & { uid: string }) | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  // No real auth dependency anymore
  const auth = {}; // Dummy auth object

  useEffect(() => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const storedUser = JSON.parse(userJson);
        setUser(storedUser);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setIsUserLoading(false);
  }, []);

  const login = (loggedInUser: Employee & { uid: string }) => {
    setUser(loggedInUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
    router.push('/login');
  };

  return (
    <UserContext.Provider value={{ user, isUserLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
};

```