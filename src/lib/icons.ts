
import {
  FileText,
  FileUp,
  ClipboardCheck,
  Calendar,
  Wallet,
  CheckSquare,
  FileX,
  FileSignature,
  FileKey,
  Scroll,
  BarChart2,
  Clock,
  Book,
  Clipboard,
  Presentation,
  Package,
  ListChecks,
  Palette,
  Compass,
  FileSearch,
  BookUser,
  Building,
  UserCheck,
  Briefcase,
  Users,
  User,
  Folder,
  Database,
  UserCog,
  Landmark,
  Building2,
  Home,
  Save,
  Eye,
  Archive,
  FilePen,
  File as FileIcon,
  type LucideIcon,
  FolderOpen,
  ClipboardList,
  UploadCloud,
  CalendarOff,
} from 'lucide-react';

export const fileNameToIconMap: Record<string, LucideIcon> = {
    "Architect's Supplemental Instructions": User,
    "Bill of Quantity": Wallet,
    "Change Order": Book,
    "Consent of Surety (Retainage)": FilePen,
    "Consent of Surety (Final Payment)": FilePen,
    "Construction Change Directive": Users,
    "Construction Activity Schedule": Calendar,
    "Continuation Sheet": FileX,
    "Drawings List": Palette,
    "Instruction Sheet": FileUp,
    "List of Contractors": Building,
    "List of Sub-Consultants": BookUser,
    "Preliminary Project Budget": Scroll,
    "Project Agreement": FileSignature,
    "Project Application Summary": CheckSquare,
    "Project Checklist": ListChecks,
    "Project Data": Database,
    "Project Information": Folder,
    "Proposal Request": Briefcase,
    "Rate Analysis": BarChart2,
    "Shop Drawing and Sample Record": FileIcon,
    "Timeline Schedule": Clock,
    "My Projects": Briefcase,
    "Task Assignment": ClipboardCheck,
    "Site Visit Proforma": Eye,
    "Site Survey Report": FileSearch,
    "Uploaded File": FileUp,
    "Daily Work Report": ClipboardList,
    "Site Survey": Compass,
    "Upload": UploadCloud,
    "Leave Request Form": CalendarOff,
    "Leave Application": CalendarOff,
};

export const getIconForFile = (fileName: string): LucideIcon => {
    return fileNameToIconMap[fileName] || FileText;
};

// This can be expanded to include other logical groupings
export const categoryToIconMap: Record<string, LucideIcon> = {
    "Banks": Landmark,
    "Management Records": Building2,
    ...fileNameToIconMap, // Keep individual file icons as well
};

// Fallback to a generic folder icon if no specific icon is found
export const getIconForCategory = (categoryName: string): LucideIcon => {
    return categoryToIconMap[categoryName] || Folder;
};
