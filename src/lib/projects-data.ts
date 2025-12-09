
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
    // Add HBL specific projects here
];

export const ublProjects: ProjectRow[] = [
    // Add UBL specific projects here
];

export const mcbProjects: ProjectRow[] = [
    // Add MCB specific projects here
];

export const fblProjects: ProjectRow[] = [
    // Add Faysal Bank specific projects here
];

export const dibProjects: ProjectRow[] = [
    // Add Dubai Islamic Bank specific projects here
];

export const bankAlfalahProjects: ProjectRow[] = [
    // Add Bank Alfalah specific projects here
];

export const bankAlHabibProjects: ProjectRow[] = [
    // Add Bank Al Habib specific projects here
];

export const cbdProjects: ProjectRow[] = [
    // Add Commercial Bank of Dubai specific projects here
];

export const commercialProjects: ProjectRow[] = [
    // Add Commercial projects here
];

export const residentialProjects: ProjectRow[] = [
    // Add Residential projects here
];

// This can be used for pages that might show all projects or as a fallback.
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
