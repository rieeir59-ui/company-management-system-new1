
'use client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { type SavedRecord } from '@/context/RecordContext';
import { isValid, parseISO, format, differenceInMinutes } from 'date-fns';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: {
    finalY: number;
  };
}

const drawCheckbox = (doc: jsPDF, x: number, y: number, checked: boolean) => {
    doc.setLineWidth(0.2);
    doc.rect(x, y - 3.5, 4, 4, checked ? 'F' : 'S');
};

const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerText = "M/S Isbah Hassan & Associates Y-101 (Com), Phase-III, DHA Lahore Cantt 0321-6995378, 042-35692522";
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
};

const addDefaultHeader = (doc: jsPDF, record: SavedRecord) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [45, 95, 51];
    let yPos = 15;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(record.fileName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(record.projectName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    doc.setFontSize(9);
    doc.text(`Record ID: ${record.id}`, 14, yPos);
    doc.text(`Date: ${record.createdAt.toLocaleDateString()}`, pageWidth - 14, yPos, { align: 'right' });
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(14, yPos - 5, pageWidth - 14, yPos - 5);
    return yPos;
};


export const generatePdfForRecord = (record: SavedRecord) => {
    
    if (record.fileName.includes('Timeline')) {
        const doc = new jsPDF({ orientation: 'landscape' }) as jsPDFWithAutoTable;
        const projectsData = record.data?.find((d: any) => d.category === 'Projects')?.items || [];
        const statusData = record.data?.find((d: any) => d.category === 'Status & Remarks')?.items || [];
        
        const overallStatus = statusData.find((i:any) => i.label === 'Overall Status')?.value;
        const remarks = statusData.find((i:any) => i.label === 'Maam Isbah Remarks & Order')?.value;
        const remarksDate = statusData.find((i:any) => i.label === 'Date')?.value;
        let yPos = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(record.fileName, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        const head = [
            [
                { content: 'Sr.No', rowSpan: 2 }, { content: 'Project Name', rowSpan: 2 }, { content: 'Area in Sft', rowSpan: 2 },
                { content: 'Project Holder', rowSpan: 2 }, { content: 'Allocation Date / RFP', rowSpan: 2 },
                { content: 'Site Survey', colSpan: 2 }, { content: 'Contract', colSpan: 2 },
                { content: 'Head Count / Requirement', colSpan: 2 }, { content: 'Proposal / Design Development', colSpan: 2 },
                { content: "3D's", colSpan: 2 }, { content: 'Tender Package Architectural', colSpan: 2 }, { content: 'Tender Package MEP', colSpan: 2 },
                { content: 'BOQ', colSpan: 2 }, { content: 'Tender Status', rowSpan: 2 }, { content: 'Comparative', rowSpan: 2 },
                { content: 'Working Drawings', colSpan: 2 }, { content: 'Site Visit', colSpan: 2 },
                { content: 'Final Bill', rowSpan: 2 }, { content: 'Project Closure', rowSpan: 2 }
            ],
            [
                'Start', 'End', 'Start', 'End', 'Start', 'End', 'Start', 'End',
                'Start', 'End', 'Start', 'End', 'Start', 'End', 'Start', 'End',
                'Start', 'End', 'Start', 'End'
            ]
        ];

        const body = projectsData.map((p: any) => [
            p.srNo, p.projectName, p.area, p.projectHolder, p.allocationDate,
            p.siteSurveyStart, p.siteSurveyEnd,
            p.contractStart || '', p.contactEnd || '',
            p.headCountStart || '', p.headCountEnd || '',
            p.proposalStart, p.proposalEnd,
            p.threedStart, p.threedEnd,
            p.tenderArchStart, p.tenderArchEnd,
            p.tenderMepStart, p.tenderMepEnd,
            p.boqStart, p.boqEnd,
            p.tenderStatus, p.comparative,
            p.workingDrawingsStart || '', p.workingDrawingsEnd || '',
            p.siteVisitStart || '', p.siteVisitEnd || '',
            p.finalBill, p.projectClosure
        ]);

        doc.autoTable({
            head: head,
            body: body,
            startY: yPos,
            theme: 'grid',
            styles: { fontSize: 5, cellPadding: 1, valign: 'middle', halign: 'center' },
            headStyles: { fillColor: [45, 95, 51], fontStyle: 'bold', fontSize: 4.5, valign: 'middle', halign: 'center' },
        });
        
        let lastY = doc.lastAutoTable.finalY + 10;

        if (overallStatus) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text("Overall Status:", 14, lastY);
            lastY += 7;
            doc.setFont('helvetica', 'normal');
            doc.text(overallStatus, 14, lastY, { maxWidth: 260 });
            lastY += doc.getTextDimensions(overallStatus, { maxWidth: 260 }).h + 10;
        }

        if (remarks) {
            doc.setFont('helvetica', 'bold');
            doc.text("Maam Isbah Remarks & Order", 14, lastY);
            lastY += 7;
            doc.setFont('helvetica', 'normal');
            doc.text(remarks, 14, lastY, { maxWidth: 260 });
            lastY += doc.getTextDimensions(remarks, { maxWidth: 260 }).h + 10;
        }
        
        if (remarksDate) {
            doc.text(`Date: ${remarksDate}`, 14, lastY);
        }

        addFooter(doc);
        doc.save(`${record.fileName.replace(/ /g, '_')}.pdf`);
        return;
    }

    const doc = new jsPDF({ orientation: 'portrait' }) as jsPDFWithAutoTable;
    let yPos = 15;

    if (record.fileName === 'Daily Work Report') {
        const entries = record.data[0]?.items || [];
        const pageWidth = doc.internal.pageSize.getWidth();
        const primaryColor = [45, 95, 51];
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Daily Work Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(record.projectName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        const head = [['Date', 'Day', 'Start', 'End', 'Project', 'Description', 'Total Units']];
        const body = entries.map((entry: any) => {
            const date = parseISO(entry.date);
            const totalUnits = isValid(date) ? format(date, 'dd-MMM-yyyy') : 'Invalid Date';
            return [
                isValid(date) ? format(date, 'dd-MMM-yyyy') : 'Invalid Date',
                isValid(date) ? format(date, 'EEEE') : '-',
                entry.startTime,
                entry.endTime,
                entry.projectName,
                entry.description,
                differenceInMinutes(parseISO(`1970-01-01T${entry.endTime}`), parseISO(`1970-01-01T${entry.startTime}`)) / 60,
            ]
        });

        doc.autoTable({
            startY: yPos,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: primaryColor }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    
    } else if (record.fileName === 'Leave Request Form') {
        // ... leave request logic ...
    } else {
        // Default PDF generation for other records
        yPos = addDefaultHeader(doc, record);

        record.data.forEach((section: any) => {
            if (typeof section !== 'object' || !section.category || !Array.isArray(section.items)) return;

            if (yPos > 250) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(section.category, 14, yPos);
            yPos += 8;

            const body = section.items.map((item: any) => {
                if (typeof item === 'object' && item.label) return [item.label, String(item.value)];
                if (typeof item === 'string') {
                    const parts = item.split(/:(.*)/s);
                    return parts.length > 1 ? [parts[0], parts[1].trim()] : [item, ''];
                }
                return [JSON.stringify(item), ''];
            });
            
            doc.autoTable({ startY: yPos, body: body, theme: 'plain', styles: { fontSize: 9 }, columnStyles: { 0: { fontStyle: 'bold' } } });
            yPos = doc.autoTable.previous.finalY + 10;
        });
    }

    addFooter(doc);
    doc.save(`${record.projectName}_${record.fileName}.pdf`);
};
