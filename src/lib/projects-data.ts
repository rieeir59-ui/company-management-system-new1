
export interface ProjectRow {
  id: number;
  srNo: string;
  projectName: string;
  area: string;
  projectHolder: string;
  allocationDate: string;
  siteSurveyStart: string;
  siteSurveyEnd: string;
  contactStart: string;
  contactEnd: string;
  headCountStart: string;
  headCountEnd: string;
  proposalStart: string;
  proposalEnd: string;
  threedStart: string;
  threedEnd: string;
  tenderArchStart: string;
  tenderArchEnd: string;
  tenderMepStart: string;
  tenderMepEnd: string;
  boqStart: string;
  boqEnd: string;
  tenderStatus: string;
  comparative: string;
  workingDrawings: string;
  siteVisit: string;
  finalBill: string;
  projectClosure: string;
}

export const askariBankProjects: ProjectRow[] = [
    { id: 1, srNo: '1', projectName: 'AKBL AWT SADDAR RWP', area: '14,000', projectHolder: 'Noman Asad Mohsin', allocationDate: '6-Oct-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: 'Received', contactEnd: '', headCountStart: '14-Oct-25', headCountEnd: '17-Oct-25', proposalStart: '17-Oct-25', proposalEnd: '21-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 2, srNo: '2', projectName: 'AKBL CHAKLALA GARRISON RWP', area: '4,831', projectHolder: 'Noman Asad Mohsin', allocationDate: '13-Sep-25', siteSurveyStart: 'In-Progress', siteSurveyEnd: '', contactStart: 'Recieved', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '1-Oct-25', proposalEnd: '3-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 3, srNo: '3', projectName: 'AKBL Priority Lounge', area: '24,000.00', projectHolder: 'Noman Haseeb Mohsin', allocationDate: '28-Mar-25', siteSurveyStart: 'DONE', siteSurveyEnd: '', contactStart: 'Recevied', contactEnd: '', headCountStart: '21-Apr-25', headCountEnd: '28-Apr-25', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: 'sent', tenderArchEnd: '', tenderMepStart: 'sent', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: 'sent', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 4, srNo: '4', projectName: 'AKBL Ocean Mall KHI', area: '430.00', projectHolder: 'Noman Asad Mohsin', allocationDate: '10-Oct-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
];

export const hblProjects: ProjectRow[] = [
    { id: 101, srNo: '1', projectName: 'HBL PRESTIGE JOHER TOWN', area: '10,000', projectHolder: 'Luqman', allocationDate: '19-Sep-25', siteSurveyStart: '4-Aug-25', siteSurveyEnd: '5-Aug-25', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '22-Sep-25', proposalEnd: '8-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '21-Oct-25', tenderArchEnd: '25-Oct-25', tenderMepStart: '25-Oct-25', tenderMepEnd: '3-Nov-25', boqStart: '3-Nov-25', boqEnd: '4-Nov-25', tenderStatus: 'Send', comparative: '4-Nov-25', workingDrawings: '30-Oct-25', siteVisit: '15-Nov-25', finalBill: '', projectClosure: '' },
    { id: 102, srNo: '2', projectName: '68-A HBL Prestige & RBC CITY HOUSING SIALKOT-II', area: '9,880', projectHolder: 'Jabar Luqman', allocationDate: '28-Sep-25', siteSurveyStart: '2-Oct-25', siteSurveyEnd: '3-Oct-25', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '5-Oct-25', proposalEnd: '15-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: 'Hold', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 103, srNo: '3', projectName: 'HBL DHA GUJRANWALA', area: '4,028', projectHolder: 'Luqman', allocationDate: '6-Sep-25', siteSurveyStart: '4-Sep', siteSurveyEnd: '5-Sep', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '8-Sep-25', proposalEnd: '12-Sep-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: 'Hold', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 104, srNo: '4', projectName: 'HBL CITY HOUSING SIALKOT', area: '10,135', projectHolder: 'Luqman', allocationDate: '11-Sep-25', siteSurveyStart: '26-Aug-25', siteSurveyEnd: '27-Aug-25', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '12-Sep-25', proposalEnd: '18-Sep-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 105, srNo: '5', projectName: 'HBL ASLAM MOR LAYYAH', area: '2,022', projectHolder: 'MUJAHID Luqman', allocationDate: '11-Sep-25', siteSurveyStart: '21-Sep-25', siteSurveyEnd: '22-Sep-25', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '5-Oct-25', proposalEnd: '6-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '5-Oct-25', tenderArchEnd: '9-Oct-25', tenderMepStart: '9-Oct-25', tenderMepEnd: '12-Oct-25', boqStart: '12-Oct-25', boqEnd: '12-Oct-25', tenderStatus: 'Send', comparative: '', workingDrawings: '28-Oct-26', siteVisit: '4-Nov-25', finalBill: '1s visit', projectClosure: '' },
    { id: 106, srNo: '6', projectName: 'HBL Hellan Branch 1376 Gujranwala', area: '2,260', projectHolder: 'MUJAHID Luqman', allocationDate: '19-Sep-25', siteSurveyStart: '7-Sep-25', siteSurveyEnd: '8-Sep-25', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '5-Oct-25', proposalEnd: '27-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '28-Oct-25', tenderArchEnd: '3-Nov-25', tenderMepStart: '30-Oct-25', tenderMepEnd: '4-Nov-25', boqStart: '4-Nov-25', boqEnd: '5-Nov-25', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 107, srNo: '7', projectName: 'HBL Jaranwala Road', area: '2,725.00', projectHolder: 'Luqman Mujahid', allocationDate: '23-Aug-26', siteSurveyStart: '21-Aug-26', siteSurveyEnd: '21-Aug-26', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '21-Oct-25', proposalEnd: '25-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '14-Nov-25', siteVisit: '18-Nov-25', finalBill: '', projectClosure: '' },
    { id: 108, srNo: '8', projectName: 'HBL Poona branch', area: '1,422.00', projectHolder: 'Mujahid', allocationDate: 'N/A', siteSurveyStart: 'N/A', siteSurveyEnd: 'N/A', contactStart: 'Done', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '27-May-25', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '25-Oct-26', tenderArchEnd: '26-Oct-25', tenderMepStart: '27-Oct-26', tenderMepEnd: '1-Nov-25', boqStart: '26-Oct-25', boqEnd: '26-Oct-26', tenderStatus: 'Send', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 109, srNo: '9', projectName: 'HBL Raya Branch Lahore', area: '11,720.00', projectHolder: 'Luqman Adnan', allocationDate: '13-Dec-23', siteSurveyStart: '14-Dec-23', siteSurveyEnd: '16-Dec-23', contactStart: 'Done', contactEnd: '', headCountStart: 'Received', headCountEnd: '', proposalStart: '13-Feb-24', proposalEnd: '27-Feb-24', threedStart: '28-Feb-24', threedEnd: '9-Mar-24', tenderArchStart: '11-Mar-24', tenderArchEnd: '26-Mar-24', tenderMepStart: '12-Mar-24', tenderMepEnd: '20-Mar-24', boqStart: '22-Mar-24', boqEnd: '30-Mar-24', tenderStatus: 'Send', comparative: 'Send', workingDrawings: '12-Mar-25', siteVisit: '20-Mar-25', finalBill: 'VISITS DONE', projectClosure: '' },
    { id: 110, srNo: '10', projectName: 'HBL Chowk Azam Branch 0847 Multan', area: '2,510.00', projectHolder: 'Luqman Mujahid', allocationDate: '9-Apr-26', siteSurveyStart: '17-Apr-26', siteSurveyEnd: '18-Apr-26', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '10-Jun-25', tenderArchEnd: '11-Jul-25', tenderMepStart: '23-Jun-25', tenderMepEnd: '30-Jun-26', boqStart: '11-Jul-25', boqEnd: '14-Jul-26', tenderStatus: 'Sent', comparative: '', workingDrawings: '16-Jul-25', siteVisit: '19-Jul-25', finalBill: '1s visit', projectClosure: '' },
    { id: 111, srNo: '11', projectName: 'HBL Islamic prestige', area: '1,778.00', projectHolder: 'Mohsin Ali', allocationDate: '26-Jul-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '28-Aug-25', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '1-Sep-25', boqEnd: '2-Sep-26', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
];

export const ublProjects: ProjectRow[] = [
    { id: 201, srNo: '1', projectName: 'UBL Bhowana, Chiniot', area: '7,600.00', projectHolder: 'Adnan Luqman', allocationDate: '6-may-25', siteSurveyStart: '20-may-25', siteSurveyEnd: '21-may-25', contactStart: 'Done', contactEnd: '', headCountStart: '6-may-25', headCountEnd: '', proposalStart: '6-Jul-25', proposalEnd: 'Done', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 202, srNo: '2', projectName: 'UBL QASIMABAD, HYDERABAD', area: '13,600.00', projectHolder: '', allocationDate: 'Done', siteSurveyStart: 'Done', siteSurveyEnd: '', contactStart: 'Done', contactEnd: '', headCountStart: 'Done', headCountEnd: '', proposalStart: 'Done', proposalEnd: 'Done', threedStart: 'Done', threedEnd: 'Done', tenderArchStart: 'Done', tenderArchEnd: 'Done', tenderMepStart: 'Done', tenderMepEnd: 'Done', boqStart: 'Done', boqEnd: 'Done', tenderStatus: 'Done', comparative: 'Done', workingDrawings: 'Done', siteVisit: 'Done', finalBill: '', projectClosure: '' },
    { id: 203, srNo: '3', projectName: 'UBL NELA-GUMBAD LHR', area: '', projectHolder: '', allocationDate: '', siteSurveyStart: '', siteSurveyEnd: '', contactStart: 'Done', contactEnd: '', headCountStart: 'Done', headCountEnd: '', proposalStart: 'Done', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: 'Hold', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 204, srNo: '4', projectName: 'UBL PHASE 6', area: '13,085.00', projectHolder: 'Adnan Haseeb', allocationDate: '6-april-24', siteSurveyStart: '', siteSurveyEnd: '', contactStart: 'Done', contactEnd: '', headCountStart: 'Done', headCountEnd: '', proposalStart: 'Done', proposalEnd: '', threedStart: '', threedEnd: 'Sent', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: 'Pending', boqStart: '', boqEnd: 'Pending', tenderStatus: 'Done', comparative: 'In Revision', workingDrawings: 'In Revision', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 205, srNo: '5', projectName: 'State Life Society', area: '6,691.00', projectHolder: 'Adnan Haseeb', allocationDate: '6-March-24', siteSurveyStart: '', siteSurveyEnd: '', contactStart: 'Done', contactEnd: '', headCountStart: 'Done', headCountEnd: '', proposalStart: 'Done', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '23-Oct-24', siteVisit: '28-Oct-24', finalBill: '', projectClosure: '' }
];

export const mcbProjects: ProjectRow[] = [
    { id: 301, srNo: '1', projectName: 'MCB DHA Phase 5 Branch', area: '4,200', projectHolder: 'Haseeb', allocationDate: '2-Feb-25', siteSurveyStart: '5-Feb-25', siteSurveyEnd: '6-Feb-25', contactStart: 'Received', contactEnd: '', headCountStart: '10-Feb-25', headCountEnd: '15-Feb-25', proposalStart: '16-Feb-25', proposalEnd: '28-Feb-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
];

export const fblProjects: ProjectRow[] = [
    { id: 401, srNo: '1', projectName: 'Faysal Bank Islamic Centre', area: '7,800', projectHolder: 'Asad', allocationDate: '18-May-25', siteSurveyStart: '20-May-25', siteSurveyEnd: '21-May-25', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
];

export const dibProjects: ProjectRow[] = [
     { id: 501, srNo: '1', projectName: 'DIB Gulberg Flagship', area: '6,000', projectHolder: 'Luqman', allocationDate: '25-Jun-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
];

export const bankAlfalahProjects: ProjectRow[] = [
    { id: 601, srNo: '1', projectName: 'BALF Currency Exchange Dolmen Mall Lahore', area: '800.00', projectHolder: 'Haseeb', allocationDate: '26-May-25', siteSurveyStart: '4-Apr-25', siteSurveyEnd: '4-Apr-25', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '5-Apr-25', proposalEnd: '11-Apr-25', threedStart: '14-Apr-25', threedEnd: '18-Apr-25', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '10-Sep-25', boqStart: '', boqEnd: '', tenderStatus: 'Sent', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 602, srNo: '2', projectName: 'Bank Al-Falah Brand Manual', area: 'N/A', projectHolder: 'Zain', allocationDate: '2-Feb-25', siteSurveyStart: 'N/A', siteSurveyEnd: 'N/A', contactStart: '11-Feb-25', contactEnd: '', headCountStart: 'N/A', headCountEnd: 'N/A', proposalStart: 'N/A', proposalEnd: 'N/A', threedStart: 'N/A', threedEnd: 'N/A', tenderArchStart: 'N/A', tenderArchEnd: 'N/A', tenderMepStart: '5-Aug', tenderMepEnd: 'N/A', boqStart: 'N/A', boqEnd: 'N/A', tenderStatus: 'N/A', comparative: 'N/A', workingDrawings: 'N/A', siteVisit: 'N/A', finalBill: 'N/A', projectClosure: '' },
    { id: 603, srNo: '3', projectName: 'BALF Shahdin Manzil Branch Lahore', area: '3,830.00', projectHolder: 'Mujahid Luqman', allocationDate: 'N/A', siteSurveyStart: 'N/A', siteSurveyEnd: 'N/A', contactStart: 'Received', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '25-Sep-25', proposalEnd: '21-Oct-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
];

export const bankAlHabibProjects: ProjectRow[] = [
    { id: 701, srNo: '1', projectName: 'BAHL Main Boulevard Branch', area: '4,500', projectHolder: 'Kizzar', allocationDate: '1-Aug-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
];

export const cbdProjects: ProjectRow[] = [
    { id: 801, srNo: '1', projectName: 'CBD Head Office Interior', area: '25,000', projectHolder: 'Isbah Hassan', allocationDate: '10-Sep-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
];

export const commercialProjects: ProjectRow[] = [
    { id: 901, srNo: '1', projectName: 'Plaza 101', area: '150,000', projectHolder: 'Asad', allocationDate: '5-Jan-25', siteSurveyStart: 'Done', siteSurveyEnd: 'Done', contactStart: 'Done', contactEnd: '', headCountStart: 'In-Progress', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
];

export const residentialProjects: ProjectRow[] = [
    { id: 1001, srNo: '1', projectName: "Mr. Usman's Residence", area: '8,500', projectHolder: 'Haseeb', allocationDate: '12-Mar-25', siteSurveyStart: '14-Mar-25', siteSurveyEnd: '15-Mar-25', contactStart: 'Done', contactEnd: '', headCountStart: '20-Mar-25', headCountEnd: '25-Mar-25', proposalStart: '26-Mar-25', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
];

export const allProjects: ProjectRow[] = [
    ...askariBankProjects,
    ...hblProjects,
    ...ublProjects,
    ...mcbProjects,
    ...fblProjects,
    ...dibProjects,
    ...bankAlfalahProjects,
    ...bankAlHabibProjects,
    ...cbdProjects,
    ...commercialProjects,
    ...residentialProjects
];

export const bankProjectsMap: Record<string, ProjectRow[]> = {
    "askari bank": askariBankProjects,
    "hbl": hblProjects,
    "ubl": ublProjects,
    "mcb": mcbProjects,
    "fbl": fblProjects,
    "dib": dibProjects,
    "bank alfalah": bankAlfalahProjects,
    "bank al habib": bankAlHabibProjects,
    "cbd": cbdProjects,
    "commercial": commercialProjects,
    "residential": residentialProjects,
};
