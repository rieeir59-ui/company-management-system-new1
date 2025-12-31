
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const allFileNames = [
  "Architect's Supplemental Instructions",
  "Architect's Field Report",
  "Bill of Quantity",
  "Change Order",
  "Consent of Surety (Retainage)",
  "Consent of Surety (Final Payment)",
  "Construction Change Directive",
  "Construction Activity Schedule",
  "Continuation Sheet",
  "Drawings List",
  "Instruction Sheet",
  "List of Contractors",
  "List of Sub-Consultants",
  "Preliminary Project Budget",
  "Project Agreement",
  "Project Application Summary",
  "Project Checklist",
  "Project Data",
  "Project Information",
  "Proposal Request",
  "Rate Analysis",
  "Shop Drawing and Sample Record",
  "Timeline Schedule",
  "My Projects",
  "Task Assignment",
  "Site Visit Proforma",
  "Site Survey Report",
  "Site Survey",
  "Uploaded File",
  "Daily Work Report",
  "Leave Request Form",
];

const fileNameToUrlMap: Record<string, string> = {
  "Architect's Supplemental Instructions": "architects-instructions",
  "Architect's Field Report": "field-reports-meetings/architects-field-report",
  "Bill of Quantity": "bill-of-quantity",
  "Change Order": "change-order",
  "Consent of Surety (Retainage)": "consent-of-surety",
  "Consent of Surety (Final Payment)": "consent-of-surety",
  "Construction Change Directive": "construction-change-director",
  "Construction Activity Schedule": "construction-schedule",
  "Continuation Sheet": "continuation-sheet",
  "Drawings List": "drawings",
  "Instruction Sheet": "instruction-sheet",
  "List of Contractors": "list-of-contractors",
  "List of Sub-Consultants": "list-of-sub-consultants",
  "Preliminary Project Budget": "preliminary-project-budget",
  "Project Agreement": "project-agreement",
  "Project Application Summary": "project-application-summary",
  "Project Checklist": "project-checklist",
  "Project Data": "project-data",
  "Project Information": "project-information",
  "Proposal Request": "proposal-request",
  "Rate Analysis": "rate-analysis",
  "Shop Drawing and Sample Record": "shop-drawings-record",
  "Timeline Schedule": "time-line-schedule",
  "My Projects": "my-projects",
  "Task Assignment": "assign-task/form",
  "Site Visit Proforma": "site-visit",
  "Site Survey Report": "site-survey-report",
  "Site Survey": "site-survey",
  "Uploaded File": "files-record",
  "Daily Work Report": "daily-report",
  "Leave Request Form": "leave-application",
  "Leave Application": "leave-application",
};

export function getFormUrlFromFileName(fileName: string, dashboardPrefix: 'dashboard' | 'employee-dashboard'): string | null {
  const slug = fileNameToUrlMap[fileName];
  if (slug) {
    return `/${dashboardPrefix}/${slug}`;
  }
  
  if (fileName.endsWith(" Timeline")) {
    const bankKey = fileName.replace(" Timeline", "").toLowerCase().replace(/ /g, '-');
    return `/${dashboardPrefix}/timelines-of-bank/${bankKey}`;
  }
  
  return null;
}
