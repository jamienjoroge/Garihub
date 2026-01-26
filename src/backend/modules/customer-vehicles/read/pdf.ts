import PDFDocument from 'pdfkit';
import { EventLedger } from '../../core/event-ledger/Ledger';
import { projectVehicleHistory, projectInspectionSummary } from './models';

export async function generateVehicleHistoryPdf(ledger: EventLedger, tenant_id: string, vehicleId: string, tokenId?: string): Promise<Buffer> {
  const history = await projectVehicleHistory(ledger, tenant_id, vehicleId);
  const inspections = await projectInspectionSummary(ledger, tenant_id, vehicleId);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve) => {
    doc.on('data', (d) => chunks.push(Buffer.from(d)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text('Vehicle Service History', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown(1);

    doc.fontSize(14).text('Vehicle Details');
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Vehicle ID: ${history.vehicleId || ''}`);
    doc.text(`Make/Model: ${history.make || ''} ${history.model || ''}`);
    doc.text(`Year: ${history.year || ''}`);
    doc.text(`VIN: ${history.vin || ''}`);
    doc.moveDown(1);

    doc.fontSize(14).text('Timeline');
    doc.moveDown(0.5);
    (history.timeline || []).forEach((t: any) => {
      doc.fontSize(11).text(`${t.date} • ${t.type}`, { continued: false });
    });
    doc.moveDown(1);

    doc.fontSize(14).text('Inspection Summary');
    doc.moveDown(0.5);
    const list = (inspections.inspections || []) as any[];
    if (list.length) {
      list.forEach((i) => {
        doc.fontSize(11).text(`${i.date} • ${i.type} • ${i.passed ? 'PASS' : 'FAIL'}`);
      });
      doc.moveDown(0.5);
      if (inspections.lastInspectionDate) doc.fontSize(10).text(`Last Inspection: ${inspections.lastInspectionDate}`);
      if (inspections.lastResult) doc.text(`Last Result: ${inspections.lastResult}`);
    } else {
      doc.fontSize(11).text('No inspections recorded');
    }
    doc.moveDown(1);

    doc.fontSize(14).text('Verification');
    doc.moveDown(0.5);
    const baseUrl = 'https://example.com';
    const link = tokenId ? `${baseUrl}/public/vehicles/${vehicleId}/history?token=${tokenId}` : `${baseUrl}/public/vehicles/${vehicleId}/history`;
    doc.fontSize(11).text(`Public Link: ${link}`);
    doc.fontSize(10).text('Scan QR in app or use the link to verify');
    doc.end();
  });
}