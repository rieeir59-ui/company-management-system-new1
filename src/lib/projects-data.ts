
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
    { id: 101, srNo: '1', projectName: 'HBL Tower Renovation', area: '55,000', projectHolder: 'Asad Luqman', allocationDate: '15-Jan-25', siteSurveyStart: '20-Jan-25', siteSurveyEnd: '25-Jan-25', contactStart: '26-Jan-25', contactEnd: '28-Jan-25', headCountStart: '29-Jan-25', headCountEnd: '5-Feb-25', proposalStart: '6-Feb-25', proposalEnd: '20-Feb-25', threedStart: '21-Feb-25', threedEnd: '5-Mar-25', tenderArchStart: '6-Mar-25', tenderArchEnd: '20-Mar-25', tenderMepStart: '6-Mar-25', tenderMepEnd: '20-Mar-25', boqStart: '21-Mar-25', boqEnd: '30-Mar-25', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 102, srNo: '2', projectName: 'HBL Johar Town Branch', area: '3,500', projectHolder: 'Waleed', allocationDate: '1-Mar-25', siteSurveyStart: '3-Mar-25', siteSurveyEnd: '4-Mar-25', contactStart: '5-Mar-25', contactEnd: '6-Mar-25', headCountStart: '7-Mar-25', headCountEnd: '10-Mar-25', proposalStart: '11-Mar-25', proposalEnd: '18-Mar-25', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 103, srNo: '3', projectName: 'HBL Gulberg Main Branch', area: '4,800', projectHolder: 'Haseeb', allocationDate: '10-Apr-25', siteSurveyStart: '12-Apr-25', siteSurveyEnd: '13-Apr-25', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '18-Apr-25', proposalEnd: '25-Apr-25', threedStart: '26-Apr-25', threedEnd: '5-May-25', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 104, srNo: '4', projectName: 'HBL Corporate Center, Islamabad', area: '120,000', projectHolder: 'Isbah Hassan', allocationDate: '1-Jun-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 105, srNo: '5', projectName: 'HBL Prestige Lounge, Karachi', area: '2,500', projectHolder: 'Asad', allocationDate: '15-Jul-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 106, srNo: '6', projectName: 'HBL Garden Town Renovation', area: '3,200', projectHolder: 'Luqman', allocationDate: '20-Aug-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' },
    { id: 107, srNo: '7', projectName: 'HBL Faisalabad Main Branch', area: '5,500', projectHolder: 'Waleed', allocationDate: '5-Sep-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
];

export const ublProjects: ProjectRow[] = [
    { id: 201, srNo: '1', projectName: 'UBL Regional HQ', area: '120,000', projectHolder: 'Isbah Hassan', allocationDate: '1-Jan-24', siteSurveyStart: 'Completed', siteSurveyEnd: '', contactStart: 'Completed', contactEnd: '', headCountStart: 'Completed', headCountEnd: '', proposalStart: 'Completed', proposalEnd: '', threedStart: 'Completed', threedEnd: '', tenderArchStart: 'Completed', tenderArchEnd: '', tenderMepStart: 'Completed', tenderMepEnd: '', boqStart: 'Completed', boqEnd: '', tenderStatus: 'Awarded', comparative: 'Done', workingDrawings: 'In-Progress', siteVisit: 'Ongoing', finalBill: '', projectClosure: '' },
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
     { id: 601, srNo: '1', projectName: 'BAFL Model Town Branch', area: '3,900', projectHolder: 'Waleed', allocationDate: '30-Jul-25', siteSurveyStart: '', siteSurveyEnd: '', contactStart: '', contactEnd: '', headCountStart: '', headCountEnd: '', proposalStart: '', proposalEnd: '', threedStart: '', threedEnd: '', tenderArchStart: '', tenderArchEnd: '', tenderMepStart: '', tenderMepEnd: '', boqStart: '', boqEnd: '', tenderStatus: '', comparative: '', workingDrawings: '', siteVisit: '', finalBill: '', projectClosure: '' }
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
