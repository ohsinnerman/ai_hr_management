import PDFDocument from 'pdfkit';

const fmt = (n, symbol = '₹') => `${symbol}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Render a payslip PDF and resolve a Buffer.
 * Layout: company header, employee details, earnings table, deductions table, net pay.
 */
export const generatePayslipPdf = ({ company, employee, payslip, period }) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const symbol = company?.settings?.currencySymbol || '₹';
      const left = 50;
      const rightCol = 320;

      // ── Header ────────────────────────────────────────────
      doc.fontSize(20).fillColor('#1a3a6b').text(company?.name || 'Company', left, 50);
      doc.fontSize(10).fillColor('#666666').text('Payslip', left, 76);
      doc
        .fontSize(10)
        .fillColor('#333333')
        .text(`Pay Period: ${period?.label || ''}`, rightCol, 52, { align: 'right', width: 225 })
        .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, rightCol, 68, { align: 'right', width: 225 });

      doc.moveTo(left, 96).lineTo(545, 96).strokeColor('#dddddd').stroke();

      // ── Employee details ──────────────────────────────────
      let y = 112;
      doc.fontSize(12).fillColor('#1a3a6b').text('Employee Details', left, y);
      y += 20;
      const detail = (label, value) => {
        doc.fontSize(9).fillColor('#666666').text(label, left, y);
        doc.fontSize(10).fillColor('#111111').text(String(value ?? '-'), left + 120, y);
        y += 16;
      };
      detail('Name', `${employee?.firstName ?? ''} ${employee?.lastName ?? ''}`.trim());
      detail('Employee Code', employee?.employeeCode);
      detail('Working Days', `${payslip.paidDays} paid / ${payslip.totalWorkingDays} total (${payslip.unpaidDays} unpaid)`);

      // ── Earnings & deductions tables ──────────────────────
      y += 12;
      const tableTop = y;
      doc.fontSize(12).fillColor('#1a3a6b').text('Earnings', left, y);
      doc.fontSize(12).fillColor('#1a3a6b').text('Deductions', rightCol, y);
      y += 20;

      const earnings = Object.entries(payslip.earnings || {});
      const deductions = Object.entries(payslip.deductions || {});
      const rows = Math.max(earnings.length, deductions.length);

      doc.fontSize(10);
      for (let i = 0; i < rows; i++) {
        const rowY = y + i * 16;
        if (earnings[i]) {
          doc.fillColor('#333333').text(earnings[i][0], left, rowY);
          doc.fillColor('#111111').text(fmt(earnings[i][1], symbol), left + 130, rowY, { width: 110, align: 'right' });
        }
        if (deductions[i]) {
          doc.fillColor('#333333').text(deductions[i][0], rightCol, rowY);
          doc.fillColor('#111111').text(fmt(deductions[i][1], symbol), rightCol + 130, rowY, { width: 95, align: 'right' });
        }
      }

      y = y + rows * 16 + 8;
      doc.moveTo(left, y).lineTo(545, y).strokeColor('#dddddd').stroke();
      y += 8;
      doc.fontSize(10).fillColor('#111111').text(`Gross: ${fmt(payslip.grossSalary, symbol)}`, left, y);
      doc.text(`Total Deductions: ${fmt(payslip.totalDeductions, symbol)}`, rightCol, y);

      // ── Net pay ───────────────────────────────────────────
      y += 28;
      doc.rect(left, y, 495, 36).fill('#1a3a6b');
      doc.fillColor('#ffffff').fontSize(13).text('Net Pay', left + 12, y + 11);
      doc.fontSize(15).text(fmt(payslip.netSalary, symbol), left + 12, y + 9, { width: 471, align: 'right' });

      doc.fillColor('#999999').fontSize(8).text('This is a system-generated payslip and does not require a signature.', left, y + 60, { width: 495, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
