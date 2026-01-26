import { EventLedger } from '../../../core/event-ledger/Ledger';
import { GrantNotificationProofAccessCommand } from './commands';
import { ValidationError } from '../../../core/errors/domain';

export class NotificationAccessService {
  constructor(private ledger: EventLedger) {}

  async grantProofAccess(cmd: GrantNotificationProofAccessCommand) {
    const events = await this.ledger.replay(cmd.metadata.tenant_id);
    const exists = events.some(e => e.event_name === 'NotificationRequested' && String((e.payload as any).notificationId) === cmd.payload.notificationId);
    if (!exists) throw new ValidationError('Notification not found');
    const evt = await this.ledger.append('NotificationProofAccessGranted', cmd.metadata, {
      notificationId: cmd.payload.notificationId,
      tokenId: cmd.payload.tokenId,
      expiresAt: cmd.payload.expiresAt,
      issuedBy: cmd.payload.issuedBy,
      reason: cmd.payload.reason,
    });
    return evt;
  }
}