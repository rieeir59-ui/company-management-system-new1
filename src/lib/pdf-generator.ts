
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
    const doc = new jsPDF({ orientation: 'portrait' }) as jsPDFWithAutoTable;
    let yPos = 15;
    
    if (record.fileName === 'Leave Request Form') {
        const employeeInfo = record.data?.find((d:any) => d.category === 'Employee Information')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
        const leaveDetails = record.data?.find((d:any) => d.category === 'Leave Details')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
        const hrInfo = record.data?.find((d:any) => d.category === 'HR Approval')?.items.reduce((acc:any, item:any) => ({...acc, [item.label]: item.value}), {}) || {};
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('LEAVE REQUEST FORM', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        doc.setFontSize(10);
        
        const addSectionHeader = (text: string) => {
            doc.setFont('helvetica', 'bold');
            doc.text(text, 14, yPos);
            yPos += 7;
            doc.setFont('helvetica', 'normal');
        };

        addSectionHeader('Employee Information');
        doc.autoTable({
            startY: yPos, theme: 'grid', showHead: false,
            body: [
                [`Employee Name: ${employeeInfo['Employee Name']}`, `Employee Number: ${employeeInfo['Employee Number']}`],
                [`Department: ${employeeInfo['Department']}`, `Position: ${employeeInfo['Position']}`],
            ]
        });
        yPos = doc.autoTable.previous.finalY + 5;
        
        doc.text(`Status (select one):`, 14, yPos);
        drawCheckbox(doc, 50, yPos, employeeInfo['Status'] === 'Full-time');
        doc.text('Full-time', 55, yPos);
        drawCheckbox(doc, 80, yPos, employeeInfo['Status'] === 'Part-time');
        doc.text('Part-time', 85, yPos);
        yPos += 10;
        
        addSectionHeader('Leave Details');
        const fromDate = leaveDetails['Leave From'] ? leaveDetails['Leave From'] : '( ____________ )';
        const toDate = leaveDetails['Leave To'] ? leaveDetails['Leave To'] : '( ____________ )';
        const returnDate = leaveDetails['Return Date'] ? leaveDetails['Return Date'] : '( ____________ )';
        doc.text(`I hereby request a leave of absence effective from ${fromDate} to ${toDate}`, 14, yPos);
        yPos += 7;
        doc.text(`Total Days: ${leaveDetails['Total Days']}`, 14, yPos);
        yPos += 7;
        doc.text(`I expect to return to work on Date: ${returnDate}`, 14, yPos);
        yPos += 10;
        
        addSectionHeader('Reason for Requested:');
        const reasons = leaveDetails['Leave Type']?.split(', ') || [];
        drawCheckbox(doc, 14, yPos, reasons.includes('Sick Leave'));
        doc.text('SICK LEAVE', 20, yPos);
        yPos += 7;
        drawCheckbox(doc, 14, yPos, reasons.includes('Casual Leave'));
        doc.text('CASUAL LEAVE', 20, yPos);
        yPos += 7;
        drawCheckbox(doc, 14, yPos, reasons.includes('Annual Leave'));
        doc.text('ANNUAL LEAVE', 20, yPos);
        yPos += 10;
        
        doc.text('REASON:', 14, yPos);
        yPos += 5;
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos);
        if (leaveDetails['Reason']) {
            doc.text(leaveDetails['Reason'], 16, yPos - 1);
        }
        yPos += 15;
        
        addSectionHeader('HR Department Approval:');
        drawCheckbox(doc, 14, yPos, hrInfo['Approved'] === 'true');
        doc.text('LEAVE APPROVED', 20, yPos);
        yPos += 7;
        drawCheckbox(doc, 14, yPos, hrInfo['Denied'] === 'true');
        doc.text('LEAVE DENIED', 20, yPos);
        yPos += 10;
        
        doc.text('REASON:', 14, yPos);
        yPos += 5;
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos);
        if (hrInfo['Reason']) {
            doc.text(hrInfo['Reason'], 16, yPos-1);
        }
        yPos += 10;
        
        doc.text('Date:', 14, yPos);
        doc.line(25, yPos+1, 70, yPos+1);
        yPos += 10;
        
        drawCheckbox(doc, 14, yPos, hrInfo['Paid Leave'] === 'true');
        doc.text('PAID LEAVE', 20, yPos);
        drawCheckbox(doc, 60, yPos, hrInfo['Unpaid Leave'] === 'true');
        doc.text('UNPAID LEAVE', 66, yPos);
        yPos += 20;

        doc.text('COMPANY CEO: SIGNATURE', 14, yPos);
        doc.text('DATE:', 150, yPos);
        yPos += 5;
        doc.line(14, y, 90, y);
        doc.line(160, y, 196, y);

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

