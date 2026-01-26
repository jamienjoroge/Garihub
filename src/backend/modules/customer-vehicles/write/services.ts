import { EventLedger } from '../../../core/event-ledger/Ledger';
import { MintServiceRecordCommand, RecordInspectionCommand } from './commands';
import { ValidationError } from '../../../core/errors/domain';

export class CustomerVehicleService {
  constructor(private ledger: EventLedger) {}

  async mintServiceRecord(cmd: MintServiceRecordCommand) {
    const events = await this.ledger.replay(cmd.metadata.tenant_id);
    const jobDone = events.some(e => e.event_name === 'JobCompleted' && e.payload.entityId === cmd.payload.jobId);
    if (!jobDone) throw new ValidationError('Job not completed');
    const evt = await this.ledger.append('ServiceRecordMinted', cmd.metadata, {
      vehicleId: cmd.payload.vehicleId,
      jobId: cmd.payload.jobId,
      date: cmd.payload.date,
      summary: cmd.payload.summary,
      mileage: cmd.payload.mileage,
    });
    return evt;
  }

  async recordInspection(cmd: RecordInspectionCommand) {
    const evt = await this.ledger.append('InspectionRecorded', cmd.metadata, {
      inspectionId: cmd.payload.inspectionId,
      vehicleId: cmd.payload.vehicleId,
      inspectorId: cmd.payload.inspectorId,
      inspectionType: cmd.payload.inspectionType,
      findings: cmd.payload.findings,
      passed: cmd.payload.passed,
      notes: cmd.payload.notes,
      date: cmd.payload.date,
    });
    return evt;
  }
}