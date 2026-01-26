import { EventLedger } from '../../../core/event-ledger/Ledger';
import { GrantVehicleHistoryAccessCommand } from './commands';
import { ValidationError } from '../../../core/errors/domain';

export class VehicleAccessService {
  constructor(private ledger: EventLedger) {}

  async grant(cmd: GrantVehicleHistoryAccessCommand) {
    const events = await this.ledger.replay(cmd.metadata.tenant_id);
    const exists = events.some(e => e.event_name === 'JobCardCreated' && e.payload.job?.vehicle?.id === cmd.payload.vehicleId);
    if (!exists) throw new ValidationError('Vehicle not found');
    const evt = await this.ledger.append('VehicleHistoryAccessGranted', cmd.metadata, {
      vehicleId: cmd.payload.vehicleId,
      tokenId: cmd.payload.tokenId,
      expiresAt: cmd.payload.expiresAt,
      issuedBy: cmd.payload.issuedBy,
      reason: cmd.payload.reason,
    });
    return evt;
  }
}